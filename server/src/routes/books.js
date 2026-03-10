const express = require('express');
const { query, param } = require('express-validator');
const { eq, desc, count, and } = require('drizzle-orm');
const { db } = require('../db');
const { books } = require('../db/schema');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/v1/books — list books (paginated, optional featured filter)
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('featured').optional().isBoolean().toBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (req.query.featured !== undefined) {
        conditions.push(eq(books.isFeatured, req.query.featured));
      }
      const where = conditions.length ? and(...conditions) : undefined;

      const [rows, [{ total }]] = await Promise.all([
        db.query.books.findMany({
          where: where ? () => where : undefined,
          with: { category: { columns: { id: true, name: true } } },
          orderBy: (b, { desc }) => [desc(b.createdAt)],
          limit,
          offset,
          columns: {
            id: true,
            title: true,
            author: true,
            description: true,
            coverImage: true,
            isFeatured: true,
            source: true,
            gutenbergId: true,
            createdAt: true,
          },
        }),
        db.select({ total: count() }).from(books).where(where),
      ]);

      res.json({ data: rows, page, limit, total: Number(total) });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/books/:id — single book with category + chapter list
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid book id')],
  validate,
  async (req, res, next) => {
    try {
      const book = await db.query.books.findFirst({
        where: (b, { eq }) => eq(b.id, req.params.id),
        with: {
          category: { columns: { id: true, name: true } },
          chapters: {
            columns: { id: true, title: true, order: true },
            orderBy: (ch, { asc }) => [asc(ch.order)],
          },
        },
      });

      if (!book) {
        return res.status(404).json({
          error: { message: 'Book not found', status: 404 },
        });
      }

      res.json({ data: book });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
