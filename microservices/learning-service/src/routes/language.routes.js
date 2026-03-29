const express = require('express')
const router = express.Router()
const authGuard = require('../middleware/authGuard')
const { getAll, selectLanguage, getMyLanguages } = require('../controllers/language.controller')

// Público — listado de lenguajes disponibles
router.get('/', getAll)

// Protegidas
router.post('/select', authGuard, selectLanguage)
router.get('/mine', authGuard, getMyLanguages)

module.exports = router
