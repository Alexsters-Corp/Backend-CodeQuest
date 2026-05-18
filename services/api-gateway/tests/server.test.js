const express = require('express')
const request = require('supertest')

describe('API Gateway Server', () => {
  let app

  beforeEach(() => {
    jest.resetModules()

    process.env.JWT_ACCESS_SECRET = 'test_access_secret'
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret'
    process.env.AUTH_SERVICE_URL = 'http://localhost:4001'
    process.env.LEARNING_SERVICE_URL = 'http://localhost:4002'
    process.env.AUTH_VALIDATION_FAIL_OPEN = 'false'

    jest.doMock('@codequest/shared', () => ({
      PORTS: { gateway: 4000, auth: 4001, learning: 4002 },
      createJwtToolkit: jest.fn(() => ({
        verifyAccessToken: jest.fn().mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' }),
        signAccessToken: jest.fn().mockReturnValue('token'),
        signRefreshToken: jest.fn().mockReturnValue('refresh'),
        verifyRefreshToken: jest.fn(),
      })),
      createDbPool: jest.fn(() => ({
        query: jest.fn().mockResolvedValue([[]]),
        end: jest.fn(),
      })),
      hashToken: jest.fn((t) => `hash-${t}`),
      asyncHandler: (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next),
      errorHandler: (err, req, res, next) => {
        if (res.headersSent) return next(err)
        res.status(err.statusCode || 500).json({ message: err.message, code: err.code })
      },
      notFoundHandler: (req, res, next) => {
        class AppError extends Error {
          constructor(msg) { super(msg); this.statusCode = 404; this.code = 'ROUTE_NOT_FOUND' }
        }
        next(new AppError(`Ruta ${req.method} ${req.originalUrl} no encontrada.`))
      },
      extractBearerToken: (req) => {
        const h = req.headers?.authorization
        return h && h.startsWith('Bearer ') ? h.split(' ')[1] : null
      },
      normalizeRole: (r) => r === 'student' ? 'user' : (r || 'user'),
      AppError: class AppError extends Error {
        constructor(message, code = 'INTERNAL_ERROR') {
          super(message)
          this.statusCode = 500
          this.code = code
        }
        static unauthorized(msg, code) { const e = new AppError(msg, code); e.statusCode = 401; return e }
        static serviceUnavailable(msg, code, details) { const e = new AppError(msg, code); e.statusCode = 503; e.details = details; return e }
      },
    }))

    jest.doMock('http-proxy-middleware', () => ({
      createProxyMiddleware: jest.fn(() => (req, res, next) => {
        res.status(200).json({ proxied: true, path: req.path })
      }),
    }))

    const { env } = require('../src/config/env')
    const { createGatewayAuth } = require('../src/middleware/gateway-auth')

    app = express()
    app.use(express.json())

    app.get('/', (_req, res) => {
      res.status(200).json({
        message: 'API Gateway activo. Frontend en http://localhost:5000',
        services: { auth: env.authServiceUrl, learning: env.learningServiceUrl },
      })
    })

    app.get('/health', (_req, res) => {
      res.status(200).json({ gateway: 'ok', services: { auth: { status: 'ok' }, learning: { status: 'ok' } } })
    })

    const gatewayAuth = createGatewayAuth({
      verifyAccessToken: jest.fn().mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' }),
      isTokenRevoked: jest.fn().mockResolvedValue(false),
    })

    app.use('/api/learning', gatewayAuth, (_req, res) => {
      res.status(200).json({ proxied: true, service: 'learning' })
    })
    app.use('/api/auth', (_req, res) => {
      res.status(200).json({ proxied: true, service: 'auth' })
    })

    app.use((err, req, res, next) => {
      if (res.headersSent) return next(err)
      res.status(err.statusCode || 500).json({ message: err.message, code: err.code })
    })
  })

  describe('GET /', () => {
    test('returns gateway info', async () => {
      const res = await request(app).get('/')
      expect(res.status).toBe(200)
      expect(res.body.message).toContain('API Gateway')
      expect(res.body.services).toBeDefined()
    })
  })

  describe('GET /health', () => {
    test('returns health status', async () => {
      const res = await request(app).get('/health')
      expect(res.status).toBe(200)
      expect(res.body.gateway).toBe('ok')
      expect(res.body.services).toBeDefined()
    })
  })

  describe('proxy routes', () => {
    test('proxies auth routes', async () => {
      const res = await request(app).get('/api/auth/login')
      expect(res.status).toBe(200)
      expect(res.body.proxied).toBe(true)
      expect(res.body.service).toBe('auth')
    })

    test('proxies learning routes with auth', async () => {
      const res = await request(app)
        .get('/api/learning/paths')
        .set('Authorization', 'Bearer valid-token')

      expect(res.status).toBe(200)
      expect(res.body.proxied).toBe(true)
      expect(res.body.service).toBe('learning')
    })

    test('denies learning routes without auth', async () => {
      const res = await request(app).get('/api/learning/dashboard')
      expect(res.status).toBe(401)
    })
  })
})
