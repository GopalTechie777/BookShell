const { validationResult } = require('express-validator');

/**
 * Middleware to run after express-validator chains.
 * If there are validation errors, respond with 422 and the first error message.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(422).json({
      error: { message: first.msg, field: first.path, status: 422 },
    });
  }
  next();
}

module.exports = validate;
