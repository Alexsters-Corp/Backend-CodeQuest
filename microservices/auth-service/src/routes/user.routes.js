const express = require('express')
const authGuard = require('../middleware/authGuard')
const { getMe, updateMe } = require('../controllers/user.controller')

const router = express.Router()

router.get('/me', authGuard, getMe)
router.put('/me', authGuard, updateMe)

module.exports = router
