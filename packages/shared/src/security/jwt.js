const jwt = require('jsonwebtoken')
const { randomUUID } = require('crypto')

function createJwtToolkit({
  accessSecret,
  refreshSecret,
  accessExpiresIn = '3h',
  refreshExpiresIn = '7d',
}) {
  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets son requeridos para inicializar createJwtToolkit.')
  }

  function signAccessToken(payload) {
    return jwt.sign({ ...payload, jti: randomUUID() }, accessSecret, { expiresIn: accessExpiresIn })
  }

  function signRefreshToken(payload) {
    return jwt.sign({ ...payload, jti: randomUUID() }, refreshSecret, { expiresIn: refreshExpiresIn })
  }

  function verifyAccessToken(token) {
    return jwt.verify(token, accessSecret)
  }

  function verifyRefreshToken(token) {
    return jwt.verify(token, refreshSecret)
  }

  return {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
  }
}

module.exports = {
  createJwtToolkit,
}
