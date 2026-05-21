import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-access-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export function generateAccessToken(user: any): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );
}

export function generateRefreshToken(user: { id: string }): string {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN as any }
  );
}

export function verifyAccessToken(token: string): UserPayload {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
}

export function verifyRefreshToken(token: string): { id: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { id: string };
}
