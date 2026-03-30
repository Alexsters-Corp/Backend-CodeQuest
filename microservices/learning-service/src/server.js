const express = require('express')
const cors = require('cors')
require('dotenv').config()

const pool = require('./config/db')
const languageRoutes = require('./routes/language.routes')
const diagnosticRoutes = require('./routes/diagnostic.routes')
const lessonRoutes = require('./routes/lesson.routes')
const progressRoutes = require('./routes/progress.routes')
const notFoundHandler = require('./core/http/notFoundHandler')
const errorHandler = require('./core/http/errorHandler')

const app = express()
const PORT = Number(process.env.PORT || 4002)

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => {
  return res.status(200).json({ message: 'Learning Service activo.' })
})

app.get('/internal/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    return res.status(200).json({ service: 'learning-service', status: 'ok' })
  } catch (error) {
    return res.status(500).json({ service: 'learning-service', status: 'error', error: error.message })
  }
})

app.use('/api/languages', languageRoutes)
app.use('/api/diagnostic', diagnosticRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/progress', progressRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Learning Service ejecutandose en http://localhost:${PORT}`)
})
