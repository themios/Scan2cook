const { kv } = require('@vercel/kv');
const { createClient } = require('redis');

let redisClientPromise;

async function getRedisClient() {
  if (!redisClientPromise) {
    const redisUrl = process.env.kv_REDIS_URL || process.env.KV_URL;
    if (!redisUrl) {
      throw new Error(
        'Database env missing: set KV_REST_API_URL/KV_REST_API_TOKEN or kv_REDIS_URL.'
      );
    }
    const client = createClient({ url: redisUrl });
    redisClientPromise = client.connect().then(() => client);
  }
  return redisClientPromise;
}

function canUseVercelKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function dbGet(key) {
  if (canUseVercelKv()) {
    return kv.get(key);
  }
  const client = await getRedisClient();
  const raw = await client.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function dbSet(key, value) {
  if (canUseVercelKv()) {
    await kv.set(key, value);
    return;
  }
  const client = await getRedisClient();
  await client.set(key, JSON.stringify(value));
}

module.exports = {
  dbGet,
  dbSet,
};
