const express = require('express')
const cors = require('cors')

const pool = require('./config/db')
const asyncHandler = require('./core/http/asyncHandler')
const errorHandler = require('./core/http/errorHandler')
const notFoundHandler = require('./core/http/notFoundHandler')

const authRoutes = require('./routes/auth.routes')
const userRoutes = require('./routes/user.routes')
const languageRoutes = require('./routes/language.routes')
const learningPathRoutes = require('./routes/learningPath.routes')
const diagnosticRoutes = require('./routes/diagnostic.routes')
const lessonRoutes = require('./routes/lesson.routes')
const progressRoutes = require('./routes/progress.routes')

function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.get('/', (_req, res) => {
    return res.status(200).json({
      message: 'Backend activo. Usa /api/health para estado y http://localhost:5173 para frontend.',
    })
  })

  app.get('/api/health', asyncHandler(async (_req, res) => {
    await pool.query('SELECT 1')
    return res.status(200).json({ message: 'API activa y base de datos conectada.' })
  }))

  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/languages', languageRoutes)
  app.use('/api/learning-paths', learningPathRoutes)
  app.use('/api/diagnostic', diagnosticRoutes)
  app.use('/api/lessons', lessonRoutes)
  app.use('/api/progress', progressRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

module.exports = createApp
