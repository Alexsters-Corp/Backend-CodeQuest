const AppError = require('../errors/AppError')
const { isAllowedRole, normalizeRole } = require('../security/roles')

function authorize(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map(normalizeRole)

  return (req, _res, next) => {
    if (!req.user || !req.user.id) {
      return next(AppError.unauthorized('No autenticado.'))
    }

    const currentRole = normalizeRole(req.user.role)
    if (!isAllowedRole(currentRole, normalizedAllowed)) {
      console.warn(
        `[RBAC] Acceso denegado: user=${req.user.id} role=${currentRole} path=${req.method} ${req.originalUrl}`
      )

      return next(AppError.forbidden('Acceso denegado: permisos insuficientes.', 'INSUFFICIENT_ROLE'))
    }

    return next()
  }
}

module.exports = {
  authorize,
}
