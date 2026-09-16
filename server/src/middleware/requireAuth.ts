import type { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE_NAME, verifyToken } from "../lib/auth.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    req.userId = verifyToken(token).userId;
    next();
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
}
