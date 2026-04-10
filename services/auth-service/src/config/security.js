const { createJwtToolkit } = require('@codequest/shared')
const { env } = require('./env')

const jwtToolkit = createJwtToolkit({
  accessSecret: env.jwt.accessSecret,
  refreshSecret: env.jwt.refreshSecret,
  accessExpiresIn: env.jwt.accessExpiresIn,
  refreshExpiresIn: env.jwt.refreshExpiresIn,
})

module.exports = jwtToolkit
