const { verifyAccessToken } = require('../utils/jwt')
const AppError = require('../core/errors/AppError')
const pool = require('../config/db')
const TokenBlacklistRepository = require('../repositories/tokenBlacklist.repository')

const tokenBlacklistRepository = new TokenBlacklistRepository({ pool })

/**
 * Middleware que verifica el JWT en el header Authorization.
 * Si es válido, adjunta req.user con { id, email }.
 */
async function authGuard(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Token de autenticación requerido.'))
  }

  const token = header.split(' ')[1]
  let decoded

  try {
    decoded = verifyAccessToken(token)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Token expirado.', 'TOKEN_EXPIRED'))
    }
    return next(AppError.unauthorized('Token inválido.'))
  }

  try {
    const isRevoked = await tokenBlacklistRepository.isTokenRevoked(token)

    if (isRevoked) {
      return next(
        AppError.unauthorized('Token revocado. Inicia sesión nuevamente.', 'TOKEN_REVOKED')
      )
    }

    req.user = { id: decoded.id, email: decoded.email }
    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = authGuard
