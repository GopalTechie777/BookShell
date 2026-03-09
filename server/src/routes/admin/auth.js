const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const { db } = require('../../db');
const { admins } = require('../../db/schema');
const validate = require('../../middleware/validate');

const router = express.Router();

// POST /api/v1/admin/login
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.username, username))
        .limit(1);

      if (!admin) {
        return res.status(401).json({
          error: { message: 'Invalid credentials', status: 401 },
        });
      }

      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) {
        return res.status(401).json({
          error: { message: 'Invalid credentials', status: 401 },
        });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ data: { token, username: admin.username } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
