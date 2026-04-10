const AppError = require('../errors/AppError')

function requireFields(payload, fields) {
  const data = payload || {}
  const missing = fields.filter((field) => data[field] === undefined || data[field] === null || data[field] === '')

  if (missing.length > 0) {
    throw AppError.badRequest(`Campos requeridos: ${missing.join(', ')}.`, 'VALIDATION_ERROR')
  }
}

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw AppError.badRequest(`${fieldName} debe ser un entero positivo.`, 'VALIDATION_ERROR')
  }
  return parsed
}

function parseString(value, fieldName, { trim = true, minLength = 1 } = {}) {
  if (typeof value !== 'string') {
    throw AppError.badRequest(`${fieldName} debe ser texto.`, 'VALIDATION_ERROR')
  }

  const normalized = trim ? value.trim() : value

  if (normalized.length < minLength) {
    throw AppError.badRequest(`${fieldName} no cumple longitud minima de ${minLength}.`, 'VALIDATION_ERROR')
  }

  return normalized
}

module.exports = {
  requireFields,
  parsePositiveInt,
  parseString,
}
