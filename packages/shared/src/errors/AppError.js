class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  static badRequest(message, code = 'BAD_REQUEST', details) {
    return new AppError(message, 400, code, details)
  }

  static unauthorized(message = 'No autorizado.', code = 'UNAUTHORIZED', details) {
    return new AppError(message, 401, code, details)
  }

  static forbidden(message = 'Acceso denegado.', code = 'FORBIDDEN', details) {
    return new AppError(message, 403, code, details)
  }

  static notFound(message = 'Recurso no encontrado.', code = 'NOT_FOUND', details) {
    return new AppError(message, 404, code, details)
  }

  static conflict(message = 'Conflicto de estado.', code = 'CONFLICT', details) {
    return new AppError(message, 409, code, details)
  }

  static serviceUnavailable(message, code = 'SERVICE_UNAVAILABLE', details) {
    return new AppError(message, 503, code, details)
  }
}

module.exports = AppError
