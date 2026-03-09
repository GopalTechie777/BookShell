const express = require('express');
const { body, param } = require('express-validator');
const { eq, and } = require('drizzle-orm');
const { db } = require('../../db');
const { books, chapters } = require('../../db/schema');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = express.Router({ mergeParams: true });
router.use(auth);

// POST /api/v1/admin/books/:id/chapters
router.post(
  '/',
  [
    param('id').isUUID().withMessage('Invalid book id'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('order').isInt({ min: 1 }).withMessage('Order must be a positive integer').toInt(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, content, order } = req.body;

      const [bookExists] = await db
        .select({ id: books.id })
        .from(books)
        .where(eq(books.id, id))
        .limit(1);

      if (!bookExists) {
        return res.status(404).json({
          error: { message: 'Book not found', status: 404 },
        });
      }

      const [chapter] = await db
        .insert(chapters)
        .values({ bookId: id, title, content, order })
        .returning();

      res.status(201).json({ data: chapter });
    } catch (err) {
      // PostgreSQL unique violation
      if (err.code === '23505') {
        return res.status(409).json({
          error: {
            message: 'A chapter with that order already exists for this book',
            status: 409,
          },
        });
      }
      next(err);
    }
  }
);

// PUT /api/v1/admin/chapters/:chapterId
router.put(
  '/:chapterId',
  [
    param('chapterId').isUUID().withMessage('Invalid chapter id'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().notEmpty().withMessage('Content cannot be empty'),
    body('order').optional().isInt({ min: 1 }).withMessage('Order must be positive').toInt(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { chapterId } = req.params;
      const { title, content, order } = req.body;

      const [existing] = await db
        .select({ id: chapters.id })
        .from(chapters)
        .where(eq(chapters.id, chapterId))
        .limit(1);

      if (!existing) {
        return res.status(404).json({
          error: { message: 'Chapter not found', status: 404 },
        });
      }

      const updateData = { updatedAt: new Date() };
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (order !== undefined) updateData.order = order;

      const [updated] = await db
        .update(chapters)
        .set(updateData)
        .where(eq(chapters.id, chapterId))
        .returning();

      res.json({ data: updated });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({
          error: {
            message: 'A chapter with that order already exists for this book',
            status: 409,
          },
        });
      }
      next(err);
    }
  }
);

// DELETE /api/v1/admin/chapters/:chapterId
router.delete(
  '/:chapterId',
  [param('chapterId').isUUID().withMessage('Invalid chapter id')],
  validate,
  async (req, res, next) => {
    try {
      const { chapterId } = req.params;

      const [existing] = await db
        .select({ id: chapters.id })
        .from(chapters)
        .where(eq(chapters.id, chapterId))
        .limit(1);

      if (!existing) {
        return res.status(404).json({
          error: { message: 'Chapter not found', status: 404 },
        });
      }

      await db.delete(chapters).where(eq(chapters.id, chapterId));

      res.json({ data: { message: 'Chapter deleted' } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
