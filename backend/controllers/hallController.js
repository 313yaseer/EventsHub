const Joi = require('joi');

const { query } = require('../config/db');
const AppError = require('../utils/AppError');

const createHallSchema = Joi.object({
  name: Joi.string().required(),
  capacity: Joi.number().integer().min(1).required(),
  description: Joi.string().allow('', null).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  price_per_hour: Joi.number().min(0).optional(),
});

const updateHallSchema = Joi.object({
  name: Joi.string().optional(),
  capacity: Joi.number().integer().min(1).optional(),
  description: Joi.string().allow('', null).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  price_per_hour: Joi.number().min(0).optional(),
  is_available: Joi.boolean().optional(),
})
  .min(1)
  .required();

function validate(schema, payload) {
  return schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
}

async function getOwnedHall(hallId, tenantId) {
  const result = await query(
    'SELECT * FROM halls WHERE id = $1 AND tenant_id = $2',
    [hallId, tenantId]
  );

  return result.rows[0];
}

async function getHalls(req, res, next) {
  try {
    const result = await query(
      'SELECT * FROM halls WHERE tenant_id = $1 ORDER BY created_at ASC',
      [req.tenantId]
    );

    return res.status(200).json({
      success: true,
      halls: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
}

async function getHallById(req, res, next) {
  try {
    const hall = await getOwnedHall(req.params.id, req.tenantId);

    if (!hall) {
      throw new AppError('Hall not found', 404);
    }

    return res.status(200).json({
      success: true,
      hall,
    });
  } catch (error) {
    next(error);
  }
}

async function createHall(req, res, next) {
  try {
    const { value, error } = validate(createHallSchema, req.body);

    if (error) {
      return next(error);
    }

    const result = await query(
      `INSERT INTO halls (
         tenant_id, name, capacity, description, amenities, price_per_hour
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.tenantId,
        value.name,
        value.capacity,
        value.description || null,
        value.amenities || [],
        value.price_per_hour ?? 0,
      ]
    );

    return res.status(201).json({
      success: true,
      hall: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function updateHall(req, res, next) {
  try {
    const existingHall = await getOwnedHall(req.params.id, req.tenantId);

    if (!existingHall) {
      throw new AppError('Hall not found', 404);
    }

    const { value, error } = validate(updateHallSchema, req.body);

    if (error) {
      return next(error);
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
      `UPDATE halls
       SET ${fields.join(', ')}
       WHERE id = $${index} AND tenant_id = $${index + 1}
       RETURNING *`,
      values
    );

    return res.status(200).json({
      success: true,
      hall: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function toggleHallAvailability(req, res, next) {
  try {
    const hall = await getOwnedHall(req.params.id, req.tenantId);

    if (!hall) {
      throw new AppError('Hall not found', 404);
    }

    const result = await query(
      `UPDATE halls
       SET is_available = $1
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [!hall.is_available, req.params.id, req.tenantId]
    );

    return res.status(200).json({
      success: true,
      hall: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function deleteHall(req, res, next) {
  try {
    if (!['owner', 'manager'].includes(req.user.role)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }

    const hall = await getOwnedHall(req.params.id, req.tenantId);

    if (!hall) {
      throw new AppError('Hall not found', 404);
    }

    const usageResult = await query(
      `SELECT COUNT(*)::int AS count
       FROM bookings b
       JOIN events e ON b.id = e.booking_id
       WHERE b.hall_id = $1
         AND e.status IN ('upcoming', 'ongoing')
         AND b.tenant_id = $2`,
      [req.params.id, req.tenantId]
    );

    if (usageResult.rows[0].count > 0) {
      throw new AppError('Cannot delete hall with upcoming events', 400);
    }

    await query('DELETE FROM halls WHERE id = $1 AND tenant_id = $2', [
      req.params.id,
      req.tenantId,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Hall deleted',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHalls,
  getHallById,
  createHall,
  updateHall,
  toggleHallAvailability,
  deleteHall,
};
