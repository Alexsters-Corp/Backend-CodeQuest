const express = require('express')
const router = express.Router()
const authGuard = require('../middleware/authGuard')
const { getOverview, getLeaderboard, getAchievements } = require('../controllers/progress.controller')

router.get('/overview', authGuard, getOverview)
router.get('/leaderboard', authGuard, getLeaderboard)
router.get('/achievements', authGuard, getAchievements)

module.exports = router
