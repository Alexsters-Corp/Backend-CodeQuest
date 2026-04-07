const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = Number(process.env.PORT || 4000)

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001'
const LEARNING_SERVICE_URL = process.env.LEARNING_SERVICE_URL || 'http://localhost:4002'

app.use(cors())
app.use(express.json())

async function proxyRequest(req, res, targetBaseUrl) {
  try {
    const targetUrl = `${targetBaseUrl}${req.originalUrl}`
    const headers = { ...req.headers }
    delete headers.host
    delete headers['content-length']

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    })

    const text = await response.text()
    const contentType = response.headers.get('content-type')

    if (contentType) {
      res.setHeader('content-type', contentType)
    }

    return res.status(response.status).send(text)
  } catch (error) {
    return res.status(502).json({ message: 'Error de gateway al contactar servicio.', error: error.message })
  }
}

function routeTo(targetBaseUrl) {
  return (req, res) => proxyRequest(req, res, targetBaseUrl)
}

app.get('/', (_req, res) => {
  return res.status(200).json({
    message: 'API Gateway activo. Frontend en http://localhost:5173',
    services: {
      auth: AUTH_SERVICE_URL,
      learning: LEARNING_SERVICE_URL,
    },
  })
})

app.get('/api/health', async (_req, res) => {
  try {
    const [authHealth, learningHealth] = await Promise.all([
      fetch(`${AUTH_SERVICE_URL}/internal/health`),
      fetch(`${LEARNING_SERVICE_URL}/internal/health`),
    ])

    const authData = await authHealth.json()
    const learningData = await learningHealth.json()
    const ok = authHealth.ok && learningHealth.ok

    return res.status(ok ? 200 : 503).json({
      gateway: 'ok',
      services: {
        auth: authData,
        learning: learningData,
      },
    })
  } catch (error) {
    return res.status(503).json({ message: 'No se pudo verificar salud de servicios.', error: error.message })
  }
})

app.use('/api/auth', routeTo(AUTH_SERVICE_URL))
app.use('/api/users', routeTo(AUTH_SERVICE_URL))
app.use('/api/languages', routeTo(LEARNING_SERVICE_URL))
app.use('/api/learning-paths', routeTo(LEARNING_SERVICE_URL))
app.use('/api/diagnostic', routeTo(LEARNING_SERVICE_URL))
app.use('/api/lessons', routeTo(LEARNING_SERVICE_URL))
app.use('/api/progress', routeTo(LEARNING_SERVICE_URL))

app.listen(PORT, () => {
  console.log(`API Gateway ejecutandose en http://localhost:${PORT}`)
})
