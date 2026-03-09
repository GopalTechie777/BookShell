const express = require('express');
const { query, param } = require('express-validator');
const { eq, asc, count } = require('drizzle-orm');
const { db } = require('../db');
const { categories, books } = require('../db/schema');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/v1/categories — list all categories with book count
router.get('/', async (req, res, next) => {
  try {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .orderBy(asc(categories.name));

    // Attach book counts
    const counts = await db
      .select({ categoryId: books.categoryId, count: count() })
      .from(books)
      .groupBy(books.categoryId);

    const countMap = Object.fromEntries(counts.map((c) => [c.categoryId, Number(c.count)]));

    const data = result.map((cat) => ({
      ...cat,
      bookCount: countMap[cat.id] || 0,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/categories/:id/books — books in a category (paginated)
router.get(
  '/:id/books',
  [
    param('id').isUUID().withMessage('Invalid category id'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;

      const [rows, [{ total }]] = await Promise.all([
        db.query.books.findMany({
          where: (b, { eq }) => eq(b.categoryId, id),
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
            createdAt: true,
          },
        }),
        db.select({ total: count() }).from(books).where(eq(books.categoryId, id)),
      ]);

      res.json({ data: rows, page, limit, total: Number(total) });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
