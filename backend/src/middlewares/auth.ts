import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userType?: string;
  clubId?: string;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId = payload.userId;
    req.userType = payload.userType;
    req.clubId = payload.clubId;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
