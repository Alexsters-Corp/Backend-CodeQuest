function parseBooleanFlag(value, defaultValue = true) {
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return defaultValue
}

function isFeatureEnabled(flagName) {
  if (flagName === 'FEATURE_LEARNING_CORE_ENABLED') {
    return parseBooleanFlag(process.env.FEATURE_LEARNING_CORE_ENABLED, true)
  }

  return true
}

module.exports = {
  isFeatureEnabled,
}
