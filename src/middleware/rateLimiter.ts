// import rateLimit from "express-rate-limit";
// import { RedisStore } from "rate-limit-redis";
// import redis from "../config/redis";

// const redisStore = (prefix: string) =>
//   new RedisStore({
//     sendCommand: (...args: string[]) =>
//       redis.call(args[0], ...args.slice(1)) as any,
//     prefix,
//   });

// export const globalRateLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     success: false,
//     message: "Too many requests, please try again later.",
//     code: "RATE_LIMIT_EXCEEDED",
//   },
//   store: redisStore("rl:global:"),
// });

// export const authRateLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     success: false,
//     message: "Too many attempts, please try again after 15 minutes.",
//     code: "AUTH_RATE_LIMIT_EXCEEDED",
//   },
//   store: redisStore("rl:auth:"),
// });

// export const otpRateLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000,
//   max: 3,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     success: false,
//     message: "Too many OTP requests, please try again after 1 hour.",
//     code: "OTP_RATE_LIMIT_EXCEEDED",
//   },
//   store: redisStore("rl:otp:"),
// });



import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../config/redis";
import { RATE_LIMIT } from "../constants/app.constants";

const redisStore = (prefix: string) =>
  new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.call(args[0], ...args.slice(1)) as any,
    prefix,
  });

function windowLabel(ms: number): string {
  if (ms >= 3600000) {
    const hours = ms / 3600000;
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  if (ms >= 60000) {
    const minutes = ms / 60000;
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  const seconds = ms / 1000;
  return `${seconds} second${seconds > 1 ? "s" : ""}`;
}

export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.GLOBAL_WINDOW_MS,
  max: RATE_LIMIT.GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Too many requests, please try again after ${windowLabel(
      RATE_LIMIT.GLOBAL_WINDOW_MS
    )}.`,
    code: "RATE_LIMIT_EXCEEDED",
  },
  store: redisStore("rl:global:"),
});

export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Too many attempts, please try again after ${windowLabel(
      RATE_LIMIT.AUTH_WINDOW_MS
    )}.`,
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  store: redisStore("rl:auth:"),
});

export const otpRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.OTP_WINDOW_MS,
  max: RATE_LIMIT.OTP_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Too many OTP requests, please try again after ${windowLabel(
      RATE_LIMIT.OTP_WINDOW_MS
    )}.`,
    code: "OTP_RATE_LIMIT_EXCEEDED",
  },
  store: redisStore("rl:otp:"),
});