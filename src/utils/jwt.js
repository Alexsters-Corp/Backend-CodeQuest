const jwt = require('jsonwebtoken')
const { env } = require('../config/env')

const ACCESS_SECRET = env.jwt.accessSecret
const REFRESH_SECRET = env.jwt.refreshSecret
const ACCESS_EXPIRES = env.jwt.accessExpiresIn
const REFRESH_EXPIRES = env.jwt.refreshExpiresIn

/**
 * Genera un access token de corta duración.
 * @param {{ id: number, email: string }} payload
 * @returns {string}
 */
function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES })
}

/**
 * Genera un refresh token de larga duración.
 * @param {{ id: number }} payload
 * @returns {string}
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES })
}

/**
 * Verifica un access token.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET)
}

/**
 * Verifica un refresh token.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET)
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
}
