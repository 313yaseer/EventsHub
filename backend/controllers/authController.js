const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Joi = require('joi');

const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/generateToken');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const signupSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(PASSWORD_REGEX).required().messages({
    'string.pattern.base':
      'Password must contain at least 1 lowercase letter, 1 uppercase letter, and 1 digit',
  }),
  business_name: Joi.string().min(2).max(255).required(),
  phone: Joi.string().optional().allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const emailSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().pattern(PASSWORD_REGEX).required().messages({
    'string.pattern.base':
      'Password must contain at least 1 lowercase letter, 1 uppercase letter, and 1 digit',
  }),
});

const completeOnboardingSchema = Joi.object({
  business_name: Joi.string().min(2).max(255).required(),
  phone: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  city: Joi.string().allow('', null),
  state: Joi.string().allow('', null),
  timezone: Joi.string().allow('', null),
  halls: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string().min(2).max(255),
        Joi.object({
          name: Joi.string().min(2).max(255).required(),
          capacity: Joi.number().integer().min(1).default(200),
          description: Joi.string().allow('', null),
          amenities: Joi.array().items(Joi.string()).default([]),
          price_per_hour: Joi.number().min(0).default(0),
          is_available: Joi.boolean().default(true),
        })
      )
    )
    .optional(),
});

function validate(schema, payload) {
  return schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function generateTokenValue() {
  return crypto.randomBytes(32).toString('hex');
}

function buildTenantResponse(row) {
  if (row.role === 'super_admin' || !row.tenant_id_ref) {
    return null;
  }

  return {
    id: row.tenant_id_ref,
    business_name: row.business_name,
    logo_url: row.logo_url,
    primary_color: row.primary_color,
    plan: row.plan,
    plan_status: row.plan_status,
    trial_ends_at: row.trial_ends_at,
  };
}

function buildUserResponse(row) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    onboarding_complete: row.onboarding_complete,
    avatar_url: row.avatar_url,
  };
}

async function generateUniqueSlug(businessName) {
  const baseSlug = businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  while (true) {
    const digits = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${digits}`;
    const existing = await query('SELECT id FROM tenants WHERE slug = $1', [slug]);

    if (existing.rows.length === 0) {
      return slug;
    }
  }
}

async function signup(req, res, next) {
  try {
    const { value, error } = validate(signupSchema, req.body);

    if (error) {
      return next(error);
    }

    const email = normalizeEmail(value.email);
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      throw new AppError('Email already registered', 409);
    }

    const slug = await generateUniqueSlug(value.business_name);
    const passwordHash = await bcrypt.hash(
      value.password,
      Number(process.env.BCRYPT_ROUNDS || 12)
    );
    const verifyToken = generateTokenValue();
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const created = await withTransaction(async (client) => {
      const tenantResult = await client.query(
        `INSERT INTO tenants (
           business_name, slug, email, phone, plan, plan_status, trial_ends_at
         )
         VALUES ($1, $2, $3, $4, 'free', 'trialing', NOW() + INTERVAL '14 days')
         RETURNING id`,
        [value.business_name, slug, email, value.phone || null]
      );

      const tenantId = tenantResult.rows[0].id;

      const userResult = await client.query(
        `INSERT INTO users (
           tenant_id, full_name, email, password_hash, role,
           verify_token, verify_token_expires, is_verified
         )
         VALUES ($1, $2, $3, $4, 'owner', $5, $6, false)
         RETURNING id, email`,
        [
          tenantId,
          value.full_name,
          email,
          passwordHash,
          verifyToken,
          verifyTokenExpires,
        ]
      );

      await client.query(
        `INSERT INTO halls (tenant_id, name, capacity)
         VALUES ($1, 'Main Hall', 200)`,
        [tenantId]
      );

      return {
        tenantId,
        user: userResult.rows[0],
      };
    });

    sendVerificationEmail(email, value.full_name, verifyToken).catch((mailError) => {
      console.error('Failed to send verification email:', mailError);
    });

    return res.status(201).json({
      success: true,
      message: 'Account created! Check your email to verify.',
      email: created.user.email,
    });
  } catch (error) {
    next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT * FROM users
       WHERE verify_token = $1
         AND verify_token_expires > NOW()`,
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      throw new AppError('Verification link is invalid or expired', 400);
    }

    await query(
      `UPDATE users
       SET is_verified = true,
           verify_token = null,
           verify_token_expires = null
       WHERE id = $1`,
      [user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Email verified! You can now login.',
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { value, error } = validate(loginSchema, req.body);

    if (error) {
      return next(error);
    }

    const email = normalizeEmail(value.email);
    const result = await query(
      `SELECT u.*, t.id AS tenant_id_ref,
              t.business_name, t.logo_url, t.primary_color,
              t.plan, t.plan_status, t.trial_ends_at,
              t.is_active AS tenant_active
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.is_active) {
      throw new AppError('Account disabled', 403);
    }

    const passwordMatches = await bcrypt.compare(value.password, user.password_hash);

    if (!passwordMatches) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.role !== 'super_admin' && !user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        action: 'VERIFY_EMAIL',
        email: user.email,
      });
    }

    const accessToken = generateAccessToken({
      id: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({ id: user.id });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    return res.status(200).json({
      success: true,
      token: accessToken,
      user: buildUserResponse(user),
      tenant: buildTenantResponse(user),
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const result = await query(
      `SELECT u.*, t.id AS tenant_id_ref,
              t.business_name, t.logo_url, t.primary_color,
              t.plan, t.plan_status, t.trial_ends_at,
              t.is_active AS tenant_active
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      throw new AppError('User no longer exists', 404);
    }

    return res.status(200).json({
      success: true,
      user: buildUserResponse(user),
      tenant: buildTenantResponse(user),
    });
  } catch (error) {
    next(error);
  }
}

async function resendVerification(req, res, next) {
  try {
    const { value, error } = validate(emailSchema, req.body);

    if (error) {
      return next(error);
    }

    const email = normalizeEmail(value.email);
    const result = await query(
      'SELECT id, full_name, email, is_verified FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Verification email sent',
      });
    }

    if (user.is_verified) {
      throw new AppError('Email already verified', 400);
    }

    const verifyToken = generateTokenValue();
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await query(
      `UPDATE users
       SET verify_token = $1,
           verify_token_expires = $2
       WHERE id = $3`,
      [verifyToken, verifyTokenExpires, user.id]
    );

    await sendVerificationEmail(user.email, user.full_name, verifyToken);

    return res.status(200).json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { value, error } = validate(emailSchema, req.body);

    if (error) {
      return next(error);
    }

    const email = normalizeEmail(value.email);
    const result = await query(
      'SELECT id, full_name, email FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (user) {
      const resetToken = generateTokenValue();
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

      await query(
        `UPDATE users
         SET reset_token = $1,
             reset_token_expires = $2
         WHERE id = $3`,
        [resetToken, resetTokenExpires, user.id]
      );

      await sendPasswordResetEmail(user.email, user.full_name, resetToken);
    }

    return res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link was sent',
    });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { value, error } = validate(resetPasswordSchema, req.body);

    if (error) {
      return next(error);
    }

    const result = await query(
      `SELECT * FROM users
       WHERE reset_token = $1
         AND reset_token_expires > NOW()`,
      [value.token]
    );

    const user = result.rows[0];

    if (!user) {
      throw new AppError('Reset link is invalid or expired', 400);
    }

    const passwordHash = await bcrypt.hash(
      value.password,
      Number(process.env.BCRYPT_ROUNDS || 12)
    );

    await query(
      `UPDATE users
       SET password_hash = $1,
           reset_token = null,
           reset_token_expires = null
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
}

async function completeOnboarding(req, res, next) {
  try {
    const { value, error } = validate(completeOnboardingSchema, req.body);

    if (error) {
      return next(error);
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE tenants
         SET business_name = $1,
             phone = $2,
             address = $3,
             city = $4,
             state = $5,
             timezone = $6
         WHERE id = $7`,
        [
          value.business_name,
          value.phone || null,
          value.address || null,
          value.city || null,
          value.state || null,
          value.timezone || null,
          req.user.tenant_id,
        ]
      );

      if (Array.isArray(value.halls) && value.halls.length > 0) {
        for (const hall of value.halls) {
          if (typeof hall === 'string') {
            await client.query(
              `INSERT INTO halls (tenant_id, name, capacity)
               VALUES ($1, $2, 200)`,
              [req.user.tenant_id, hall]
            );
            continue;
          }

          await client.query(
            `INSERT INTO halls (
               tenant_id, name, capacity, description,
               amenities, price_per_hour, is_available
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              req.user.tenant_id,
              hall.name,
              hall.capacity,
              hall.description || null,
              hall.amenities || [],
              hall.price_per_hour ?? 0,
              hall.is_available ?? true,
            ]
          );
        }
      }

      await client.query(
        `UPDATE users
         SET onboarding_complete = true
         WHERE id = $1`,
        [req.user.id]
      );
    });

    return res.status(200).json({
      success: true,
      message: 'Setup complete! Welcome to EventsHub.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signup,
  verifyEmail,
  login,
  logout,
  getMe,
  resendVerification,
  forgotPassword,
  resetPassword,
  completeOnboarding,
};
