const express = require('express')
const cors = require('cors')
const { asyncHandler, errorHandler, notFoundHandler } = require('@codequest/shared')
const { env } = require('./config/env')
const { pool } = require('./services/container')
const learningRoutes = require('./routes/learning.routes')
const instructorRoutes = require('./routes/instructor.routes')
const adminRoutes = require('./routes/admin.routes')

const app = express()

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))

app.get('/health', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1')
  return res.status(200).json({ service: env.serviceName, status: 'ok' })
}))

app.get('/internal/health', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1')
  return res.status(200).json({ service: env.serviceName, status: 'ok' })
}))

app.use('/api/learning', learningRoutes)
app.use('/api/instructor', instructorRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(env.port, () => {
  console.log(`[${env.serviceName}] running on http://localhost:${env.port}`)
})

let shuttingDown = false
async function gracefulShutdown(signal) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  console.log(`[${env.serviceName}] ${signal} received, closing server...`)

  server.close(async () => {
    try {
      await pool.end()
      console.log(`[${env.serviceName}] DB connections closed.`)
      process.exit(0)
    } catch (error) {
      console.error(`[${env.serviceName}] Error closing DB connections:`, error)
      process.exit(1)
    }
  })

  setTimeout(() => {
    console.error(`[${env.serviceName}] forced shutdown due timeout.`)
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
