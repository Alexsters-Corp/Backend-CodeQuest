const AppError = require('../core/errors/AppError')
const { isFeatureEnabled } = require('../config/featureFlags')

function featureFlagGuard(flagName) {
  return (_req, _res, next) => {
    if (!isFeatureEnabled(flagName)) {
      return next(AppError.notFound('Recurso no disponible en este entorno.', 'FEATURE_DISABLED'))
    }

    return next()
  }
}

module.exports = featureFlagGuard
