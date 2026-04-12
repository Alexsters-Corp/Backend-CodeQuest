const express = require('express')
const { getMe } = require('../controllers/user.controller')
const { authGuard } = require('../services/container')
const requireCurrentUser = require('../middleware/require-current-user')

const router = express.Router()

router.get('/me', authGuard, requireCurrentUser, getMe)

module.exports = router
