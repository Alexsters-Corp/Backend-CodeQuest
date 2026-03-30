const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const asyncHandler = require('../core/http/asyncHandler')
const { parseString } = require('../core/validation/request')
const UserRepository = require('../repositories/user.repository')

const userRepository = new UserRepository({ pool })

/**
 * GET /api/users/me
 * Devuelve los datos del usuario autenticado.
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await userRepository.findMeById(req.user.id)

  if (!user) {
    throw AppError.notFound('Usuario no encontrado.')
  }

  return res.status(200).json({ user })
})

/**
 * PUT /api/users/me
 * Actualiza nombre del usuario autenticado.
 */
const updateMe = asyncHandler(async (req, res) => {
  const nombre = parseString(req.body.nombre, 'nombre', { minLength: 2 })

  await userRepository.updateName(req.user.id, nombre)

  return res.status(200).json({ message: 'Perfil actualizado correctamente.' })
})

module.exports = {
  getMe,
  updateMe,
}
