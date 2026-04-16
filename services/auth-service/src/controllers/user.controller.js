const {
  AppError,
  asyncHandler,
  requireFields,
  parseString,
} = require('@codequest/shared')
const { authService } = require('../services/container')

function parseOptionalString(value, fieldName, options = {}) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return parseString(value, fieldName, options)
}

function parseOptionalBirthDate(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const raw = parseString(value, 'birthDate')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw AppError.badRequest('birthDate debe tener formato YYYY-MM-DD.', 'VALIDATION_ERROR')
  }

  const parsed = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    throw AppError.badRequest('birthDate no es una fecha válida.', 'VALIDATION_ERROR')
  }

  const today = new Date()
  const currentDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  if (parsed > currentDay) {
    throw AppError.badRequest('birthDate no puede ser una fecha futura.', 'VALIDATION_ERROR')
  }

  return raw
}

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
    username: parseOptionalString(req.body.username, 'username', { minLength: 3 }),
    avatar: parseOptionalString(req.body.avatar, 'avatar', { minLength: 1 }),
    countryCode: (() => {
      const value = parseOptionalString(req.body.countryCode, 'countryCode')
      if (!value) {
        return null
      }

      const normalized = value.toUpperCase()
      if (!/^[A-Z]{2}$/.test(normalized)) {
        throw AppError.badRequest('countryCode debe ser un código ISO-2 válido.', 'VALIDATION_ERROR')
      }

      return normalized
    })(),
    birthDate: parseOptionalBirthDate(req.body.birthDate),
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
