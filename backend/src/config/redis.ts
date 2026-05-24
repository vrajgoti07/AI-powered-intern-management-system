import Redis from "ioredis";
import { config } from "./env";

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null, // Required by BullMQ
});

redis.on("connect", () => {
  console.log("✅ Redis Connected");
});

let lastErrorLoggedTime = 0;

redis.on("error", (err: any) => {
  const now = Date.now();
  if (now - lastErrorLoggedTime > 30000) {
    console.log("❌ Redis Error (throttled to 30s):", err.message || err);
    lastErrorLoggedTime = now;
  }
});

export default redis;
