const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { createProxyMiddleware } = require('http-proxy-middleware')
const {
  createJwtToolkit,
  createDbPool,
  hashToken,
  asyncHandler,
  errorHandler,
  notFoundHandler,
} = require('@codequest/shared')
const { env } = require('./config/env')
const { createGatewayAuth } = require('./middleware/gateway-auth')

const jwtToolkit = createJwtToolkit({
  accessSecret: env.jwt.accessSecret,
  refreshSecret: env.jwt.refreshSecret,
})

const dbPool = createDbPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
})

const TOKENS_VALID_AFTER_SCHEMA_CACHE_MS = 60 * 1000
let usersTokensValidAfterColumn = null
let usersTokensValidAfterColumnCheckedAt = 0
let usersTokensValidAfterColumnPromise = null

async function resolveUsersTokensValidAfterColumn() {
  const now = Date.now()
  if (
    usersTokensValidAfterColumn !== null
    && now - usersTokensValidAfterColumnCheckedAt < TOKENS_VALID_AFTER_SCHEMA_CACHE_MS
  ) {
    return usersTokensValidAfterColumn
  }

  if (usersTokensValidAfterColumnPromise) {
    return usersTokensValidAfterColumnPromise
  }

  usersTokensValidAfterColumnPromise = dbPool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'users'
       AND column_name = 'tokens_valid_after'`
  ).then(([rows]) => {
    usersTokensValidAfterColumn = rows.length > 0 ? 'tokens_valid_after' : ''
    usersTokensValidAfterColumnCheckedAt = Date.now()
    return usersTokensValidAfterColumn
  }).catch((err) => {
    usersTokensValidAfterColumnCheckedAt = 0
    usersTokensValidAfterColumn = null
    throw err
  }).finally(() => {
    usersTokensValidAfterColumnPromise = null
  })

  return usersTokensValidAfterColumnPromise
}

async function isTokenRevoked(token, decoded) {
  const tokenHash = hashToken(token)
  const [rows] = await dbPool.query(
    `SELECT id FROM token_blacklist WHERE token_hash = ? AND expires_at > NOW() LIMIT 1`,
    [tokenHash]
  )

  if (rows.length > 0) {
    return true
  }

  const tokensValidAfterColumn = await resolveUsersTokensValidAfterColumn()
  if (!tokensValidAfterColumn) {
    return false
  }

  const [userRows] = await dbPool.query(
    `SELECT ${tokensValidAfterColumn} AS tokens_valid_after
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [decoded.id]
  )

  const user = userRows[0]
  if (!user?.tokens_valid_after) {
    return false
  }

  const validAfterTs = Math.floor(new Date(user.tokens_valid_after).getTime() / 1000)
  return Number(decoded.iat) < validAfterTs
}

const app = express()

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
})

const learningLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 400,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(globalLimiter)
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
)

app.get('/', (_req, res) => {
  return res.status(200).json({
    message: 'API Gateway activo. Frontend en http://localhost:5000',
    services: {
      auth: env.authServiceUrl,
      learning: env.learningServiceUrl,
    },
  })
})

app.get('/health', asyncHandler(async (_req, res) => {
  const [authHealth, learningHealth] = await Promise.all([
    fetch(`${env.authServiceUrl}/internal/health`).then((r) => r.json().catch(() => ({ status: 'error' }))),
    fetch(`${env.learningServiceUrl}/internal/health`).then((r) => r.json().catch(() => ({ status: 'error' }))),
  ])

  return res.status(200).json({
    gateway: 'ok',
    services: {
      auth: authHealth,
      learning: learningHealth,
    },
  })
}))

const proxyAuthService = createProxyMiddleware({
  target: env.authServiceUrl,
  changeOrigin: true,
  xfwd: true,
  pathRewrite: (path, req) => {
    const servicePrefix = req.baseUrl
    return `${servicePrefix}${path}`
  },
})

const proxyLearningService = createProxyMiddleware({
  target: env.learningServiceUrl,
  changeOrigin: true,
  xfwd: true,
  pathRewrite: (path, req) => {
    const servicePrefix = req.baseUrl
    return `${servicePrefix}${path}`
  },
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.gatewayUser) {
        proxyReq.setHeader('x-user-id', String(req.gatewayUser.id))
        proxyReq.setHeader('x-user-email', req.gatewayUser.email || '')
        proxyReq.setHeader('x-user-role', req.gatewayUser.role || 'user')
      }
    },
  },
})

const gatewayAuth = createGatewayAuth({
  verifyAccessToken: jwtToolkit.verifyAccessToken,
  isTokenRevoked,
  authValidationFailOpen: env.authValidationFailOpen,
})

app.use('/api/auth', authLimiter, proxyAuthService)
app.use('/api/users', authLimiter, proxyAuthService)
app.use('/api/admin/users', authLimiter, gatewayAuth, proxyAuthService)
app.use('/api/learning', learningLimiter, gatewayAuth, proxyLearningService)
app.use('/api/instructor', learningLimiter, gatewayAuth, proxyLearningService)
app.use('/api/admin', learningLimiter, gatewayAuth, proxyLearningService)

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(env.port, () => {
  console.log(`[${env.serviceName}] running on http://localhost:${env.port}`)
})

let shuttingDown = false
async function gracefulShutdown(signal) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  console.log(`[${env.serviceName}] ${signal} received, closing server...`)

  server.close(async () => {
    try {
      await dbPool.end()
      console.log(`[${env.serviceName}] DB connections closed.`)
      process.exit(0)
    } catch (error) {
      console.error(`[${env.serviceName}] Error closing DB connections:`, error)
      process.exit(1)
    }
  })

  setTimeout(() => {
    console.error(`[${env.serviceName}] forced shutdown due timeout.`)
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
