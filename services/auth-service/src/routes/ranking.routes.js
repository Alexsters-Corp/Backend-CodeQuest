const express = require('express')
const { getLeaderboard } = require('../controllers/ranking.controller')
const { authGuard } = require('../services/container')
const requireCurrentUser = require('../middleware/require-current-user')

const router = express.Router()

router.get('/leaderboard', authGuard, requireCurrentUser, getLeaderboard)

module.exports = router