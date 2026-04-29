const { query } = require('../config/db');
const AppError = require('../utils/AppError');

const RESOURCE_LIMIT_MAP = {
  booking: 'max_bookings_per_month',
  hall: 'max_halls',
  team_member: 'max_team_members',
  attendee: 'max_attendees_per_event',
};

async function getUsage(resource, req) {
  if (resource === 'booking') {
    const result = await query(
      `SELECT COUNT(*)::int AS used
       FROM bookings
       WHERE tenant_id = $1
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`,
      [req.tenantId]
    );

    return result.rows[0].used;
  }

  if (resource === 'hall') {
    const result = await query(
      `SELECT COUNT(*)::int AS used
       FROM halls
       WHERE tenant_id = $1`,
      [req.tenantId]
    );

    return result.rows[0].used;
  }

  if (resource === 'team_member') {
    const result = await query(
      `SELECT COUNT(*)::int AS used
       FROM users
       WHERE tenant_id = $1
         AND is_active = true`,
      [req.tenantId]
    );

    return result.rows[0].used;
  }

  if (resource === 'attendee') {
    const eventId = req.params.id;

    if (!eventId) {
      throw new AppError('Event ID is required for attendee usage checks', 400);
    }

    const result = await query(
      `SELECT COUNT(*)::int AS used
       FROM attendees
       WHERE event_id = $1`,
      [eventId]
    );

    return result.rows[0].used;
  }

  throw new AppError('Invalid usage resource', 400);
}

function checkUsageLimit(resource) {
  return async function usageGuard(req, res, next) {
    try {
      const limitColumn = RESOURCE_LIMIT_MAP[resource];

      if (!limitColumn) {
        throw new AppError('Invalid usage resource', 400);
      }

      const planResult = await query(
        'SELECT * FROM plan_limits WHERE plan = $1',
        [req.tenant.plan]
      );

      const planLimits = planResult.rows[0];

      if (!planLimits) {
        throw new AppError('Plan limits not found', 404);
      }

      const limit = planLimits[limitColumn];

      if (limit === -1) {
        next();
        return;
      }

      const used = await getUsage(resource, req);

      if (used >= limit) {
        return res.status(429).json({
          success: false,
          message: `Plan limit reached for ${resource}`,
          limit,
          used,
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
  checkUsageLimit,
};
