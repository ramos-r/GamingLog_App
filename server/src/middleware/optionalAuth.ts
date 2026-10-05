import type { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE_NAME, verifyToken } from "../lib/auth.js";

// Same cookie check as requireAuth, but a missing or invalid cookie just
// leaves req.userId undefined instead of answering 401. Used only by the
// public profile route.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  if (token) {
    try {
      req.userId = verifyToken(token).userId;
    } catch {
      // Invalid or expired cookie: treat the viewer as logged out.
    }
  }
  next();
}
