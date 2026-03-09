/**
 * Centralized error handling middleware.
 * Always returns a consistent JSON error shape:
 *   { error: { message, status } }
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${status} — ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(status).json({
    error: { message, status },
  });
}

module.exports = errorHandler;
