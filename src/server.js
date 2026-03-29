const { env } = require('./config/env')
const pool = require('./config/db')
const createApp = require('./app')

const app = createApp()
const server = app.listen(env.port, () => {
  console.log(`Servidor backend ejecutándose en http://localhost:${env.port}`)
})

let isShuttingDown = false

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return
  }
  isShuttingDown = true

  console.log(`[Server] Señal ${signal} recibida. Cerrando servidor...`)

  server.close(async () => {
    try {
      await pool.end()
      console.log('[Server] Conexiones de base de datos cerradas.')
      process.exit(0)
    } catch (error) {
      console.error('[Server] Error cerrando conexiones de base de datos:', error)
      process.exit(1)
    }
  })

  setTimeout(() => {
    console.error('[Server] Cierre forzado por timeout.')
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
