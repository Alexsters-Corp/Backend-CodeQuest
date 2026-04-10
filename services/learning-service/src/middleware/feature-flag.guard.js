const { AppError } = require('@codequest/shared')
const { env } = require('../config/env')

function featureFlagGuard(featureName) {
  return (req, _res, next) => {
    if (env.features[featureName]) {
      return next()
    }

    return next(
      AppError.serviceUnavailable(
        `La feature ${featureName} esta deshabilitada por configuracion.`,
        'FEATURE_DISABLED',
        { featureName, path: req.originalUrl }
      )
    )
  }
}

module.exports = featureFlagGuard
