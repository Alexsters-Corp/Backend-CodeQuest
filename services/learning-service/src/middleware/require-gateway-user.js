const { AppError } = require('@codequest/shared')

function requireGatewayUser(req, _res, next) {
  const userId = Number(req.headers['x-user-id'])
  const userEmail = req.headers['x-user-email']

  if (!Number.isInteger(userId) || userId <= 0) {
    return next(AppError.unauthorized('Se requiere autenticacion via API Gateway.'))
  }

  req.user = {
    id: userId,
    email: typeof userEmail === 'string' ? userEmail : null,
  }

  return next()
}

module.exports = requireGatewayUser
