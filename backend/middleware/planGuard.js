const { query } = require('../config/db');
const AppError = require('../utils/AppError');

const FEATURE_COLUMN_MAP = {
  export_reports: 'can_export_reports',
  custom_branding: 'can_custom_branding',
  api_access: 'can_api_access',
};

function requirePlan(feature) {
  return async function planGuard(req, res, next) {
    try {
      const plan = req.tenant.plan;
      const featureColumn = FEATURE_COLUMN_MAP[feature];

      if (!featureColumn) {
        throw new AppError('Invalid plan feature', 400);
      }

      const result = await query('SELECT * FROM plan_limits WHERE plan = $1', [
        plan,
      ]);

      const planLimits = result.rows[0];

      if (!planLimits || !planLimits[featureColumn]) {
        return res.status(403).json({
          success: false,
          message: 'This feature requires a higher plan',
          feature,
          currentPlan: req.tenant.plan,
          upgradeUrl: '/settings/billing',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requirePlan,
};
