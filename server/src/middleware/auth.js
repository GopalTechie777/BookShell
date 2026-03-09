const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware for admin routes.
 * Expects: Authorization: Bearer <token>
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Authorization token required', status: 401 },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: { message: 'Invalid or expired token', status: 401 },
    });
  }
}

module.exports = auth;
