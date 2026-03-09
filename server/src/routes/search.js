const express = require('express');
const { query } = require('express-validator');
const { sql, ilike, or, count } = require('drizzle-orm');
const { db } = require('../db');
const { books, categories } = require('../db/schema');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/v1/search?q= — full-text search on title + author
router.get(
  '/',
  [
    query('q')
      .trim()
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ max: 200 })
      .withMessage('Search query too long'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const q = req.query.q.trim();
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;

      let data = [];
      let total = 0;

      try {
        // PostgreSQL full-text search via Drizzle sql`` tag
        // Convert multi-word input to tsquery AND terms: "dark matter" → "dark & matter"
        const tsQuery = q.split(/\s+/).join(' & ');

        const ftsResults = await db.execute(sql`
          SELECT
            b.id::text,
            b.title,
            b.author,
            b.description,
            b.cover_image   AS "coverImage",
            b.is_featured   AS "isFeatured",
            b.created_at    AS "createdAt",
            c.id::text      AS "categoryId",
            c.name          AS "categoryName"
          FROM books b
          LEFT JOIN categories c ON b.category_id = c.id
          WHERE to_tsvector('english', b.title || ' ' || b.author)
                @@ to_tsquery('english', ${tsQuery})
          ORDER BY ts_rank(
            to_tsvector('english', b.title || ' ' || b.author),
            to_tsquery('english', ${tsQuery})
          ) DESC
          LIMIT ${limit} OFFSET ${offset}
        `);

        const countResult = await db.execute(sql`
          SELECT COUNT(*)::int AS total
          FROM books b
          WHERE to_tsvector('english', b.title || ' ' || b.author)
                @@ to_tsquery('english', ${tsQuery})
        `);

        data = ftsResults.map((r) => ({
          id: r.id,
          title: r.title,
          author: r.author,
          description: r.description,
          coverImage: r.coverImage,
          isFeatured: r.isFeatured,
          createdAt: r.createdAt,
          category: r.categoryId ? { id: r.categoryId, name: r.categoryName } : null,
        }));
        total = Number(countResult[0]?.total ?? 0);
      } catch (_ftsErr) {
        // Fallback: ILIKE search if FTS fails (e.g. bad tsquery input)
        const condition = or(ilike(books.title, `%${q}%`), ilike(books.author, `%${q}%`));

        const [rows, [{ cnt }]] = await Promise.all([
          db.query.books.findMany({
            where: () => condition,
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
          db.select({ cnt: count() }).from(books).where(condition),
        ]);

        data = rows;
        total = Number(cnt);
      }

      res.json({ data, page, limit, total, query: q });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
