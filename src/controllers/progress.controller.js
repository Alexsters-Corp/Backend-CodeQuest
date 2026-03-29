const pool = require('../config/db')
const asyncHandler = require('../core/http/asyncHandler')
const ProgressService = require('../services/progress.service')

const progressService = new ProgressService({ pool })

/**
 * GET /api/progress/overview
 * Resumen general del progreso del usuario.
 */
const getOverview = asyncHandler(async (req, res) => {
  const result = await progressService.getOverview({ userId: req.user.id })
  return res.status(200).json(result)
})

/**
 * GET /api/progress/leaderboard
 * Tabla de clasificación global.
 */
const getLeaderboard = asyncHandler(async (req, res) => {
  const result = await progressService.getLeaderboard({ userId: req.user.id })
  return res.status(200).json(result)
})

/**
 * GET /api/progress/achievements
 * Todos los logros con estado (desbloqueado o no).
 */
const getAchievements = asyncHandler(async (req, res) => {
  const result = await progressService.getAchievements({ userId: req.user.id })
  return res.status(200).json(result)
})

module.exports = { getOverview, getLeaderboard, getAchievements }
