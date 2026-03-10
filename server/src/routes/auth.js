const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { eq, or } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema');
const validate = require('../middleware/validate');
const userAuth = require('../middleware/userAuth');

const router = express.Router();

// ── POST /api/v1/auth/signup ─────────────────────────────────────────────
router.post(
  '/signup',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail()
      .isLength({ max: 255 }).withMessage('Email too long'),
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username may only contain letters, numbers, _ and -'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, username, password } = req.body;

      // Check if email or username is already taken
      const [existing] = await db
        .select({ id: users.id, email: users.email, username: users.username })
        .from(users)
        .where(or(eq(users.email, email), eq(users.username, username)))
        .limit(1);

      if (existing) {
        const field = existing.email === email ? 'email' : 'username';
        return res.status(409).json({
          error: {
            message: `That ${field} is already registered`,
            field,
            status: 409,
          },
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [user] = await db
        .insert(users)
        .values({ email, username, passwordHash })
        .returning({ id: users.id, email: users.email, username: users.username });

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        data: { token, user: { id: user.id, email: user.email, username: user.username } },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/v1/auth/login ──────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      // Use a constant-time compare even on miss (timing-safe)
      const dummyHash = '$2b$10$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn';
      const valid = user
        ? await bcrypt.compare(password, user.passwordHash)
        : await bcrypt.compare(password, dummyHash).then(() => false);

      if (!user || !valid) {
        return res.status(401).json({
          error: { message: 'Invalid email or password', status: 401 },
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        data: { token, user: { id: user.id, email: user.email, username: user.username } },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────
// Returns the profile of the currently authenticated user.
router.get('/me', userAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, username: users.username, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 },
      });
    }

    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
