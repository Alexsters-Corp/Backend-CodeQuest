const { AppError, extractBearerToken } = require('@codequest/shared')

function isPublicLearningRoute(req) {
  if (req.method !== 'GET') {
    return false
  }

  const path = req.baseUrl + req.path
  return /^\/api\/learning\/paths(\/\d+)?$/.test(path)
}

function createGatewayAuth({ verifyAccessToken }) {
  return (req, _res, next) => {
    if (isPublicLearningRoute(req)) {
      return next()
    }

    const token = extractBearerToken(req)
    if (!token) {
      return next(AppError.unauthorized('Token de autenticacion requerido en gateway.'))
    }

    try {
      const decoded = verifyAccessToken(token)
      req.gatewayUser = {
        id: decoded.id,
        email: decoded.email,
      }
      req.gatewayToken = token
      return next()
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(AppError.unauthorized('Token expirado.', 'TOKEN_EXPIRED'))
      }

      return next(AppError.unauthorized('Token invalido.', 'TOKEN_INVALID'))
    }
  }
}

module.exports = {
  createGatewayAuth,
}
