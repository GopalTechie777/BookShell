const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { eq, or, and, isNull } = require('drizzle-orm');
const { db } = require('../db');
const { users, signupOtps } = require('../db/schema');
const validate = require('../middleware/validate');
const userAuth = require('../middleware/userAuth');
const { sendSignupOtpEmail } = require('../utils/mailer');

const router = express.Router();

// ── POST /api/v1/auth/signup/request-otp ──────────────────────────────────
router.post(
  '/signup/request-otp',
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

      // Prevent username collisions across pending OTPs (except same email)
      const [pending] = await db
        .select({ id: signupOtps.id, email: signupOtps.email, username: signupOtps.username })
        .from(signupOtps)
        .where(or(eq(signupOtps.email, email), eq(signupOtps.username, username)))
        .limit(1);

      if (pending && pending.email !== email) {
        return res.status(409).json({
          error: {
            message: 'That username is already pending verification',
            field: 'username',
            status: 409,
          },
        });
      }

      const otp = String(crypto.randomInt(100000, 1000000));
      const otpHash = await bcrypt.hash(otp, 10);
      const passwordHash = await bcrypt.hash(password, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db
        .insert(signupOtps)
        .values({ email, username, passwordHash, otpHash, expiresAt })
        .onConflictDoUpdate({
          target: signupOtps.email,
          set: {
            username,
            passwordHash,
            otpHash,
            expiresAt,
            consumedAt: null,
            createdAt: new Date(),
          },
        });

      await sendSignupOtpEmail({ to: email, otp });

      res.status(200).json({
        data: { message: 'OTP sent to your email' },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/v1/auth/signup/verify ───────────────────────────────────────
router.post(
  '/signup/verify',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
      .isNumeric().withMessage('OTP must be numeric'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      const [pending] = await db
        .select()
        .from(signupOtps)
        .where(and(eq(signupOtps.email, email), isNull(signupOtps.consumedAt)))
        .limit(1);

      if (!pending) {
        return res.status(400).json({
          error: { message: 'No pending signup for this email', status: 400 },
        });
      }

      if (pending.expiresAt < new Date()) {
        return res.status(400).json({
          error: { message: 'OTP expired, please request a new one', status: 400 },
        });
      }

      const valid = await bcrypt.compare(otp, pending.otpHash);
      if (!valid) {
        return res.status(401).json({
          error: { message: 'Invalid OTP', status: 401 },
        });
      }

      const [user] = await db
        .insert(users)
        .values({
          email: pending.email,
          username: pending.username,
          passwordHash: pending.passwordHash,
        })
        .returning({ id: users.id, email: users.email, username: users.username });

      await db
        .delete(signupOtps)
        .where(eq(signupOtps.id, pending.id));

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

// ── POST /api/v1/auth/signup (deprecated) ─────────────────────────────────
router.post('/signup', (req, res) => {
  res.status(410).json({
    error: { message: 'Signup now requires OTP verification', status: 410 },
  });
});

// ── POST /api/v1/auth/login ──────────────────────────────────────────────
router.post(
  '/login',
  [
    body('identifier')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 3, max: 255 }).withMessage('Email or username must be 3–255 characters'),
    body('email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const rawIdentifier = req.body.identifier || req.body.email || '';
      const identifier = String(rawIdentifier).trim();
      const { password } = req.body;

      if (!identifier) {
        return res.status(422).json({
          error: { message: 'Email or username is required', field: 'identifier', status: 422 },
        });
      }

      const isEmail = identifier.includes('@');

      const [user] = await db
        .select()
        .from(users)
        .where(isEmail ? eq(users.email, identifier.toLowerCase()) : eq(users.username, identifier))
        .limit(1);

      // Use a constant-time compare even on miss (timing-safe)
      const dummyHash = '$2b$10$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn';
      const valid = user
        ? await bcrypt.compare(password, user.passwordHash)
        : await bcrypt.compare(password, dummyHash).then(() => false);

      if (!user || !valid) {
        return res.status(401).json({
          error: { message: 'Invalid email/username or password', status: 401 },
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
