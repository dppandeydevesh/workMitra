const rateLimit = require('express-rate-limit');

const make = (max, windowMs, message) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.realIP || req.ip,
    validate: false,
  });

const loginLimiter    = make(5,  60000,  'Too many login attempts. Try again in 1 minute.');
const registerLimiter = make(3,  60000,  'Too many accounts created. Try again in 1 minute.');
const applyLimiter    = make(10, 60000,  'Too many applications. Try again in 1 minute.');
const verifyLimiter   = make(5,  300000, 'Too many verification attempts. Try again in 5 minutes.');

module.exports = {
  loginLimiter,
  registerLimiter,
  applyLimiter,
  verifyLimiter
};
