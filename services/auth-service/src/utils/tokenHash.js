const crypto = require('crypto')

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

function newRawToken() {
  return crypto.randomBytes(32).toString('hex')
}

module.exports = {
  hashToken,
  newRawToken,
}
