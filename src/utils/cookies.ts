import { Response } from "express";
import { env } from "../config/env";

const isProd = env.NODE_ENV === "production";

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  type: "brand" | "admin"
) {
  const accessCookieName = `${type}_access_token`;
  const refreshCookieName = `${type}_refresh_token`;

  res.cookie(accessCookieName, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: isProd ? ".healthlete.com" : undefined,
    maxAge: 15 * 60 * 1000,
    path: "/",
  });

  res.cookie(refreshCookieName, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: isProd ? ".healthlete.com" : undefined,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: `/api/v1/${type}/auth/refresh`,
  });
}

export function clearAuthCookies(res: Response, type: "brand" | "admin") {
  const isProd = env.NODE_ENV === "production";

  res.clearCookie(`${type}_access_token`, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: isProd ? ".healthlete.com" : undefined,
    path: "/",
  });

  res.clearCookie(`${type}_refresh_token`, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: isProd ? ".healthlete.com" : undefined,
    path: `/api/v1/${type}/auth/refresh`,
  });
}
