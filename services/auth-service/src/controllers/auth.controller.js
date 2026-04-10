const { asyncHandler, requireFields, parseString } = require('@codequest/shared')
const { authService } = require('../services/container')

const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ['nombre', 'email', 'password'])

  const data = await authService.register({
    nombre: parseString(req.body.nombre, 'nombre'),
    email: parseString(req.body.email, 'email').toLowerCase(),
    password: parseString(req.body.password, 'password', { trim: false, minLength: 6 }),
  })

  return res.status(201).json({
    message: 'Usuario registrado exitosamente.',
    ...data,
  })
})

const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password'])

  const data = await authService.login({
    email: parseString(req.body.email, 'email').toLowerCase(),
    password: parseString(req.body.password, 'password', { trim: false, minLength: 1 }),
  })

  return res.status(200).json({
    message: 'Inicio de sesion correcto.',
    ...data,
  })
})

const refresh = asyncHandler(async (req, res) => {
  requireFields(req.body, ['refreshToken'])

  const data = await authService.refresh({
    refreshToken: parseString(req.body.refreshToken, 'refreshToken', { trim: false, minLength: 1 }),
  })

  return res.status(200).json(data)
})

const logout = asyncHandler(async (req, res) => {
  await authService.logout({ req })
  return res.status(200).json({ message: 'Sesion cerrada correctamente.' })
})

const forgotPassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email'])

  await authService.forgotPassword({
    email: parseString(req.body.email, 'email').toLowerCase(),
  })

  return res.status(200).json({
    message: 'Si el email existe en la plataforma, recibiras un enlace de recuperacion.',
  })
})

const resetPassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ['token', 'password'])

  await authService.resetPassword({
    rawToken: parseString(req.body.token, 'token', { trim: false, minLength: 1 }),
    newPassword: parseString(req.body.password, 'password', { trim: false, minLength: 6 }),
  })

  return res.status(200).json({ message: 'Contrasena actualizada exitosamente.' })
})

const verifyEmail = asyncHandler(async (req, res) => {
  requireFields(req.body, ['token'])

  await authService.verifyEmail({
    rawToken: parseString(req.body.token, 'token', { trim: false, minLength: 1 }),
  })

  return res.status(200).json({ message: 'Email verificado correctamente.' })
})

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
}
