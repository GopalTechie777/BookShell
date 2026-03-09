const express = require('express');
const { param } = require('express-validator');
const { eq, and, lt, gt, asc, desc } = require('drizzle-orm');
const { db } = require('../db');
const { books, chapters } = require('../db/schema');
const validate = require('../middleware/validate');

const router = express.Router({ mergeParams: true });

// GET /api/v1/books/:id/chapters — list chapters (id, title, order only — no content)
router.get(
  '/',
  [param('id').isUUID().withMessage('Invalid book id')],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const bookExists = await db.query.books.findFirst({
        where: (b, { eq }) => eq(b.id, id),
        columns: { id: true },
      });

      if (!bookExists) {
        return res.status(404).json({
          error: { message: 'Book not found', status: 404 },
        });
      }

      const result = await db
        .select({ id: chapters.id, title: chapters.title, order: chapters.order })
        .from(chapters)
        .where(eq(chapters.bookId, id))
        .orderBy(asc(chapters.order));

      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/books/:id/chapters/:chapterId — full chapter content + prev/next nav
router.get(
  '/:chapterId',
  [
    param('id').isUUID().withMessage('Invalid book id'),
    param('chapterId').isUUID().withMessage('Invalid chapter id'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id, chapterId } = req.params;

      const chapter = await db.query.chapters.findFirst({
        where: (ch, { eq, and }) => and(eq(ch.id, chapterId), eq(ch.bookId, id)),
      });

      if (!chapter) {
        return res.status(404).json({
          error: { message: 'Chapter not found', status: 404 },
        });
      }

      // Prev / next navigation
      const [prevResult, nextResult] = await Promise.all([
        db
          .select({ id: chapters.id, title: chapters.title, order: chapters.order })
          .from(chapters)
          .where(and(eq(chapters.bookId, id), lt(chapters.order, chapter.order)))
          .orderBy(desc(chapters.order))
          .limit(1),
        db
          .select({ id: chapters.id, title: chapters.title, order: chapters.order })
          .from(chapters)
          .where(and(eq(chapters.bookId, id), gt(chapters.order, chapter.order)))
          .orderBy(asc(chapters.order))
          .limit(1),
      ]);

      res.json({
        data: chapter,
        prev: prevResult[0] || null,
        next: nextResult[0] || null,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
