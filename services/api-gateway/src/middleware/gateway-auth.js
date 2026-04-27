const { AppError, extractBearerToken, normalizeRole } = require('@codequest/shared')

function isPublicLearningRoute(req) {
  const path = req.baseUrl + req.path

  // Demo publico (HU-025): GET y POST permitidos sin token bajo /api/learning/demo
  if (/^\/api\/learning\/demo(\/.*)?$/.test(path)) {
    return req.method === 'GET' || req.method === 'POST'
  }

  if (req.method !== 'GET') {
    return false
  }

  return /^\/api\/learning\/paths(\/\d+)?$/.test(path)
}

function createGatewayAuth({ verifyAccessToken, isTokenRevoked, authValidationFailOpen = false }) {
  return async (req, _res, next) => {
    if (isPublicLearningRoute(req)) {
      return next()
    }

    const token = extractBearerToken(req)
    if (!token) {
      return next(AppError.unauthorized('Token de autenticacion requerido en gateway.'))
    }

    let decoded
    try {
      decoded = verifyAccessToken(token)
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(AppError.unauthorized('Token expirado.', 'TOKEN_EXPIRED'))
      }

      return next(AppError.unauthorized('Token invalido.', 'TOKEN_INVALID'))
    }

    try {
      const revoked = await isTokenRevoked(token, decoded, req)
      if (revoked) {
        return next(AppError.unauthorized('Token revocado.', 'TOKEN_REVOKED'))
      }
    } catch (error) {
      if (authValidationFailOpen) {
        console.error('[gateway-auth] No se pudo validar la sesion, continuando en fail-open:', error?.message)
      } else {
        return next(AppError.serviceUnavailable('No se pudo validar la sesion.', 'AUTH_VALIDATION_UNAVAILABLE', {
          reason: error?.message,
        }))
      }
    }

    req.gatewayUser = {
      id: decoded.id,
      email: decoded.email,
      role: normalizeRole(decoded.role),
    }
    req.gatewayToken = token
    return next()
  }
}

module.exports = {
  createGatewayAuth,
}
