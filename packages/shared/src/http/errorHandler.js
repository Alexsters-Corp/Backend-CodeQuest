const AppError = require('../errors/AppError')

function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  const isKnown = error instanceof AppError
  const statusCode = isKnown ? error.statusCode : 500

  const payload = {
    message: isKnown ? error.message : 'Error interno del servidor.',
    code: isKnown ? error.code : 'INTERNAL_ERROR',
  }

  if (isKnown && error.details !== undefined) {
    payload.details = error.details
  }

  if (!isKnown) {
    console.error('[UnhandledError]', error)
  }

  if (process.env.NODE_ENV !== 'production' && !isKnown) {
    payload.error = error.message
  }

  return res.status(statusCode).json(payload)
}

module.exports = errorHandler
