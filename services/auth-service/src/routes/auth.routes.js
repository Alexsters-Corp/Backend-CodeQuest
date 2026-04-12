const express = require('express')
const { authorize } = require('@codequest/shared')
const {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
  changeUserRole,
} = require('../controllers/auth.controller')
const requireCurrentUser = require('../middleware/require-current-user')
const { authGuard } = require('../services/container')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/verify-email', verifyEmail)
router.get('/me', authGuard, requireCurrentUser, getMe)
router.patch('/me/role', authGuard, requireCurrentUser, authorize('admin'), changeUserRole)

module.exports = router
