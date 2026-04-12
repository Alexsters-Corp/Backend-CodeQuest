const express = require('express')
const { authorize } = require('@codequest/shared')
const requireCurrentUser = require('../middleware/require-current-user')
const { authGuard } = require('../services/container')
const { listUsers, updateUser } = require('../controllers/admin.controller')

const router = express.Router()

router.get('/users', authGuard, requireCurrentUser, authorize('admin'), listUsers)
router.patch('/users/:id', authGuard, requireCurrentUser, authorize('admin'), updateUser)

module.exports = router
