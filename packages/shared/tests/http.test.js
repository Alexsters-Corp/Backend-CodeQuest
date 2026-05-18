const asyncHandler = require('../src/http/asyncHandler')
const errorHandler = require('../src/http/errorHandler')
const notFoundHandler = require('../src/http/notFoundHandler')
const AppError = require('../src/errors/AppError')

describe('asyncHandler', () => {
  test('calls handler with req, res, next', async () => {
    const handler = jest.fn().mockResolvedValue('result')
    const wrapped = asyncHandler(handler)
    const req = {}, res = {}, next = jest.fn()

    wrapped(req, res, next)
    await new Promise((resolve) => setImmediate(resolve))

    expect(handler).toHaveBeenCalledWith(req, res, next)
  })

  test('catches errors and passes to next', async () => {
    const error = new Error('test error')
    const handler = jest.fn().mockRejectedValue(error)
    const wrapped = asyncHandler(handler)
    const req = {}, res = {}, next = jest.fn()

    wrapped(req, res, next)
    await new Promise((resolve) => setImmediate(resolve))

    expect(next).toHaveBeenCalledWith(error)
  })

  test('catches AppError and passes to next', async () => {
    const error = AppError.notFound('missing')
    const handler = jest.fn().mockRejectedValue(error)
    const wrapped = asyncHandler(handler)
    const req = {}, res = {}, next = jest.fn()

    wrapped(req, res, next)
    await new Promise((resolve) => setImmediate(resolve))

    expect(next).toHaveBeenCalledWith(error)
  })

    test('does not catch sync throws (async errors only)', () => {
      const error = new Error('sync error')
      const handler = jest.fn(() => { throw error })
      const wrapped = asyncHandler(handler)
      const req = {}, res = {}, next = jest.fn()

      expect(() => wrapped(req, res, next)).toThrow(error)
      expect(next).not.toHaveBeenCalled()
    })
})

describe('errorHandler', () => {
  let req, res, next

  beforeEach(() => {
    req = {}
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    }
    next = jest.fn()
  })

  test('handles AppError', () => {
    const error = AppError.badRequest('bad request', 'BAD_REQ', { field: 'email' })
    errorHandler(error, req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'bad request',
      code: 'BAD_REQ',
      details: { field: 'email' },
    })
  })

    test('handles unknown error as 500', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('unexpected')
      errorHandler(error, req, res, next)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor.',
        code: 'INTERNAL_ERROR',
      })

      process.env.NODE_ENV = originalEnv
    })

    test('includes error details in development for unknown errors', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('unexpected')
      errorHandler(error, req, res, next)

      const callArg = res.json.mock.calls[0][0]
      expect(callArg).toHaveProperty('error', 'unexpected')

      process.env.NODE_ENV = originalEnv
    })

    test('does not include error details in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('unexpected')
      errorHandler(error, req, res, next)

      const callArg = res.json.mock.calls[0][0]
      expect(callArg).not.toHaveProperty('error')

      process.env.NODE_ENV = originalEnv
    })

  test('passes error to next if headers already sent', () => {
    res.headersSent = true
    const error = new Error('test')
    errorHandler(error, req, res, next)
    expect(next).toHaveBeenCalledWith(error)
  })

  test('handles AppError without details', () => {
    const error = AppError.unauthorized('no auth')
    errorHandler(error, req, res, next)
    expect(res.json).toHaveBeenCalledWith({
      message: 'no auth',
      code: 'UNAUTHORIZED',
    })
  })

  test('handles AppError with undefined details', () => {
    const error = new AppError('test', 400, 'CODE', undefined)
    errorHandler(error, req, res, next)
    expect(res.json).toHaveBeenCalledWith({
      message: 'test',
      code: 'CODE',
    })
  })
})

describe('notFoundHandler', () => {
  let req, res, next

  beforeEach(() => {
    req = { method: 'GET', originalUrl: '/api/missing' }
    res = {}
    next = jest.fn()
  })

  test('creates 404 AppError', () => {
    notFoundHandler(req, res, next)
    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('ROUTE_NOT_FOUND')
    expect(error.message).toContain('/api/missing')
  })

  test('includes method in message', () => {
    req.method = 'POST'
    notFoundHandler(req, res, next)
    const error = next.mock.calls[0][0]
    expect(error.message).toContain('POST')
  })
})
