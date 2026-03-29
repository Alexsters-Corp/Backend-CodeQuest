const { verifyAccessToken } = require('../utils/jwt')

/**
 * Middleware que verifica el JWT en el header Authorization.
 * Si es válido, adjunta req.user con { id, email }.
 */
function authGuard(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticación requerido.' })
  }

  const token = header.split(' ')[1]

  try {
    const decoded = verifyAccessToken(token)
    req.user = { id: decoded.id, email: decoded.email }
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ message: 'Token inválido.' })
  }
}

module.exports = authGuard
