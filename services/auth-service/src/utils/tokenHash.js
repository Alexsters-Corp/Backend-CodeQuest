const crypto = require('crypto')
const { hashToken } = require('@codequest/shared')

function newRawToken() {
  return crypto.randomBytes(32).toString('hex')
}

module.exports = {
  hashToken,
  newRawToken,
}
