const express = require('express')
const cors = require('cors')
require('dotenv').config()

const pool = require('./config/db')
const authRoutes = require('./routes/auth.routes')
const userRoutes = require('./routes/user.routes')
const languageRoutes = require('./routes/language.routes')
const diagnosticRoutes = require('./routes/diagnostic.routes')
const lessonRoutes = require('./routes/lesson.routes')
const progressRoutes = require('./routes/progress.routes')

const app = express()
const PORT = Number(process.env.PORT || 4000)

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => {
  return res.status(200).json({
    message: 'Backend activo. Usa /api/health para estado y http://localhost:5173 para frontend.',
  })
})

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    return res.status(200).json({ message: 'API activa y base de datos conectada.' })
  } catch (error) {
    return res.status(500).json({ message: 'No hay conexión con la base de datos.', error: error.message })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/languages', languageRoutes)
app.use('/api/diagnostic', diagnosticRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/progress', progressRoutes)

app.listen(PORT, () => {
  console.log(`Servidor backend ejecutándose en http://localhost:${PORT}`)
})
