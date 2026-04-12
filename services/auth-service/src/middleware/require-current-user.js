const { AppError, normalizeRole } = require('@codequest/shared')
const { userRepository } = require('../services/container')

async function requireCurrentUser(req, _res, next) {
  try {
    const userId = Number(req.user?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      return next(AppError.unauthorized('No autenticado.'))
    }

    const dbUser = await userRepository.findById(userId)
    if (!dbUser) {
      return next(AppError.unauthorized('Usuario no encontrado.'))
    }

    if (!dbUser.is_active) {
      return next(AppError.forbidden('Tu cuenta se encuentra desactivada.', 'ACCOUNT_DISABLED'))
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: normalizeRole(dbUser.role),
      is_active: Boolean(dbUser.is_active),
    }

    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = requireCurrentUser
