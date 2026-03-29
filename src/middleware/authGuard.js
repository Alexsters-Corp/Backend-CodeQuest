const { verifyAccessToken } = require('../utils/jwt')
const AppError = require('../core/errors/AppError')

/**
 * Middleware que verifica el JWT en el header Authorization.
 * Si es válido, adjunta req.user con { id, email }.
 */
function authGuard(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Token de autenticación requerido.'))
  }

  const token = header.split(' ')[1]

  try {
    const decoded = verifyAccessToken(token)
    req.user = { id: decoded.id, email: decoded.email }
    return next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Token expirado.', 'TOKEN_EXPIRED'))
    }
    return next(AppError.unauthorized('Token inválido.'))
  }
}

module.exports = authGuard
