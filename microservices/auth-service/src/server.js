const express = require('express')
const cors = require('cors')
require('dotenv').config()

const pool = require('./config/db')
const authRoutes = require('./routes/auth.routes')
const userRoutes = require('./routes/user.routes')
const notFoundHandler = require('./core/http/notFoundHandler')
const errorHandler = require('./core/http/errorHandler')

const app = express()
const PORT = Number(process.env.PORT || 4001)

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => {
  return res.status(200).json({ message: 'Auth Service activo.' })
})

app.get('/internal/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    return res.status(200).json({ service: 'auth-service', status: 'ok' })
  } catch (error) {
    return res.status(500).json({ service: 'auth-service', status: 'error', error: error.message })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Auth Service ejecutandose en http://localhost:${PORT}`)
})
