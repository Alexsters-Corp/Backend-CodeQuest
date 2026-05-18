const AppError = require('../src/errors/AppError')

describe('AppError', () => {
  describe('constructor', () => {
    test('creates error with default values', () => {
      const error = new AppError('test')
      expect(error.message).toBe('test')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.name).toBe('AppError')
    })

    test('creates error with custom values', () => {
      const error = new AppError('custom', 418, 'CUSTOM_CODE', { detail: 'x' })
      expect(error.message).toBe('custom')
      expect(error.statusCode).toBe(418)
      expect(error.code).toBe('CUSTOM_CODE')
      expect(error.details).toEqual({ detail: 'x' })
    })

    test('captures stack trace', () => {
      const error = new AppError('stack test')
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('AppError')
    })
  })

  describe('static factory methods', () => {
    test('badRequest creates 400 error', () => {
      const error = AppError.badRequest('bad request', 'BAD_REQ', { field: 'email' })
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('BAD_REQ')
      expect(error.details).toEqual({ field: 'email' })
    })

    test('badRequest uses defaults', () => {
      const error = AppError.badRequest('bad')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('BAD_REQUEST')
    })

    test('unauthorized creates 401 error', () => {
      const error = AppError.unauthorized('no auth', 'NO_AUTH')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('NO_AUTH')
    })

    test('unauthorized uses defaults', () => {
      const error = AppError.unauthorized()
      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('No autorizado.')
      expect(error.code).toBe('UNAUTHORIZED')
    })

    test('forbidden creates 403 error', () => {
      const error = AppError.forbidden('no access', 'NO_ACCESS')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('NO_ACCESS')
    })

    test('forbidden uses defaults', () => {
      const error = AppError.forbidden()
      expect(error.statusCode).toBe(403)
      expect(error.message).toBe('Acceso denegado.')
      expect(error.code).toBe('FORBIDDEN')
    })

    test('notFound creates 404 error', () => {
      const error = AppError.notFound('missing', 'MISSING')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('MISSING')
    })

    test('notFound uses defaults', () => {
      const error = AppError.notFound()
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('Recurso no encontrado.')
      expect(error.code).toBe('NOT_FOUND')
    })

    test('conflict creates 409 error', () => {
      const error = AppError.conflict('exists', 'EXISTS')
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('EXISTS')
    })

    test('conflict uses defaults', () => {
      const error = AppError.conflict()
      expect(error.statusCode).toBe(409)
      expect(error.message).toBe('Conflicto de estado.')
      expect(error.code).toBe('CONFLICT')
    })

    test('serviceUnavailable creates 503 error', () => {
      const error = AppError.serviceUnavailable('down', 'DOWN')
      expect(error.statusCode).toBe(503)
      expect(error.code).toBe('DOWN')
    })

    test('serviceUnavailable uses defaults', () => {
      const error = AppError.serviceUnavailable('down')
      expect(error.statusCode).toBe(503)
      expect(error.code).toBe('SERVICE_UNAVAILABLE')
    })
  })

  describe('instanceof', () => {
    test('errors are instanceof AppError', () => {
      expect(AppError.badRequest('x') instanceof AppError).toBe(true)
      expect(AppError.unauthorized('x') instanceof AppError).toBe(true)
      expect(AppError.forbidden('x') instanceof AppError).toBe(true)
      expect(AppError.notFound('x') instanceof AppError).toBe(true)
      expect(AppError.conflict('x') instanceof AppError).toBe(true)
      expect(AppError.serviceUnavailable('x') instanceof AppError).toBe(true)
    })

    test('errors are instanceof Error', () => {
      expect(AppError.badRequest('x') instanceof Error).toBe(true)
    })
  })
})
