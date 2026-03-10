'use strict';

/**
 * Strips the Project Gutenberg license header and footer boilerplate.
 */
function stripGutenbergBoilerplate(text) {
  const startRe = /\*{3}\s*START OF (?:THE |THIS )?PROJECT GUTENBERG[^\n]*/i;
  const endRe = /\*{3}\s*END OF (?:THE |THIS )?PROJECT GUTENBERG/i;

  let content = text;

  const startIdx = content.search(startRe);
  if (startIdx !== -1) {
    const nlIdx = content.indexOf('\n', startIdx);
    content = nlIdx !== -1 ? content.slice(nlIdx + 1) : content.slice(startIdx);
  }

  const endIdx = content.search(endRe);
  if (endIdx !== -1) {
    content = content.slice(0, endIdx);
  }

  return content.trim();
}

/**
 * Strips HTML tags and converts block elements to newlines,
 * then decodes common HTML entities.
 */
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6]|blockquote|section|article)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&nbsp;/g, ' ');
}

/**
 * Converts plain text (paragraph-separated by blank lines) into safe HTML.
 */
function textToHtml(text) {
  return text
    .split(/\n{2,}/)
    .map((para) => para.replace(/\n/g, ' ').trim())
    .filter((para) => para.length > 0)
    .map((para) => {
      const escaped = para
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<p>${escaped}</p>`;
    })
    .join('\n');
}

/**
 * Detects a chapter heading line.
 *
 * Matches patterns like:
 *   Chapter 1       Chapter I           CHAPTER IV.
 *   PART II         Book Three          Section 12
 *   Chapter One     CHAPTER THE FIRST
 *
 * The line must be short (≤ 200 chars) so we don't accidentally treat
 * prose that begins with "Chapter" as a heading.
 */
const CHAPTER_LINE_RE =
  /^(?:chapter|part|book|section)\s+(?:\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?|thirty|forty|fifty|sixty|seventy|eighty|ninety|(?:the\s+)?(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last))[\s.:,;—\-]*/i;

function isChapterHeading(line) {
  return line.length <= 200 && CHAPTER_LINE_RE.test(line);
}

/**
 * Splits the book content into equal-sized word chunks.
 * Used as a fallback when chapter heading detection finds too few sections.
 */
function splitIntoWordChunks(content, wordsPerChunk = 3000) {
  const words = content.split(/\s+/).filter((w) => w.length > 0);
  const chunks = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  return chunks.map((chunk, i) => ({
    title: `Part ${i + 1}`,
    content: textToHtml(chunk),
  }));
}

/**
 * Safely truncates a chapter title to fit in VARCHAR(255).
 */
function safeTitle(raw) {
  if (!raw) return 'Untitled';
  const t = raw.trim();
  return t.length > 252 ? t.slice(0, 249) + '...' : t;
}

/**
 * Splits a Gutenberg text (plain or HTML) into an array of
 * { title: string, content: string (HTML) } objects.
 *
 * @param {string} rawText  - The downloaded book content
 * @param {boolean} isHtml  - True when rawText is HTML (triggers tag stripping)
 */
function parseChapters(rawText, isHtml = false) {
  let text = rawText;

  if (isHtml) {
    text = stripHtml(text);
  }

  const content = stripGutenbergBoilerplate(text);

  // Normalise Windows / old Mac line endings
  const normalised = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalised.split('\n');

  const sections = [];
  let currentTitle = null;
  let currentLines = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (isChapterHeading(trimmed)) {
      // Flush the current section (no minimum length — store all content)
      if (currentTitle !== null) {
        const body = currentLines.join('\n').trim();
        if (body.length > 0) {
          sections.push({ title: safeTitle(currentTitle), body });
        }
      }
      currentTitle = trimmed;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Flush the final section
  if (currentTitle !== null) {
    const body = currentLines.join('\n').trim();
    if (body.length > 0) {
      sections.push({ title: safeTitle(currentTitle), body });
    }
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  // If very few chapter headings were detected but the book is clearly long,
  // split by word count so the reader always gets the full text.
  const totalWords = normalised.split(/\s+/).filter((w) => w.length > 0).length;
  if (sections.length < 3 && totalWords > 5000) {
    return splitIntoWordChunks(normalised);
  }

  // If nothing at all, return the whole book as one chapter
  if (sections.length === 0) {
    return [{ title: 'Full Text', content: textToHtml(content) }];
  }

  return sections.map((s) => ({
    title: s.title,
    content: textToHtml(s.body),
  }));
}

/**
 * Picks the best readable text format URL from the Gutendex "formats" map.
 * Returns { url, isHtml } or null if nothing readable is found.
 */
function pickFormatUrl(formats) {
  // Prefer plain text (any charset) over HTML
  const plainKey = Object.keys(formats).find((k) => k.startsWith('text/plain'));
  if (plainKey) return { url: formats[plainKey], isHtml: false };

  // Accept HTML as a second choice
  const htmlKey = Object.keys(formats).find((k) => k.startsWith('text/html'));
  if (htmlKey) return { url: formats[htmlKey], isHtml: true };

  // Last resort: any text/* format
  const anyKey = Object.keys(formats).find((k) => k.startsWith('text/'));
  if (anyKey) return { url: formats[anyKey], isHtml: anyKey.includes('html') };

  return null;
}

module.exports = { parseChapters, pickFormatUrl, textToHtml };
