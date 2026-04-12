const { AppError, normalizeRole } = require('@codequest/shared')
const { pool } = require('../services/container')

async function requireGatewayUser(req, _res, next) {
  try {
    const userId = Number(req.headers['x-user-id'])
    const userEmail = req.headers['x-user-email']
    const headerRole = normalizeRole(req.headers['x-user-role'])

    if (!Number.isInteger(userId) || userId <= 0) {
      return next(AppError.unauthorized('Se requiere autenticacion via API Gateway.'))
    }

    const [rows] = await pool.query(
      `SELECT id, email, role, is_active
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    )

    const dbUser = rows[0]
    if (!dbUser) {
      return next(AppError.unauthorized('Usuario no encontrado.'))
    }

    if (!dbUser.is_active) {
      return next(AppError.forbidden('Tu cuenta se encuentra desactivada.', 'ACCOUNT_DISABLED'))
    }

    const dbRole = normalizeRole(dbUser.role)
    if (headerRole && dbRole !== headerRole) {
      console.warn(
        `[RBAC] Mismatch role header/db user=${userId} header=${headerRole} db=${dbRole} path=${req.method} ${req.originalUrl}`
      )
    }

    req.user = {
      id: userId,
      email: dbUser.email || (typeof userEmail === 'string' ? userEmail : null),
      role: dbRole,
      is_active: Boolean(dbUser.is_active),
    }

    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = requireGatewayUser
