import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redisClient: IORedis | null = null;

export function getRedis() {
  if (!redisClient) {
    redisClient = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true
    });
  }
  return redisClient;
}
