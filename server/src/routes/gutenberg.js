const express = require('express');
const { query } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();
const GUTENDEX_BASE = 'https://gutendex.com';
const GUTENBERG_BASE = 'https://www.gutenberg.org';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, attempts = 2) {
  let lastErr;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastErr = err;

      const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
      const isLastAttempt = i === attempts - 1;

      if (!isTimeout || isLastAttempt) {
        throw err;
      }

      // Brief backoff before retrying transient upstream timeouts.
      await sleep(350 * (i + 1));
    }
  }

  throw lastErr;
}

function decodeXmlEntities(input = '') {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([\da-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decodeXmlEntities(m[1].trim()) : '';
}

async function searchViaGutendex(q, page) {
  const url = `${GUTENDEX_BASE}/books?search=${encodeURIComponent(q)}&page=${page}`;

  const response = await fetchWithRetry(
    url,
    {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    },
    2
  );

  if (!response.ok) {
    const err = new Error('Gutendex unavailable');
    err.status = response.status;
    throw err;
  }

  const data = await response.json();

  const results = (data.results || []).map((book) => {
    const authors = Array.isArray(book.authors) ? book.authors : [];
    const formats = book.formats && typeof book.formats === 'object' ? book.formats : {};
    return {
      gutenbergId: book.id,
      title: book.title || 'Untitled',
      author: authors.length > 0 ? authors.map((a) => a.name).join(', ') : 'Unknown Author',
      coverImage: formats['image/jpeg'] || null,
      subjects: (Array.isArray(book.subjects) ? book.subjects : []).slice(0, 3),
      downloadCount: book.download_count || 0,
      hasText: !!(
        Object.keys(formats).some((k) => k.startsWith('text/plain')) ||
        formats['text/html']
      ),
    };
  });

  return {
    data: results,
    total: data.count || 0,
    hasNext: !!data.next,
    hasPrev: !!data.previous,
    page,
  };
}

async function searchViaOpds(q, page) {
  const pageSize = 25;
  const startIndex = (page - 1) * pageSize + 1;
  const url = `${GUTENBERG_BASE}/ebooks/search.opds/?query=${encodeURIComponent(q)}&start_index=${startIndex}`;

  const response = await fetchWithRetry(
    url,
    {
      headers: { Accept: 'application/atom+xml, application/xml;q=0.9, */*;q=0.8' },
      signal: AbortSignal.timeout(12000),
    },
    2
  );

  if (!response.ok) {
    const err = new Error('Gutenberg OPDS unavailable');
    err.status = response.status;
    throw err;
  }

  const xml = await response.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

  const results = entries
    .map((m) => m[1])
    .map((entryXml) => {
      const idMatch = entryXml.match(/<id>https?:\/\/www\.gutenberg\.org\/ebooks\/(\d+)\.opds<\/id>/i);
      if (!idMatch) return null;

      const gutenbergId = Number(idMatch[1]);
      const title = extractTag(entryXml, 'title') || 'Untitled';
      const rawAuthor = extractTag(entryXml, 'content');
      const author = (rawAuthor || 'Unknown Author').replace(/\s*\d+\s+downloads?\s*$/i, '').trim();

      return {
        gutenbergId,
        title,
        author,
        coverImage: `${GUTENBERG_BASE}/cache/epub/${gutenbergId}/pg${gutenbergId}.cover.medium.jpg`,
        subjects: [],
        downloadCount: 0,
        hasText: true,
      };
    })
    .filter(Boolean);

  const hasNext = /<link[^>]*rel="next"[^>]*>/i.test(xml);
  const hasPrev = /<link[^>]*rel="previous"[^>]*>/i.test(xml);
  const total = hasNext ? page * pageSize + 1 : (page - 1) * pageSize + results.length;

  return {
    data: results,
    total,
    hasNext,
    hasPrev,
    page,
  };
}

// GET /api/v1/gutenberg/search?q=&page=1
// Proxies Gutendex API — returns formatted results for the frontend
router.get(
  '/search',
  [
    query('q')
      .trim()
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ max: 200 })
      .withMessage('Search query too long'),
    query('page').optional().isInt({ min: 1 }).toInt(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const q = req.query.q.trim();
      const page = req.query.page || 1;
      try {
        const payload = await searchViaGutendex(q, page);
        return res.json(payload);
      } catch (_gutendexErr) {
        const fallbackPayload = await searchViaOpds(q, page);
        return res.json(fallbackPayload);
      }
    } catch (err) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        return res.status(504).json({
          error: {
            message: 'Project Gutenberg search sources timed out. Please try again shortly.',
            status: 504,
          },
        });
      }
      next(err);
    }
  }
);

module.exports = router;
