const express = require('express')
const { getMe, getProfile, updateProfile } = require('../controllers/user.controller')
const { authGuard } = require('../services/container')
const requireCurrentUser = require('../middleware/require-current-user')

const router = express.Router()

router.get('/me', authGuard, requireCurrentUser, getMe)
router.get('/profile', authGuard, requireCurrentUser, getProfile)
router.put('/profile', authGuard, requireCurrentUser, updateProfile)

module.exports = router
