const AppError = require('../utils/AppError');

function requireRole(rolesArray) {
  return function roleGuard(req, res, next) {
    try {
      if (!rolesArray.includes(req.user.role)) {
        throw new AppError('Forbidden: insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requireRole,
};
