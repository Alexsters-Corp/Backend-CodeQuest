const { PORTS } = require('./constants/ports')
const AppError = require('./errors/AppError')
const asyncHandler = require('./http/asyncHandler')
const errorHandler = require('./http/errorHandler')
const notFoundHandler = require('./http/notFoundHandler')
const { requireFields, parsePositiveInt, parseString } = require('./validation/request')
const { createJwtToolkit } = require('./security/jwt')
const { hashToken } = require('./security/tokenHash')
const {
  ROLE_USER,
  ROLE_INSTRUCTOR,
  ROLE_ADMIN,
  normalizeRole,
  getPermissionsForRole,
  hasPermission,
  isAllowedRole,
} = require('./security/roles')
const { createAuthGuard, extractBearerToken } = require('./middleware/authGuard')
const { authorize } = require('./middleware/authorize')
const { createDbPool } = require('./db/createDbPool')
const TableSchemaRepository = require('./db/TableSchemaRepository')

module.exports = {
  PORTS,
  AppError,
  asyncHandler,
  errorHandler,
  notFoundHandler,
  requireFields,
  parsePositiveInt,
  parseString,
  createJwtToolkit,
  hashToken,
  ROLE_USER,
  ROLE_INSTRUCTOR,
  ROLE_ADMIN,
  normalizeRole,
  getPermissionsForRole,
  hasPermission,
  isAllowedRole,
  createAuthGuard,
  extractBearerToken,
  authorize,
  createDbPool,
  TableSchemaRepository,
}
