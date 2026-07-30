import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { env } from "../../../config/env";

export interface TokenPayload extends JWTPayload {
  id: string;
  email: string;
  type: "brand" | "admin";
}

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.REFRESH_TOKEN_SECRET);

export async function signAccessToken(
  payload: Omit<TokenPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(accessSecret);
}

export async function signRefreshToken(
  payload: Omit<TokenPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.REFRESH_TOKEN_EXPIRES_IN)
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload as TokenPayload;
}

export async function generateTokens(
  payload: Omit<TokenPayload, "iat" | "exp">
) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
}
