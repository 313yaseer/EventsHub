const Joi = require('joi');

const { query } = require('../config/db');
const AppError = require('../utils/AppError');

const createClientSchema = Joi.object({
  full_name: Joi.string().required(),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
});

const updateClientSchema = Joi.object({
  full_name: Joi.string().optional(),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
})
  .min(1)
  .required();

function validate(schema, payload) {
  return schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
}

function normalizeEmail(email) {
  return email ? email.trim().toLowerCase() : null;
}

async function getOwnedClient(clientId, tenantId) {
  const result = await query(
    'SELECT * FROM clients WHERE id = $1 AND tenant_id = $2',
    [clientId, tenantId]
  );

  return result.rows[0];
}

async function ensureUniqueTenantEmail(email, tenantId, excludeClientId) {
  if (!email) {
    return;
  }

  const values = [tenantId, email];
  let sql = 'SELECT id FROM clients WHERE tenant_id = $1 AND email = $2';

  if (excludeClientId) {
    sql += ' AND id <> $3';
    values.push(excludeClientId);
  }

  const result = await query(sql, values);

  if (result.rows.length > 0) {
    throw new AppError('Client email already exists', 409);
  }
}

async function getAllClients(req, res, next) {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(Number.parseInt(req.query.limit, 10) || 20, 1);
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.tenant_id = $1';
    const queryParams = [req.tenantId];
    const countParams = [req.tenantId];

    if (search) {
      whereClause += `
        AND (
          c.full_name ILIKE $2
          OR c.email ILIKE $2
          OR c.phone ILIKE $2
        )`;
      queryParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    queryParams.push(limit, offset);

    const clientsResult = await query(
      `SELECT c.*,
              COUNT(b.id)::int AS total_bookings,
              MAX(b.created_at) AS last_booking_date
       FROM clients c
       LEFT JOIN bookings b ON b.client_id = c.id
         AND b.tenant_id = $1
       ${whereClause}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM clients c
       ${whereClause}`,
      countParams
    );

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      clients: clientsResult.rows,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
}

async function getClientById(req, res, next) {
  try {
    const client = await getOwnedClient(req.params.id, req.tenantId);

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const bookingsResult = await query(
      `SELECT b.id, b.event_name, b.event_type, b.preferred_date,
              b.status, b.payment_status, b.amount_due, b.amount_paid
       FROM bookings b
       WHERE b.client_id = $1 AND b.tenant_id = $2
       ORDER BY b.created_at DESC`,
      [req.params.id, req.tenantId]
    );

    return res.status(200).json({
      success: true,
      client,
      bookings: bookingsResult.rows,
    });
  } catch (error) {
    next(error);
  }
}

async function createClient(req, res, next) {
  try {
    const { value, error } = validate(createClientSchema, req.body);

    if (error) {
      return next(error);
    }

    const email = normalizeEmail(value.email);
    await ensureUniqueTenantEmail(email, req.tenantId);

    const result = await query(
      `INSERT INTO clients (tenant_id, full_name, email, phone, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.tenantId,
        value.full_name,
        email,
        value.phone || null,
        value.address || null,
        value.notes || null,
      ]
    );

    return res.status(201).json({
      success: true,
      client: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function updateClient(req, res, next) {
  try {
    const existingClient = await getOwnedClient(req.params.id, req.tenantId);

    if (!existingClient) {
      throw new AppError('Client not found', 404);
    }

    const { value, error } = validate(updateClientSchema, req.body);

    if (error) {
      return next(error);
    }

    if (Object.prototype.hasOwnProperty.call(value, 'email')) {
      value.email = normalizeEmail(value.email);
      await ensureUniqueTenantEmail(value.email, req.tenantId, req.params.id);
    }

    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, fieldValue] of Object.entries(value)) {
      fields.push(`${key} = $${index}`);
      values.push(fieldValue);
      index += 1;
    }

    values.push(req.params.id, req.tenantId);

    const result = await query(
      `UPDATE clients
       SET ${fields.join(', ')}
       WHERE id = $${index} AND tenant_id = $${index + 1}
       RETURNING *`,
      values
    );

    return res.status(200).json({
      success: true,
      client: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function deleteClient(req, res, next) {
  try {
    const client = await getOwnedClient(req.params.id, req.tenantId);

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const activeBookingsResult = await query(
      `SELECT COUNT(*)::int AS count
       FROM bookings
       WHERE client_id = $1
         AND tenant_id = $2
         AND is_active = true`,
      [req.params.id, req.tenantId]
    );

    if (activeBookingsResult.rows[0].count > 0) {
      throw new AppError('Cannot delete client with active bookings', 400);
    }

    await query('DELETE FROM clients WHERE id = $1 AND tenant_id = $2', [
      req.params.id,
      req.tenantId,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Client deleted',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
