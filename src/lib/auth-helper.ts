import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'ravi-genuine-autos-dev-secret-key-2024';
const COOKIE_NAME = 'ravi_session';

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString();
}

function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerEncoded, payloadEncoded, signatureProvided] = parts;
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;
    const signatureExpected = crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (signatureProvided !== signatureExpected) return null;
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = verifyToken(token);
    if (!payload) return null;

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    return user;
  } catch {
    return null;
  }
}

export async function requireAdmin(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin') {
    return null;
  }
  return user;
}
