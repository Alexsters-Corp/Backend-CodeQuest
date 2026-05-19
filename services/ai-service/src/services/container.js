const { createDbPool } = require('@codequest/shared')
const { env } = require('../config/env')
const { GroqContentService } = require('./groqContentService')
const { GroqEvaluationService } = require('./groqEvaluationService')

const pool = createDbPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  port: env.db.port,
  connectionLimit: env.db.connectionLimit,
})

const groqContentService = new GroqContentService({ pool })
const groqEvaluationService = new GroqEvaluationService({ pool })

module.exports = {
  pool,
  groqContentService,
  groqEvaluationService,
}
