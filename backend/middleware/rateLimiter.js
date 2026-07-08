const rateLimit = require('express-rate-limit');
const { Redis } = require('@upstash/redis');
const { RedisStore } = require('rate-limit-redis');

// ---------------------------------------------------------------------------
// Upstash Redis store — persistent across server restarts and deploys.
// Falls back to in-memory if UPSTASH_REDIS_REST_URL / TOKEN are not set.
// ---------------------------------------------------------------------------
let store = undefined; // undefined = express-rate-limit uses in-memory (default)

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    const redis = new Redis({
      url:   UPSTASH_URL,
      token: UPSTASH_TOKEN,
    });

    store = new RedisStore({
      sendCommand: (...args) => redis.sendCommand(args),
      prefix: 'wm_rl:', // namespace all keys — avoids collisions
    });

    console.log('✅ Rate limiter: using Upstash Redis (persistent)');
  } catch (err) {
    console.warn('⚠️  Rate limiter: Upstash init failed, falling back to in-memory.', err.message);
  }
} else {
  console.warn('⚠️  Rate limiter: UPSTASH_REDIS_REST_URL not set — using in-memory (resets on restart).');
}

// ---------------------------------------------------------------------------
// Factory — creates a rate limiter with the shared Redis store
// ---------------------------------------------------------------------------
const make = (max, windowMs, message) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.realIP || req.ip,
    validate: false,
    ...(store ? { store } : {}), // only attach store if Redis is available
  });

// ---------------------------------------------------------------------------
// Named limiters — applied per route in route files
// ---------------------------------------------------------------------------
const loginLimiter    = make(5,   60_000,  'Too many login attempts. Try again in 1 minute.');
const registerLimiter = make(3,   60_000,  'Too many accounts created. Try again in 1 minute.');
const applyLimiter    = make(10,  60_000,  'Too many applications. Try again in 1 minute.');
const verifyLimiter   = make(5,  300_000,  'Too many verification attempts. Try again in 5 minutes.');

module.exports = {
  loginLimiter,
  registerLimiter,
  applyLimiter,
  verifyLimiter,
};
