const express = require('express')
const { searchUsers, followUser, unfollowUser, getFollowDirectory, getPublicProfile } = require('../controllers/social.controller')
const { authGuard } = require('../services/container')
const requireCurrentUser = require('../middleware/require-current-user')

const router = express.Router()

router.get('/search', authGuard, requireCurrentUser, searchUsers)
router.get('/directory', authGuard, requireCurrentUser, getFollowDirectory)
router.get('/profile/:username', authGuard, requireCurrentUser, getPublicProfile)
router.post('/follow/:username', authGuard, requireCurrentUser, followUser)
router.delete('/follow/:username', authGuard, requireCurrentUser, unfollowUser)

module.exports = router
