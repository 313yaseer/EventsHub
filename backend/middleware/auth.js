const jwt = require('jsonwebtoken');

const { query } = require('../config/db');
const AppError = require('../utils/AppError');

async function protect(req, res, next) {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authorized, no token', 401);
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expired, please login again', 401);
      }

      throw new AppError('Not authorized, invalid token', 401);
    }

    const result = await query(
      `SELECT id, tenant_id, full_name, email, role,
              is_active, onboarding_complete
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    const user = result.rows[0];

    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    if (!user.is_active) {
      throw new AppError('Account disabled', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  protect,
};
