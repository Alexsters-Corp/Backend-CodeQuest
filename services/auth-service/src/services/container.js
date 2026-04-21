const { createAuthGuard, createDbPool, TableSchemaRepository } = require('@codequest/shared')
const { env } = require('../config/env')
const jwtToolkit = require('../config/security')
const UserRepository = require('../repositories/user.repository')
const AuthTokenRepository = require('../repositories/auth-token.repository')
const TokenBlacklistRepository = require('../repositories/token-blacklist.repository')
const SchemaGuardService = require('./schema-guard.service')
const EmailService = require('./email.service')
const AuthService = require('./auth.service')

const pool = createDbPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  port: env.db.port,
  connectionLimit: env.db.connectionLimit,
})

const userRepository = new UserRepository({ pool })
const authTokenRepository = new AuthTokenRepository({ pool })
const tokenBlacklistRepository = new TokenBlacklistRepository({ pool })
const schemaRepository = new TableSchemaRepository({ pool })
const schemaGuardService = new SchemaGuardService({ schemaRepository })
const emailService = new EmailService()

const authService = new AuthService({
  userRepository,
  authTokenRepository,
  tokenBlacklistRepository,
  schemaGuardService,
  emailService,
  jwtToolkit,
})

const authGuard = createAuthGuard({
  verifyAccessToken: jwtToolkit.verifyAccessToken,
  isTokenRevoked: async (token, decoded) => {
    await schemaGuardService.assertReady()

    const revoked = await tokenBlacklistRepository.isTokenRevoked(token)
    if (revoked) {
      return true
    }

    const user = await userRepository.findById(decoded.id)
    if (!user || !user.tokens_valid_after) {
      return false
    }

    const validAfterTs = Math.floor(new Date(user.tokens_valid_after).getTime() / 1000)
    return Number(decoded.iat) < validAfterTs
  },
})

module.exports = {
  pool,
  userRepository,
  authService,
  authGuard,
  schemaGuardService,
}
