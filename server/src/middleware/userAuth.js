const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware for user routes.
 * Expects: Authorization: Bearer <token>
 * Attaches decoded payload to req.user — distinct from req.admin.
 */
function userAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Authorization token required', status: 401 },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure this is a user token, not an admin token
    if (decoded.role !== 'user') {
      return res.status(403).json({
        error: { message: 'Access denied', status: 403 },
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: { message: 'Invalid or expired token', status: 401 },
    });
  }
}

module.exports = userAuth;
