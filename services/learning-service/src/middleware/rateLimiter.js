// g:/IUP - Yamith Alexander Ardila Cabrera/PSW3/CodeQuest Project/Backend-CodeQuest/services/learning-service/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit')

function createUserKey(req) {
  if (req.user && req.user.id) {
    return String(req.user.id)
  }

  return req.ip
}

function createLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: createUserKey,
    handler: (_req, res) => {
      return res.status(429).json({
        error: 'Demasiadas solicitudes. Intenta mas tarde.',
        code: 'RATE_LIMIT',
      })
    },
  })
}

const userAiLimit = createLimiter({
  windowMs: 60 * 1000,
  limit: 10,
})

const instructorAiLimit = createLimiter({
  windowMs: 60 * 1000,
  limit: 100,
})

module.exports = {
  userAiLimit,
  instructorAiLimit,
}
