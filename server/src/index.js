const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const errorHandler = require('./middleware/errorHandler');

// Route imports
const categoriesRouter = require('./routes/categories');
const booksRouter = require('./routes/books');
const chaptersRouter = require('./routes/chapters');
const searchRouter = require('./routes/search');
const adminAuthRouter = require('./routes/admin/auth');
const adminCategoriesRouter = require('./routes/admin/categories');
const adminBooksRouter = require('./routes/admin/books');
const adminChaptersRouter = require('./routes/admin/chapters');
const gutenbergRouter = require('./routes/gutenberg');
const adminGutenbergRouter = require('./routes/admin/gutenberg');
const authRouter = require('./routes/auth');

const app = express();

// ── Security & Parsing ─────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow cover images
  })
);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Assets (cover images) ───────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// ── Public API Routes ──────────────────────────────────────────────────────
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/books', booksRouter);
app.use('/api/v1/books/:id/chapters', chaptersRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/gutenberg', gutenbergRouter);
app.use('/api/v1/auth', authRouter);

// ── Admin API Routes ───────────────────────────────────────────────────────
app.use('/api/v1/admin', adminAuthRouter);
app.use('/api/v1/admin/categories', adminCategoriesRouter);
app.use('/api/v1/admin/books', adminBooksRouter);
app.use('/api/v1/admin/books/:id/chapters', adminChaptersRouter);
// Standalone chapter update/delete (no book prefix)
app.use('/api/v1/admin/chapters', adminChaptersRouter);
app.use('/api/v1/admin/gutenberg', adminGutenbergRouter);

// ── Production Frontend Serving ──────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  
  // All other GET requests not matched by API or uploads go to React App
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// ── 404 Handler (for unmatched API routes) ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.path}`, status: 404 },
  });
});

// ── Error Middleware ───────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ BookShell server running on http://localhost:${PORT}`);
});

module.exports = app;
