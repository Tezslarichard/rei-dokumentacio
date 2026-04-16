import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'rei_jwt_titok_kulcs_2026';

export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function generateToken(payload: object): string {
  return (jwt as any).sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
