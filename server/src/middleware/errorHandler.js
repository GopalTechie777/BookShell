/**
 * Centralized error handling middleware.
 * Always returns a consistent JSON error shape:
 *   { error: { message, status } }
 */
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === '42P01' && /signup_otps/i.test(message)) {
    status = 500;
    message = "Database missing table 'signup_otps'. Run migrations (npm run db:push).";
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${status} — ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(status).json({
    error: { message, status },
  });
}

module.exports = errorHandler;
