const jwt = require('jsonwebtoken');
const Joi = require('joi');

const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');

const tenantStatusSchema = Joi.object({
  is_active: Joi.boolean().required(),
  reason: Joi.string().trim().max(500).allow('', null).required(),
});

const tenantPlanSchema = Joi.object({
  plan: Joi.string().valid('free', 'pro', 'enterprise').required(),
  plan_status: Joi.string()
    .valid('active', 'trialing', 'past_due', 'cancelled', 'suspended')
    .required(),
});

function validate(schema, payload) {
  return schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
}

function ensureSuperAdmin(req) {
  if (req.user?.role !== 'super_admin') {
    throw new AppError('Forbidden: insufficient permissions', 403);
  }
}

function toInt(value) {
  return Number.parseInt(value || 0, 10);
}

function toNumber(value) {
  return Number(value || 0);
}

function getPagination(queryParams, defaultLimit) {
  const page = Math.max(1, Number.parseInt(queryParams.page || 1, 10) || 1);
  const limit = Math.max(
    1,
    Math.min(100, Number.parseInt(queryParams.limit || defaultLimit, 10) || defaultLimit)
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

async function insertAuditLog({
  actorId,
  actorEmail,
  tenantId = null,
  action,
  resource = null,
  resourceId = null,
  metadata = null,
  db = { query },
}) {
  await db.query(
    `INSERT INTO audit_log (
       actor_id, actor_email, tenant_id, action,
       resource, resource_id, metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      actorId,
      actorEmail,
      tenantId,
      action,
      resource,
      resourceId,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
}

async function getPlatformStats(req, res, next) {
  try {
    ensureSuperAdmin(req);

    const [
      tenantStatsResult,
      newTenantsResult,
      globalCountsResult,
      revenueEstimateResult,
      recentSignupsResult,
    ] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS total_tenants,
                COUNT(*) FILTER (WHERE is_active = true)::int AS active_tenants,
                COUNT(*) FILTER (
                  WHERE plan IN ('pro', 'enterprise')
                    AND plan_status IN ('active', 'trialing', 'past_due')
                )::int AS paying_tenants,
                COUNT(*) FILTER (WHERE plan = 'free')::int AS free_tenants,
                COUNT(*) FILTER (WHERE plan = 'pro')::int AS pro_tenants,
                COUNT(*) FILTER (WHERE plan = 'enterprise')::int AS enterprise_tenants
         FROM tenants`
      ),
      query(
        `SELECT COUNT(*)::int AS new_tenants_this_month
         FROM tenants
         WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`
      ),
      query(
        `SELECT
            (SELECT COUNT(*)::int FROM users) AS total_users,
            (SELECT COUNT(*)::int FROM bookings) AS total_bookings,
            (SELECT COUNT(*)::int FROM events) AS total_events`
      ),
      query(
        `SELECT COALESCE(SUM(pl.price_monthly_ngn), 0)::numeric AS monthly_revenue_estimate
         FROM tenants t
         JOIN plan_limits pl ON t.plan = pl.plan
         WHERE t.plan IN ('pro', 'enterprise')
           AND t.plan_status IN ('active', 'trialing', 'past_due')
           AND t.is_active = true`
      ),
      query(
        `SELECT t.id, t.business_name, t.plan, t.plan_status, t.created_at,
                u.full_name AS owner_name, u.email AS owner_email
         FROM tenants t
         LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'owner'
         ORDER BY t.created_at DESC
         LIMIT 10`
      ),
    ]);

    const tenantStats = tenantStatsResult.rows[0];
    const globalCounts = globalCountsResult.rows[0];

    return res.status(200).json({
      success: true,
      stats: {
        total_tenants: tenantStats.total_tenants,
        active_tenants: tenantStats.active_tenants,
        paying_tenants: tenantStats.paying_tenants,
        by_plan: {
          free: tenantStats.free_tenants,
          pro: tenantStats.pro_tenants,
          enterprise: tenantStats.enterprise_tenants,
        },
        new_tenants_this_month: newTenantsResult.rows[0].new_tenants_this_month,
        total_users: globalCounts.total_users,
        total_bookings: globalCounts.total_bookings,
        total_events: globalCounts.total_events,
        monthly_revenue_estimate: toNumber(
          revenueEstimateResult.rows[0].monthly_revenue_estimate
        ),
        recent_signups: recentSignupsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getAllTenants(req, res, next) {
  try {
    ensureSuperAdmin(req);

    const { page, limit, offset } = getPagination(req.query, 20);
    const conditions = ['1 = 1'];
    const values = [];
    let index = 1;

    if (req.query.search) {
      conditions.push(`(
        t.business_name ILIKE $${index}
        OR t.email ILIKE $${index}
        OR t.slug ILIKE $${index}
        OR u.full_name ILIKE $${index}
        OR u.email ILIKE $${index}
      )`);
      values.push(`%${String(req.query.search).trim()}%`);
      index += 1;
    }

    if (req.query.plan) {
      conditions.push(`t.plan = $${index}`);
      values.push(req.query.plan);
      index += 1;
    }

    if (req.query.status) {
      conditions.push(`t.plan_status = $${index}`);
      values.push(req.query.status);
      index += 1;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult, tenantsResult] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS total
         FROM tenants t
         LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'owner'
         ${whereClause}`,
        values
      ),
      query(
        `SELECT t.*,
                u.full_name AS owner_name,
                u.email AS owner_email,
                (SELECT COUNT(*)::int
                 FROM bookings b
                 WHERE b.tenant_id = t.id) AS total_bookings,
                (SELECT COUNT(*)::int
                 FROM events e
                 WHERE e.tenant_id = t.id) AS total_events,
                (SELECT COUNT(*)::int
                 FROM users u2
                 WHERE u2.tenant_id = t.id AND u2.is_active = true) AS team_members
         FROM tenants t
         LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'owner'
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT $${index} OFFSET $${index + 1}`,
        [...values, limit, offset]
      ),
    ]);

    const total = countResult.rows[0].total;

    return res.status(200).json({
      success: true,
      tenants: tenantsResult.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getTenantDetail(req, res, next) {
  try {
    ensureSuperAdmin(req);

    const tenantId = req.params.id;

    const [
      tenantResult,
      subscriptionResult,
      ownerResult,
      teamResult,
      usageResult,
      bookingsResult,
    ] = await Promise.all([
      query('SELECT * FROM tenants WHERE id = $1', [tenantId]),
      query('SELECT * FROM subscriptions WHERE tenant_id = $1', [tenantId]),
      query(
        `SELECT id, full_name, email, role, avatar_url, is_active,
                is_verified, last_login_at, created_at
         FROM users
         WHERE tenant_id = $1 AND role = 'owner'
         LIMIT 1`,
        [tenantId]
      ),
      query(
        `SELECT id, full_name, email, role, avatar_url, is_active,
                is_verified, last_login_at, created_at
         FROM users
         WHERE tenant_id = $1
         ORDER BY created_at ASC`,
        [tenantId]
      ),
      query(
        `SELECT
            (SELECT COUNT(*)::int FROM users WHERE tenant_id = $1 AND is_active = true) AS team_members,
            (SELECT COUNT(*)::int FROM bookings WHERE tenant_id = $1) AS total_bookings,
            (SELECT COUNT(*)::int FROM events WHERE tenant_id = $1) AS total_events,
            (SELECT COUNT(*)::int FROM attendees WHERE tenant_id = $1) AS total_attendees,
            (SELECT COUNT(*)::int FROM halls WHERE tenant_id = $1) AS total_halls,
            (SELECT COALESCE(SUM(amount_due), 0)::numeric FROM bookings WHERE tenant_id = $1) AS total_value,
            (SELECT COALESCE(SUM(amount_paid), 0)::numeric FROM bookings WHERE tenant_id = $1) AS total_collected`
        ,
        [tenantId]
      ),
      query(
        `SELECT b.*, c.full_name AS client_name, h.name AS hall_name
         FROM bookings b
         LEFT JOIN clients c ON b.client_id = c.id
         LEFT JOIN halls h ON b.hall_id = h.id
         WHERE b.tenant_id = $1
         ORDER BY b.created_at DESC
         LIMIT 5`,
        [tenantId]
      ),
    ]);

    const tenant = tenantResult.rows[0];

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const usage = usageResult.rows[0];

    return res.status(200).json({
      success: true,
      tenant,
      subscription: subscriptionResult.rows[0] || null,
      owner: ownerResult.rows[0] || null,
      team_members: teamResult.rows,
      usage: {
        team_members: toInt(usage.team_members),
        total_bookings: toInt(usage.total_bookings),
        total_events: toInt(usage.total_events),
        total_attendees: toInt(usage.total_attendees),
        total_halls: toInt(usage.total_halls),
        total_value: toNumber(usage.total_value),
        total_collected: toNumber(usage.total_collected),
        total_outstanding:
          toNumber(usage.total_value) - toNumber(usage.total_collected),
      },
      recent_bookings: bookingsResult.rows,
    });
  } catch (error) {
    next(error);
  }
}

async function updateTenantStatus(req, res, next) {
  try {
    ensureSuperAdmin(req);

    const { value, error } = validate(tenantStatusSchema, req.body);

    if (error) {
      return next(error);
    }

    const tenantResult = await query('SELECT * FROM tenants WHERE id = $1', [
      req.params.id,
    ]);
    const tenant = tenantResult.rows[0];

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const updatedTenant = await withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE tenants
         SET is_active = $1,
             plan_status = CASE
               WHEN $1 = false THEN 'suspended'
               WHEN plan_status = 'suspended' THEN 'active'
               ELSE plan_status
             END,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [value.is_active, req.params.id]
      );

      await insertAuditLog({
        actorId: req.user.id,
        actorEmail: req.user.email,
        tenantId: req.params.id,
        action: 'TENANT_STATUS_UPDATED',
        resource: 'tenant',
        resourceId: req.params.id,
        metadata: {
          previous_is_active: tenant.is_active,
          new_is_active: value.is_active,
          previous_plan_status: tenant.plan_status,
          new_plan_status: result.rows[0].plan_status,
          reason: value.reason || null,
        },
        db: client,
      });

      return result.rows[0];
    });

    return res.status(200).json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error) {
    next(error);
  }
}

async function updateTenantPlan(req, res, next) {
  try {
    ensureSuperAdmin(req);

    const { value, error } = validate(tenantPlanSchema, req.body);

    if (error) {
      return next(error);
    }

    const tenantResult = await query('SELECT * FROM tenants WHERE id = $1', [
      req.params.id,
    ]);
    const tenant = tenantResult.rows[0];

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const updatedTenant = await withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE tenants
         SET plan = $1,
             plan_status = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [value.plan, value.plan_status, req.params.id]
      );

      await insertAuditLog({
        actorId: req.user.id,
        actorEmail: req.user.email,
        tenantId: req.params.id,
        action: 'TENANT_PLAN_UPDATED',
        resource: 'tenant',
        resourceId: req.params.id,
        metadata: {
          previous_plan: tenant.plan,
          new_plan: value.plan,
          previous_plan_status: tenant.plan_status,
          new_plan_status: value.plan_status,
        },
        db: client,
      });

      return result.rows[0];
    });

    return res.status(200).json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error) {
    next(error);
  }
}

async function impersonateTenant(req, res, next) {
  try {
    ensureSuperAdmin(req);

    const ownerResult = await query(
      `SELECT id, tenant_id, full_name, email, role
       FROM users
       WHERE tenant_id = $1 AND role = 'owner'
       LIMIT 1`,
      [req.params.tenantId]
    );

    const owner = ownerResult.rows[0];

    if (!owner) {
      throw new AppError('Tenant owner not found', 404);
    }

    const token = jwt.sign(
      {
        id: owner.id,
        tenantId: req.params.tenantId,
        role: owner.role,
        impersonated_by: req.user.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    await insertAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      tenantId: req.params.tenantId,
      action: 'IMPERSONATION',
      resource: 'tenant',
      resourceId: req.params.tenantId,
      metadata: {
        impersonated_user_id: owner.id,
        impersonated_user_email: owner.email,
      },
    });

    return res.status(200).json({
      success: true,
      token,
      message: 'Impersonation token valid for 2 hours',
      user: {
        id: owner.id,
        full_name: owner.full_name,
        email: owner.email,
        role: owner.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getAuditLog(req, res, next) {
  try {
    ensureSuperAdmin(req);

    const { page, limit, offset } = getPagination(req.query, 50);
    const conditions = ['1 = 1'];
    const values = [];
    let index = 1;

    if (req.query.tenant_id) {
      conditions.push(`al.tenant_id = $${index}`);
      values.push(req.query.tenant_id);
      index += 1;
    }

    if (req.query.action) {
      conditions.push(`al.action = $${index}`);
      values.push(req.query.action);
      index += 1;
    }

    if (req.query.from) {
      conditions.push(`al.created_at >= $${index}`);
      values.push(req.query.from);
      index += 1;
    }

    if (req.query.to) {
      conditions.push(`al.created_at <= $${index}`);
      values.push(req.query.to);
      index += 1;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult, auditResult] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS total
         FROM audit_log al
         LEFT JOIN tenants t ON al.tenant_id = t.id
         ${whereClause}`,
        values
      ),
      query(
        `SELECT al.*, t.business_name
         FROM audit_log al
         LEFT JOIN tenants t ON al.tenant_id = t.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${index} OFFSET $${index + 1}`,
        [...values, limit, offset]
      ),
    ]);

    const total = countResult.rows[0].total;

    return res.status(200).json({
      success: true,
      audit_log: auditResult.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPlatformStats,
  getAllTenants,
  getTenantDetail,
  updateTenantStatus,
  updateTenantPlan,
  impersonateTenant,
  getAuditLog,
};
