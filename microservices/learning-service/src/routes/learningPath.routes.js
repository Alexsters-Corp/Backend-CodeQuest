const express = require('express')
const router = express.Router()
const { getLearningPaths } = require('../controllers/language.controller')

// Público — listado de rutas de aprendizaje
router.get('/', getLearningPaths)

module.exports = router
