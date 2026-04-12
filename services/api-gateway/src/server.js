const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { createProxyMiddleware } = require('http-proxy-middleware')
const {
  createJwtToolkit,
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
})

app.use('/api/auth', authLimiter, proxyAuthService)
app.use('/api/users', authLimiter, proxyAuthService)
app.use('/api/admin/users', authLimiter, gatewayAuth, proxyAuthService)
app.use('/api/learning', learningLimiter, gatewayAuth, proxyLearningService)
app.use('/api/instructor', learningLimiter, gatewayAuth, proxyLearningService)
app.use('/api/admin', learningLimiter, gatewayAuth, proxyLearningService)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.port, () => {
  console.log(`[${env.serviceName}] running on http://localhost:${env.port}`)
})
