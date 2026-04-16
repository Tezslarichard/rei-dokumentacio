import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

export interface AuthRequest extends Request {
  user?: any;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Hitelesítés szükséges!' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = (jwt as any).verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Érvénytelen vagy lejárt token!' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.is_admin !== 1) {
    res.status(403).json({ error: 'Admin jogosultság szükséges!' });
    return;
  }
  next();
}
