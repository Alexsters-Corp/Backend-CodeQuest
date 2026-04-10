const express = require('express')
const { getMe } = require('../controllers/user.controller')
const { authGuard } = require('../services/container')

const router = express.Router()

router.get('/me', authGuard, getMe)

module.exports = router
