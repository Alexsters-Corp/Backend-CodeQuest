const AppError = require('../errors/AppError')

function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`Ruta ${req.method} ${req.originalUrl} no encontrada.`, 'ROUTE_NOT_FOUND'))
}

module.exports = notFoundHandler
