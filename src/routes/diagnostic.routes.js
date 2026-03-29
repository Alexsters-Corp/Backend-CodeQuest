const express = require('express')
const router = express.Router()
const authGuard = require('../middleware/authGuard')
const { startTest, submitAnswer, finishTest } = require('../controllers/diagnostic.controller')

router.get('/start', authGuard, startTest)
router.post('/answer', authGuard, submitAnswer)
router.post('/finish', authGuard, finishTest)

module.exports = router
