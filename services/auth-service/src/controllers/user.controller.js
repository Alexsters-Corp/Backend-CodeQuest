const {
  asyncHandler,
  requireFields,
  parseString,
} = require('@codequest/shared')
const { authService } = require('../services/container')

const getMe = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile({ userId: req.user.id })
  return res.status(200).json({ user: profile })
})

const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile({ userId: req.user.id })
  return res.status(200).json({ user: profile })
})

const updateProfile = asyncHandler(async (req, res) => {
  requireFields(req.body, ['nombre', 'email'])

  const user = await authService.updateProfile({
    userId: req.user.id,
    nombre: parseString(req.body.nombre, 'nombre'),
    email: parseString(req.body.email, 'email').toLowerCase(),
  })

  return res.status(200).json({
    message: 'Perfil actualizado exitosamente.',
    user,
  })
})

module.exports = {
  getMe,
  getProfile,
  updateProfile,
}
