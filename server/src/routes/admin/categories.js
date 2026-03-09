const express = require('express');
const { body, param } = require('express-validator');
const { eq } = require('drizzle-orm');
const { db } = require('../../db');
const { categories } = require('../../db/schema');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = express.Router();
router.use(auth);

// POST /api/v1/admin/categories
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name too long'),
    body('description').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, description } = req.body;

      const [existing] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.name, name))
        .limit(1);

      if (existing) {
        return res.status(409).json({
          error: { message: 'Category name already exists', status: 409 },
        });
      }

      const [category] = await db
        .insert(categories)
        .values({ name, description: description || null })
        .returning();

      res.status(201).json({ data: category });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/admin/categories/:id
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid category id'),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name too long'),
    body('description').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const [existing] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (!existing) {
        return res.status(404).json({
          error: { message: 'Category not found', status: 404 },
        });
      }

      if (name && name !== existing.name) {
        const [conflict] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.name, name))
          .limit(1);

        if (conflict) {
          return res.status(409).json({
            error: { message: 'Category name already exists', status: 409 },
          });
        }
      }

      const updateData = { updatedAt: new Date() };
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      const [updated] = await db
        .update(categories)
        .set(updateData)
        .where(eq(categories.id, id))
        .returning();

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/admin/categories/:id
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid category id')],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const [existing] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (!existing) {
        return res.status(404).json({
          error: { message: 'Category not found', status: 404 },
        });
      }

      // books.categoryId SET NULL via FK onDelete: 'set null' in schema
      await db.delete(categories).where(eq(categories.id, id));

      res.json({ data: { message: 'Category deleted' } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
