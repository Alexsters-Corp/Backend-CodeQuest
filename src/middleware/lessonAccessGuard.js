const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const { verifyAccessToken } = require('../utils/jwt')
const LessonsRepository = require('../repositories/lessons.repository')
const TokenBlacklistRepository = require('../repositories/tokenBlacklist.repository')

const lessonsRepository = new LessonsRepository({ pool })
const tokenBlacklistRepository = new TokenBlacklistRepository({ pool })

function getBearerToken(req) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return null
  }

  const token = header.slice(7).trim()
  return token || null
}

async function resolveOptionalUser(req, { strict = false } = {}) {
  const token = getBearerToken(req)

  if (!token) {
    if (strict) {
      throw AppError.unauthorized(
        'Autenticacion requerida para acceder a esta leccion',
        'AUTH_REQUIRED',
        {
          hint: 'Inicia sesion o accede a una leccion demo gratuita',
        }
      )
    }

    return null
  }

  let decoded
  try {
    decoded = verifyAccessToken(token)
  } catch (_error) {
    if (strict) {
      throw AppError.unauthorized(
        'Autenticacion requerida para acceder a esta leccion',
        'AUTH_REQUIRED',
        {
          hint: 'Inicia sesion o accede a una leccion demo gratuita',
        }
      )
    }

    return null
  }

  const isRevoked = await tokenBlacklistRepository.isTokenRevoked(token)
  if (isRevoked) {
    if (strict) {
      throw AppError.unauthorized(
        'Autenticacion requerida para acceder a esta leccion',
        'AUTH_REQUIRED',
        {
          hint: 'Inicia sesion o accede a una leccion demo gratuita',
        }
      )
    }

    return null
  }

  return {
    id: Number(decoded.id),
    email: decoded.email,
  }
}

async function lessonAccessGuard(req, _res, next) {
  try {
    const lessonId = Number(req.params.id)

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      throw AppError.badRequest('id debe ser un entero positivo.', 'VALIDATION_ERROR')
    }

    const lesson = await lessonsRepository.findById(lessonId)

    if (!lesson) {
      throw AppError.notFound(
        'La leccion solicitada no existe o no esta publicada',
        'LESSON_NOT_FOUND'
      )
    }

    if (lesson.is_free_demo) {
      const user = await resolveOptionalUser(req, { strict: false })
      if (user) {
        req.user = user
      }

      req.lesson = lesson
      req.lessonAccess = {
        isAuthenticated: Boolean(user),
        isFreeDemo: true,
      }

      return next()
    }

    const user = await resolveOptionalUser(req, { strict: true })
    req.user = user

    const access = await lessonsRepository.validateLessonAccess({
      userId: user.id,
      lesson,
    })

    if (!access.ok) {
      if (access.code === 'NO_LEARNING_PATH') {
        throw AppError.forbidden(
          'Debes seleccionar una ruta de aprendizaje para acceder a este contenido',
          'NO_LEARNING_PATH',
          {
            action: {
              text: 'Seleccionar ruta',
              url: '/api/learning-paths',
            },
          }
        )
      }

      if (access.code === 'LESSON_NOT_IN_PATH') {
        throw AppError.forbidden(
          'Esta leccion no esta disponible en tu ruta de aprendizaje actual',
          'LESSON_NOT_IN_PATH',
          access.details
        )
      }

      throw AppError.forbidden('Acceso denegado a la leccion.', 'LESSON_ACCESS_DENIED')
    }

    req.lesson = lesson
    req.lessonAccess = {
      isAuthenticated: true,
      isFreeDemo: false,
      selectedPathId: Number(access.selectedPath.learning_path_id),
    }

    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = lessonAccessGuard
