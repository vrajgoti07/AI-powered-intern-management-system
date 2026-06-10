import Redis from "ioredis";
import { config } from "./env";

/** Per-client last-error timestamp to throttle log spam. */
const errorTimestamps = new WeakMap<Redis, number>();

/**
 * Attach connect + error handlers to any Redis client.
 * Errors are throttled to one log per 60 s per client so
 * the logs never flood on quota-exceeded or network issues.
 */
function attachHandlers(client: Redis, label: string): void {
  client.on("connect", () => {
    const isUpstash = config.redis.url?.includes("upstash");
    console.log(`✅ ${isUpstash ? "Upstash " : ""}Redis Connected (${label})`);
  });

  client.on("error", (err: Error) => {
    const last = errorTimestamps.get(client) ?? 0;
    const now = Date.now();
    if (now - last > 60_000) {
      console.log(`⚠️  Redis [${label}]: ${err.message}`);
      errorTimestamps.set(client, now);
    }
  });
}

/**
 * Retry strategy: exponential back-off, stop after 6 attempts.
 * Returning null tells ioredis to give up and stay disconnected
 * (status = 'end') — components check status === 'ready' before use.
 */
const retryStrategy = (times: number): number | null => {
  if (times > 6) return null;
  return Math.min(times * 500, 5000);
};

const baseOptions = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy,
  enableReadyCheck: true,
} as const;

/**
 * Create the singleton Redis client.
 * lazyConnect = true means no connection attempt until .connect() is called.
 */
const createClient = (): Redis => {
  const client = config.redis.url
    ? new Redis(config.redis.url, baseOptions)
    : new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        ...baseOptions,
      });

  attachHandlers(client, "primary");
  return client;
};

const redis = createClient();

// Kick off the connection attempt — failures are handled by the error handler above.
redis.connect().catch(() => {
  // Swallow — the 'error' event listener already logs once per 60 s.
});

/**
 * Create a duplicate Redis client with error handlers attached.
 * Use this instead of redis.duplicate() to prevent "missing error handler" crashes.
 */
export function safeDuplicate(label = "duplicate"): Redis {
  const dup = redis.duplicate();
  attachHandlers(dup, label);
  // Also attempt to connect the duplicate
  dup.connect().catch(() => {});
  return dup;
}

export default redis;