const express = require('express');
const { body, param } = require('express-validator');
const { eq } = require('drizzle-orm');
const { db } = require('../../db');
const { books, chapters } = require('../../db/schema');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { parseChapters, pickFormatUrl } = require('../../utils/gutenbergParser');

const router = express.Router();
const GUTENDEX_BASE = 'https://gutendex.com';

router.use(auth);

// POST /api/v1/admin/gutenberg/import
// Fetches a Project Gutenberg book by ID, parses chapters, saves to DB.
router.post(
  '/import',
  [
    body('gutenbergId')
      .isInt({ min: 1 })
      .toInt()
      .withMessage('gutenbergId must be a positive integer'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { gutenbergId } = req.body;

      // Prevent duplicate imports
      const [existing] = await db
        .select({ id: books.id, title: books.title })
        .from(books)
        .where(eq(books.gutenbergId, gutenbergId))
        .limit(1);

      if (existing) {
        return res.status(409).json({
          error: {
            message: 'This book is already in your library',
            bookId: existing.id,
            status: 409,
          },
        });
      }

      // Fetch book metadata from Gutendex
      const metaRes = await fetch(`${GUTENDEX_BASE}/books/${gutenbergId}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!metaRes.ok) {
        return res.status(404).json({
          error: { message: 'Book not found on Project Gutenberg', status: 404 },
        });
      }

      const meta = await metaRes.json();

      const title = meta.title || 'Untitled';
      const author =
        meta.authors && meta.authors.length > 0
          ? meta.authors.map((a) => a.name).join(', ')
          : 'Unknown Author';
      const coverImage = meta.formats['image/jpeg'] || null;
      // Store top subjects as description
      const description =
        meta.subjects && meta.subjects.length > 0
          ? meta.subjects.slice(0, 5).join('; ')
          : null;

      // Pick best text format
      const formatInfo = pickFormatUrl(meta.formats);
      if (!formatInfo) {
        return res.status(422).json({
          error: {
            message: 'No readable text format is available for this book',
            status: 422,
          },
        });
      }

      // Download the full text
      const textRes = await fetch(formatInfo.url, {
        signal: AbortSignal.timeout(60000),
      });

      if (!textRes.ok) {
        return res.status(502).json({
          error: {
            message: 'Failed to download book content from Project Gutenberg',
            status: 502,
          },
        });
      }

      const rawText = await textRes.text();

      // Parse into chapters — pass isHtml so the parser can strip tags if needed
      const parsedChapters = parseChapters(rawText, formatInfo.isHtml);

      // Insert book + all chapters atomically
      let savedBook;
      await db.transaction(async (tx) => {
        const [newBook] = await tx
          .insert(books)
          .values({
            title,
            author,
            description,
            coverImage,
            isFeatured: false,
            source: 'gutenberg',
            gutenbergId,
          })
          .returning();

        savedBook = newBook;

        for (let i = 0; i < parsedChapters.length; i++) {
          await tx.insert(chapters).values({
            bookId: newBook.id,
            title: parsedChapters[i].title,
            content: parsedChapters[i].content,
            order: i + 1,
          });
        }
      });

      res.status(201).json({
        data: {
          book: savedBook,
          chaptersImported: parsedChapters.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/admin/gutenberg/reimport
// Deletes all existing chapters for a Gutenberg book and re-downloads + re-parses them.
// Use this to fix a book that was imported with an older/broken parser.
router.put(
  '/reimport',
  [
    body('bookId').isUUID().withMessage('bookId must be a valid UUID'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { bookId } = req.body;

      // Fetch the book record — must exist and must be a Gutenberg book
      const [book] = await db
        .select({ id: books.id, title: books.title, gutenbergId: books.gutenbergId, source: books.source })
        .from(books)
        .where(eq(books.id, bookId))
        .limit(1);

      if (!book) {
        return res.status(404).json({
          error: { message: 'Book not found', status: 404 },
        });
      }

      if (book.source !== 'gutenberg' || !book.gutenbergId) {
        return res.status(422).json({
          error: { message: 'This book was not imported from Project Gutenberg', status: 422 },
        });
      }

      // Fetch fresh metadata from Gutendex (in case format URLs have changed)
      const metaRes = await fetch(`${GUTENDEX_BASE}/books/${book.gutenbergId}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!metaRes.ok) {
        return res.status(502).json({
          error: { message: 'Could not reach Project Gutenberg to re-download', status: 502 },
        });
      }

      const meta = await metaRes.json();
      const formatInfo = pickFormatUrl(meta.formats);

      if (!formatInfo) {
        return res.status(422).json({
          error: { message: 'No readable text format found for this book', status: 422 },
        });
      }

      // Download full text
      const textRes = await fetch(formatInfo.url, {
        signal: AbortSignal.timeout(60000),
      });

      if (!textRes.ok) {
        return res.status(502).json({
          error: { message: 'Failed to download book content from Project Gutenberg', status: 502 },
        });
      }

      const rawText = await textRes.text();
      const parsedChapters = parseChapters(rawText, formatInfo.isHtml);

      // Swap chapters atomically: delete all old, insert all new
      await db.transaction(async (tx) => {
        await tx.delete(chapters).where(eq(chapters.bookId, bookId));

        for (let i = 0; i < parsedChapters.length; i++) {
          await tx.insert(chapters).values({
            bookId,
            title: parsedChapters[i].title,
            content: parsedChapters[i].content,
            order: i + 1,
          });
        }
      });

      res.json({
        data: {
          bookId,
          title: book.title,
          chaptersImported: parsedChapters.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
