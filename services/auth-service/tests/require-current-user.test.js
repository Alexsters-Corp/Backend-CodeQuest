const requireCurrentUser = require('../src/middleware/require-current-user')
const AppError = require('@codequest/shared')

describe('requireCurrentUser middleware', () => {
  let req, res, next, mockUserRepo

  beforeEach(() => {
    jest.resetModules()

    mockUserRepo = {
      findById: jest.fn(),
    }

    jest.doMock('../src/services/container', () => ({
      userRepository: mockUserRepo,
    }))

    req = { user: { id: 1, email: 'test@test.com', role: 'user' } }
    res = {}
    next = jest.fn()
  })

  test('calls next with user when valid', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      role: 'user',
      is_active: true,
    })

    const middleware = require('../src/middleware/require-current-user')
    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.user.id).toBe(1)
  })

  test('returns 401 when user id is invalid', async () => {
    req.user = { id: 'invalid', email: 'test@test.com', role: 'user' }

    const middleware = require('../src/middleware/require-current-user')
    await middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
  })

  test('returns 401 when user id is zero', async () => {
    req.user = { id: 0, email: 'test@test.com', role: 'user' }

    const middleware = require('../src/middleware/require-current-user')
    await middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
  })

  test('returns 401 when user not found in DB', async () => {
    mockUserRepo.findById.mockResolvedValue(null)

    const middleware = require('../src/middleware/require-current-user')
    await middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
  })

  test('returns 403 when account is disabled', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      role: 'user',
      is_active: false,
    })

    const middleware = require('../src/middleware/require-current-user')
    await middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('ACCOUNT_DISABLED')
  })

  test('normalizes role', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      role: 'student',
      is_active: true,
    })

    const middleware = require('../src/middleware/require-current-user')
    await middleware(req, res, next)

    expect(req.user.role).toBe('user')
  })

  test('returns 401 when no user in request', async () => {
    req.user = null

    const middleware = require('../src/middleware/require-current-user')
    await middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
  })

  test('passes through unexpected errors', async () => {
    const dbError = new Error('DB connection failed')
    mockUserRepo.findById.mockRejectedValue(dbError)

    const middleware = require('../src/middleware/require-current-user')
    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(dbError)
  })
})
