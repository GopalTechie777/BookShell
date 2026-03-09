const express = require('express');
const { body, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { eq } = require('drizzle-orm');
const { db } = require('../../db');
const { books } = require('../../db/schema');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = express.Router();

// ── Multer config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

router.use(auth);

// POST /api/v1/admin/books
router.post(
  '/',
  upload.single('coverImage'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('description').optional().trim(),
    body('categoryId').optional({ nullable: true }).isUUID().withMessage('Invalid category id'),
    body('isFeatured').optional().isBoolean().toBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, author, description, categoryId, isFeatured } = req.body;
      const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

      const [book] = await db
        .insert(books)
        .values({
          title,
          author,
          description: description || null,
          coverImage,
          isFeatured: isFeatured ?? false,
          categoryId: categoryId || null,
        })
        .returning();

      // Fetch with category relation
      const full = await db.query.books.findFirst({
        where: (b, { eq }) => eq(b.id, book.id),
        with: { category: { columns: { id: true, name: true } } },
      });

      res.status(201).json({ data: full });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/admin/books/:id
router.put(
  '/:id',
  [param('id').isUUID().withMessage('Invalid book id')],
  upload.single('coverImage'),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('author').optional().trim().notEmpty().withMessage('Author cannot be empty'),
    body('description').optional().trim(),
    body('categoryId').optional({ nullable: true }).isUUID().withMessage('Invalid category id'),
    body('isFeatured').optional().isBoolean().toBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, author, description, categoryId, isFeatured } = req.body;

      const [existing] = await db
        .select({ id: books.id })
        .from(books)
        .where(eq(books.id, id))
        .limit(1);

      if (!existing) {
        return res.status(404).json({
          error: { message: 'Book not found', status: 404 },
        });
      }

      const updateData = { updatedAt: new Date() };
      if (title !== undefined) updateData.title = title;
      if (author !== undefined) updateData.author = author;
      if (description !== undefined) updateData.description = description;
      if (categoryId !== undefined) updateData.categoryId = categoryId || null;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (req.file) updateData.coverImage = `/uploads/${req.file.filename}`;

      await db.update(books).set(updateData).where(eq(books.id, id));

      const full = await db.query.books.findFirst({
        where: (b, { eq }) => eq(b.id, id),
        with: { category: { columns: { id: true, name: true } } },
      });

      res.json({ data: full });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/admin/books/:id
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid book id')],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const [existing] = await db
        .select({ id: books.id })
        .from(books)
        .where(eq(books.id, id))
        .limit(1);

      if (!existing) {
        return res.status(404).json({
          error: { message: 'Book not found', status: 404 },
        });
      }

      // Chapters cascade-delete via FK onDelete: 'cascade'
      await db.delete(books).where(eq(books.id, id));

      res.json({ data: { message: 'Book deleted' } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
