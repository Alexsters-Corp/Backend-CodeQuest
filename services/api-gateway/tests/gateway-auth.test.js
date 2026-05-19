jest.mock('@codequest/shared', () => {
  class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
      super(message)
      this.statusCode = statusCode
      this.code = code
    }
    static unauthorized(message, code) { return new AppError(message, 401, code) }
    static serviceUnavailable(message, code, details) { const e = new AppError(message, 503, code); e.details = details; return e }
  }

  function normalizeRole(value) {
    const raw = String(value || '').trim().toLowerCase()
    const aliases = { student: 'user', user: 'user', instructor: 'instructor', admin: 'admin' }
    return aliases[raw] || 'user'
  }

  function extractBearerToken(req) {
    const header = req.headers?.authorization
    if (!header || !header.startsWith('Bearer ')) return null
    return header.split(' ')[1] || null
  }

  return { AppError, extractBearerToken, normalizeRole }
})

const { createGatewayAuth } = require('../src/middleware/gateway-auth')

describe('createGatewayAuth', () => {
  let mockVerify, mockIsRevoked, req, res, next

  beforeEach(() => {
    mockVerify = jest.fn()
    mockIsRevoked = jest.fn().mockResolvedValue(false)
    req = {
      headers: { authorization: 'Bearer valid-token' },
      method: 'GET',
      baseUrl: '/api/auth',
      path: '/profile',
    }
    res = {}
    next = jest.fn()
  })

  describe('public route bypass', () => {
    test('allows GET /api/learning/paths without token', async () => {
      req.headers.authorization = null
      req.baseUrl = '/api/learning'
      req.path = '/paths'
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
      expect(mockVerify).not.toHaveBeenCalled()
    })

    test('denies POST /api/learning/paths without token', async () => {
      req.headers.authorization = null
      req.method = 'POST'
      req.baseUrl = '/api/learning'
      req.path = '/paths'
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(401)
    })

    test('allows GET /api/learning/demo without token', async () => {
      req.headers.authorization = null
      req.baseUrl = '/api/learning'
      req.path = '/demo/lesson'
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    test('allows POST /api/learning/demo/execute without token', async () => {
      req.headers.authorization = null
      req.method = 'POST'
      req.baseUrl = '/api/learning'
      req.path = '/demo/execute'
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('token validation', () => {
    test('returns 401 when no token', async () => {
      req.headers.authorization = null
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(401)
    })

    test('sets gatewayUser on valid token', async () => {
      mockVerify.mockReturnValue({ id: 1, email: 'test@test.com', role: 'admin' })
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
      expect(req.gatewayUser).toEqual({ id: 1, email: 'test@test.com', role: 'admin' })
      expect(req.gatewayToken).toBe('valid-token')
    })

    test('normalizes role', async () => {
      mockVerify.mockReturnValue({ id: 1, email: 'test@test.com', role: 'student' })
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      expect(req.gatewayUser.role).toBe('user')
    })

    test('returns 401 for expired token', async () => {
      const expiredError = new Error('expired')
      expiredError.name = 'TokenExpiredError'
      mockVerify.mockImplementation(() => { throw expiredError })
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('TOKEN_EXPIRED')
    })

    test('returns 401 for invalid token', async () => {
      mockVerify.mockImplementation(() => { throw new Error('invalid') })
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('TOKEN_INVALID')
    })
  })

  describe('token revocation check', () => {
    test('checks revocation status', async () => {
      mockVerify.mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' })
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      expect(mockIsRevoked).toHaveBeenCalledWith('valid-token', expect.any(Object), req)
    })

    test('returns 401 for revoked token', async () => {
      mockVerify.mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' })
      mockIsRevoked.mockResolvedValue(true)
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      await middleware(req, res, next)
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('TOKEN_REVOKED')
    })

    test('fail-open mode continues on revocation check error', async () => {
      mockVerify.mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' })
      mockIsRevoked.mockRejectedValue(new Error('DB unavailable'))
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked, authValidationFailOpen: true })
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
      expect(req.gatewayUser).toBeDefined()
    })

    test('fail-closed mode returns 503 on revocation check error', async () => {
      mockVerify.mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' })
      mockIsRevoked.mockRejectedValue(new Error('DB unavailable'))
      const middleware = createGatewayAuth({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked, authValidationFailOpen: false })
      await middleware(req, res, next)
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(503)
      expect(error.code).toBe('AUTH_VALIDATION_UNAVAILABLE')
    })
  })
})
