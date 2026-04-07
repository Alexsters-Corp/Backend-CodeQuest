const AppError = require('../core/errors/AppError')

const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS = 100
const usageByKey = new Map()

function lessonRateLimit(req, _res, next) {
  const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip || 'unknown'}`
  const now = Date.now()
  const current = usageByKey.get(key)

  if (!current || current.resetAt <= now) {
    usageByKey.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    })
    return next()
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    return next(
      new AppError(
        'Demasiadas solicitudes. Intenta nuevamente en 1 hora',
        429,
        'RATE_LIMIT_EXCEEDED',
        { retry_after: retryAfter }
      )
    )
  }

  current.count += 1
  usageByKey.set(key, current)

  return next()
}

module.exports = lessonRateLimit
