const express = require('express');
const { query } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();
const GUTENDEX_BASE = 'https://gutendex.com';

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

      // Gutendex returns up to 32 results per page
      const url = `${GUTENDEX_BASE}/books?search=${encodeURIComponent(q)}&page=${page}`;

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return res
          .status(502)
          .json({ error: { message: 'Gutenberg search unavailable', status: 502 } });
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

      res.json({
        data: results,
        total: data.count || 0,
        hasNext: !!data.next,
        hasPrev: !!data.previous,
        page,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
