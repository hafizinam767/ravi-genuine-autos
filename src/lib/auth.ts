import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'ravi-genuine-autos-dev-secret-key-2024';
const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
const COOKIE_NAME = 'ravi_session';
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

// ─── Password Helpers (using Node.js crypto.scrypt) ──────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const key = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${key.toString('hex')}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    // Handle old simple hashes for migration
    if (!hash.includes(':')) {
      let oldHash = 0;
      for (let i = 0; i < password.length; i++) {
        oldHash = (oldHash << 5) - oldHash + password.charCodeAt(i);
        oldHash |= 0;
      }
      return hash === oldHash.toString(36);
    }
    const [salt, key] = hash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
    return derivedKey.toString('hex') === key;
  } catch {
    return false;
  }
}

// ─── JWT Token Helpers ───────────────────────────────────────────────────────

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString();
}

export function generateToken(payload: UserPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = base64UrlEncode(JSON.stringify({ ...payload, iat: now, exp: now + TOKEN_EXPIRY_SECONDS }));
  const signatureInput = `${header}.${fullPayload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${header}.${fullPayload}.${signature}`;
}

export function verifyToken(token: string): UserPayload | null {
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

// ─── Cookie / Session Helpers ────────────────────────────────────────────────

export function createSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_EXPIRY_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ─── Request Helpers ─────────────────────────────────────────────────────────

export async function getUserFromRequest(request: NextRequest): Promise<UserPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  try {
    const user = await db.user.findUnique({ where: { id: payload.userId }, select: { id: true } });
    if (!user) return null;
  } catch {
    return null;
  }
  return payload;
}

export async function getFullUserFromRequest(request: NextRequest) {
  const payload = await getUserFromRequest(request);
  if (!payload) return null;
  try {
    return await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, phone: true, role: true, emailVerified: true, address: true, city: true, createdAt: true, updatedAt: true },
    });
  } catch {
    return null;
  }
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export { COOKIE_NAME };
