// Redis client used by the CodeQuest AI service cache layer.
const { createClient } = require('redis')
const { env } = require('../config/env')

let clientPromise = null

async function createRedisClient() {
  try {
    if (clientPromise) {
      return clientPromise
    }

    if (!env.redis?.host) {
      return null
    }

    const client = createClient({
      socket: {
        host: env.redis.host,
        port: env.redis.port,
      },
      password: env.redis.password || undefined,
    })

    client.on('error', () => {})

    clientPromise = client.connect().then(() => client).catch(() => null)
    return clientPromise
  } catch (_error) {
    return null
  }
}

module.exports = {
  createRedisClient,
}
