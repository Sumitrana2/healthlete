import { Request } from "express";

export function extractAccessToken(req: Request, cookieName: string): string | undefined {
  const cookieToken = req.cookies?.[cookieName];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }

  return undefined;
}
