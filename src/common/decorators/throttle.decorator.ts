import { applyDecorators } from "@nestjs/common";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { RATE_LIMIT } from "../../common/constants/app.constants";

export const ThrottleAuth = () =>
  applyDecorators(
    SkipThrottle({ default: true, otp: true }),
    Throttle({
      auth: { limit: RATE_LIMIT.AUTH_MAX, ttl: RATE_LIMIT.AUTH_WINDOW_MS },
    })
  );

export const ThrottleOtp = () =>
  applyDecorators(
    SkipThrottle({ default: true, auth: true }),
    Throttle({
      otp: { limit: RATE_LIMIT.OTP_MAX, ttl: RATE_LIMIT.OTP_WINDOW_MS },
    })
  );
