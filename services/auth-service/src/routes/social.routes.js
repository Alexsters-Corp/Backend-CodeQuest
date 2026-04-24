const express = require('express')
const { searchUsers, followUser, unfollowUser, getFollowDirectory } = require('../controllers/social.controller')
const { authGuard } = require('../services/container')
const requireCurrentUser = require('../middleware/require-current-user')

const router = express.Router()

router.get('/search', authGuard, requireCurrentUser, searchUsers)
router.get('/directory', authGuard, requireCurrentUser, getFollowDirectory)
router.post('/follow/:username', authGuard, requireCurrentUser, followUser)
router.delete('/follow/:username', authGuard, requireCurrentUser, unfollowUser)

module.exports = router