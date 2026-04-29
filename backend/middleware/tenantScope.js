const { query } = require('../config/db');
const AppError = require('../utils/AppError');

async function tenantScope(req, res, next) {
  try {
    if (req.user.role === 'super_admin') {
      req.tenantId = null;
      req.tenant = null;
      next();
      return;
    }

    if (req.user.tenant_id == null) {
      throw new AppError('No tenant associated with this account', 400);
    }

    const result = await query('SELECT * FROM tenants WHERE id = $1', [
      req.user.tenant_id,
    ]);

    const tenant = result.rows[0];

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    if (!tenant.is_active) {
      throw new AppError('Account suspended. Contact support.', 403);
    }

    if (tenant.plan_status === 'suspended') {
      throw new AppError('Subscription suspended. Update billing.', 403);
    }

    req.tenantId = tenant.id;
    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  tenantScope,
};
