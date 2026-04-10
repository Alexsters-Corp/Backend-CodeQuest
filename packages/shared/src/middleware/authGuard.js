const AppError = require('../errors/AppError')

function extractBearerToken(req) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return null
  }

  const token = header.split(' ')[1]
  return token || null
}

function createAuthGuard({ verifyAccessToken, isTokenRevoked } = {}) {
  if (typeof verifyAccessToken !== 'function') {
    throw new Error('createAuthGuard requiere verifyAccessToken(token).')
  }

  return async function authGuard(req, _res, next) {
    const token = extractBearerToken(req)

    if (!token) {
      return next(AppError.unauthorized('Token de autenticacion requerido.'))
    }

    let decoded
    try {
      decoded = verifyAccessToken(token)
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(AppError.unauthorized('Token expirado.', 'TOKEN_EXPIRED'))
      }

      return next(AppError.unauthorized('Token invalido.'))
    }

    if (typeof isTokenRevoked === 'function') {
      const revoked = await isTokenRevoked(token)
      if (revoked) {
        return next(AppError.unauthorized('Token revocado.', 'TOKEN_REVOKED'))
      }
    }

    req.authToken = token
    req.user = {
      id: decoded.id,
      email: decoded.email,
    }

    return next()
  }
}

module.exports = {
  extractBearerToken,
  createAuthGuard,
}
