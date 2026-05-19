const { authorize } = require('../src/middleware/authorize')
const AppError = require('../src/errors/AppError')

describe('authorize', () => {
  let req, res, next

  beforeEach(() => {
    req = { user: { id: 1, role: 'user' }, method: 'GET', originalUrl: '/api/test' }
    res = {}
    next = jest.fn()
  })

  test('allows user with matching role', () => {
    const middleware = authorize('user')
    middleware(req, res, next)
    expect(next).toHaveBeenCalledWith()
  })

  test('allows user with one of multiple roles', () => {
    const middleware = authorize('user', 'admin')
    middleware(req, res, next)
    expect(next).toHaveBeenCalledWith()
  })

  test('denies user without matching role', () => {
    const middleware = authorize('admin')
    middleware(req, res, next)
    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('INSUFFICIENT_ROLE')
  })

  test('returns 401 when no user', () => {
    req.user = null
    const middleware = authorize('user')
    middleware(req, res, next)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
  })

  test('returns 401 when user has no id', () => {
    req.user = { role: 'user' }
    const middleware = authorize('user')
    middleware(req, res, next)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
  })

  test('normalizes roles', () => {
    req.user = { id: 1, role: 'student' }
    const middleware = authorize('user')
    middleware(req, res, next)
    expect(next).toHaveBeenCalledWith()
  })

  test('normalizes allowed roles', () => {
    const middleware = authorize('student', 'ADMIN')
    req.user = { id: 1, role: 'admin' }
    middleware(req, res, next)
    expect(next).toHaveBeenCalledWith()
  })

  test('instructor can access instructor routes', () => {
    req.user = { id: 1, role: 'instructor' }
    const middleware = authorize('instructor')
    middleware(req, res, next)
    expect(next).toHaveBeenCalledWith()
  })

  test('instructor cannot access admin-only routes', () => {
    req.user = { id: 1, role: 'instructor' }
    const middleware = authorize('admin')
    middleware(req, res, next)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(403)
  })

  test('admin can access admin routes', () => {
    req.user = { id: 1, role: 'admin' }
    const middleware = authorize('admin')
    middleware(req, res, next)
    expect(next).toHaveBeenCalledWith()
  })

  test('admin can access instructor routes when both allowed', () => {
    req.user = { id: 1, role: 'admin' }
    const middleware = authorize('instructor', 'admin')
    middleware(req, res, next)
    expect(next).toHaveBeenCalledWith()
  })
})
