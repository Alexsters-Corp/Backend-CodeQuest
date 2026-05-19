const { extractBearerToken, createAuthGuard } = require('../src/middleware/authGuard')
const AppError = require('../src/errors/AppError')

describe('extractBearerToken', () => {
  test('extracts token from Authorization header', () => {
    const req = { headers: { authorization: 'Bearer my-token-123' } }
    expect(extractBearerToken(req)).toBe('my-token-123')
  })

  test('returns null when no header', () => {
    const req = { headers: {} }
    expect(extractBearerToken(req)).toBeNull()
  })

  test('returns null when header is not Bearer', () => {
    const req = { headers: { authorization: 'Basic abc123' } }
    expect(extractBearerToken(req)).toBeNull()
  })

  test('returns null when header is empty', () => {
    const req = { headers: { authorization: '' } }
    expect(extractBearerToken(req)).toBeNull()
  })

  test('returns null when Bearer has no token', () => {
    const req = { headers: { authorization: 'Bearer ' } }
    expect(extractBearerToken(req)).toBeNull()
  })

    test('throws when headers object is missing', () => {
      const req = {}
      expect(() => extractBearerToken(req)).toThrow()
    })
})

describe('createAuthGuard', () => {
  test('throws when verifyAccessToken is not a function', () => {
    expect(() => createAuthGuard({})).toThrow()
    expect(() => createAuthGuard({ verifyAccessToken: 'not-a-function' })).toThrow()
  })

  describe('middleware behavior', () => {
    let mockVerify, mockIsRevoked, guard, req, res, next

    beforeEach(() => {
      mockVerify = jest.fn()
      mockIsRevoked = jest.fn().mockResolvedValue(false)
      guard = createAuthGuard({ verifyAccessToken: mockVerify, isTokenRevoked: mockIsRevoked })
      req = { headers: { authorization: 'Bearer valid-token' } }
      res = {}
      next = jest.fn()
    })

    test('returns 401 when no token', async () => {
      req.headers.authorization = null
      await guard(req, res, next)
      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(AppError)
      expect(error.statusCode).toBe(401)
    })

    test('calls next with user on valid token', async () => {
      mockVerify.mockReturnValue({ id: 1, email: 'test@test.com', role: 'admin' })
      await guard(req, res, next)
      expect(next).toHaveBeenCalledWith()
      expect(req.user).toEqual({ id: 1, email: 'test@test.com', role: 'admin' })
      expect(req.authToken).toBe('valid-token')
    })

    test('normalizes role', async () => {
      mockVerify.mockReturnValue({ id: 1, email: 'test@test.com', role: 'student' })
      await guard(req, res, next)
      expect(req.user.role).toBe('user')
    })

    test('returns 401 for expired token', async () => {
      const expiredError = new Error('Token expired')
      expiredError.name = 'TokenExpiredError'
      mockVerify.mockImplementation(() => { throw expiredError })
      await guard(req, res, next)
      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('TOKEN_EXPIRED')
    })

    test('returns 401 for invalid token', async () => {
      mockVerify.mockImplementation(() => { throw new Error('Invalid') })
      await guard(req, res, next)
      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(401)
    })

    test('checks token revocation', async () => {
      mockVerify.mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' })
      mockIsRevoked.mockResolvedValue(true)
      await guard(req, res, next)
      expect(mockIsRevoked).toHaveBeenCalledWith('valid-token', expect.any(Object), req)
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('TOKEN_REVOKED')
    })

    test('works without isTokenRevoked', async () => {
      guard = createAuthGuard({ verifyAccessToken: mockVerify })
      mockVerify.mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' })
      await guard(req, res, next)
      expect(next).toHaveBeenCalledWith()
      expect(req.user.id).toBe(1)
    })
  })
})
