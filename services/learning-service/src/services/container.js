const { createDbPool, TableSchemaRepository } = require('@codequest/shared')
const { env } = require('../config/env')
const PathsRepository = require('../repositories/paths.repository')
const LessonsRepository = require('../repositories/lessons.repository')
const ProgressRepository = require('../repositories/progress.repository')
const FavoritesRepository = require('../repositories/favorites.repository')
const DiagnosticRepository = require('../repositories/diagnostic.repository')
const ClassManagementRepository = require('../repositories/class-management.repository')
const SubmissionsRepository = require('../repositories/submissions.repository')
const SchemaGuardService = require('./schema-guard.service')
const LearningService = require('./learning.service')
const diagnosticQuestionBank = require('./diagnostic-question-bank.service')

const pool = createDbPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  port: env.db.port,
  connectionLimit: env.db.connectionLimit,
})

const schemaRepository = new TableSchemaRepository({ pool })
const pathsRepository = new PathsRepository({ pool })
const lessonsRepository = new LessonsRepository({ pool })
const progressRepository = new ProgressRepository({ pool })
const favoritesRepository = new FavoritesRepository({ pool })
const diagnosticRepository = new DiagnosticRepository({ pool })
const classManagementRepository = new ClassManagementRepository({ pool })
const submissionsRepository = new SubmissionsRepository({ pool })

const schemaGuardService = new SchemaGuardService({ schemaRepository })

const learningService = new LearningService({
  pathsRepository,
  lessonsRepository,
  progressRepository,
  favoritesRepository,
  diagnosticRepository,
  classManagementRepository,
  submissionsRepository,
  schemaGuardService,
  diagnosticQuestionBank,
})

module.exports = {
  pool,
  learningService,
}
