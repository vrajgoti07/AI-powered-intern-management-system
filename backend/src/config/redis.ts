import Redis from "ioredis";
import { config } from "./env";

/**
 * Create the main Redis client with lazyConnect so the app
 * doesn't crash if Redis is unavailable on startup (e.g. Render free-tier).
 */
const createRedisClient = (): Redis => {
  const client = config.redis.url
    ? new Redis(config.redis.url, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
        retryStrategy: (times: number) => {
          if (times > 5) return null; // Stop retrying after 5 attempts
          return Math.min(times * 500, 3000);
        },
      })
    : new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        retryStrategy: (times: number) => {
          if (times > 5) return null;
          return Math.min(times * 500, 3000);
        },
      });

  attachErrorHandler(client, "primary");
  return client;
};

/**
 * Attach a throttled error handler to any Redis client so the
 * "missing 'error' handler" warning never triggers unhandled rejections.
 */
let lastErrorLoggedTime = 0;

function attachErrorHandler(client: Redis, label: string) {
  client.on("connect", () => {
    const isUpstash = config.redis.url?.includes("upstash");
    console.log(`✅ ${isUpstash ? "Upstash " : ""}Redis Connected (${label})`);
  });

  client.on("error", (err: any) => {
    const now = Date.now();
    if (now - lastErrorLoggedTime > 30000) {
      console.log(`❌ Redis Error [${label}] (throttled to 30s):`, err.message || err);
      lastErrorLoggedTime = now;
    }
  });
}

const redis = createRedisClient();

/**
 * Try to connect, but don't crash if Redis is unavailable.
 * Components check `redis.status === 'ready'` before using it.
 */
redis.connect().catch((err) => {
  console.log("⚠️  Redis initial connection failed (app will continue without Redis):", err.message);
});

/**
 * Safe duplicate: creates a duplicate Redis client that already has
 * error handlers attached, preventing "missing 'error' handler" crashes.
 */
export function safeDuplicate(label = "duplicate"): Redis {
  const dup = redis.duplicate();
  attachErrorHandler(dup, label);
  return dup;
}

export default redis;