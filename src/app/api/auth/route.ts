import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Password Helpers (using Node.js crypto.scrypt) ──────────────────────────

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const key = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${key.toString('hex')}`;
}

function verifyPasswordSync(password: string, hash: string): boolean {
  try {
    const [salt, key] = hash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
    return derivedKey.toString('hex') === key;
  } catch {
    return false;
  }
}

// ─── JWT-like Token Helpers ──────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'ravi-genuine-autos-dev-secret-key-2024';
const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
const COOKIE_NAME = 'ravi_session';

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString();
}

function generateToken(payload: { userId: string; email: string; role: string }): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = base64UrlEncode(JSON.stringify({ ...payload, iat: now, exp: now + TOKEN_EXPIRY_SECONDS }));
  const signatureInput = `${header}.${fullPayload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${header}.${fullPayload}.${signature}`;
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

// ─── Shared Helpers ──────────────────────────────────────────────────────────

function sanitizeUser(user: { id: string; name: string; email: string; phone: string | null; role: string; emailVerified: boolean; address: string | null; city: string | null; createdAt: Date; updatedAt: Date }) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone ?? undefined, role: user.role, emailVerified: user.emailVerified, address: user.address ?? undefined, city: user.city ?? undefined };
}

function createSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_EXPIRY_SECONDS}`;
}

function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// Migrate old simple-hash passwords to scrypt on login
function isOldHash(hash: string): boolean {
  return !hash.includes(':'); // Old hashes don't have salt:key format
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── Register ──────────────────────────────────────────────────────
    if (action === 'register') {
      const { name, email, phone, password } = body;
      if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

      const emailLower = email.trim().toLowerCase();
      const existing = await db.user.findUnique({ where: { email: emailLower } });
      if (existing) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });

      const hashedPassword = hashPasswordSync(password);
      const user = await db.user.create({
        data: { name: name.trim(), email: emailLower, phone: phone?.trim() || null, password: hashedPassword },
      });

      const token = generateToken({ userId: user.id, email: user.email, role: user.role });
      const response = NextResponse.json({ user: sanitizeUser(user), message: 'Registration successful' }, { status: 201 });
      response.headers.set('Set-Cookie', createSessionCookie(token));
      return response;
    }

    // ── Login ─────────────────────────────────────────────────────────
    if (action === 'login') {
      const { email, password } = body;
      if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      if (!password) return NextResponse.json({ error: 'Password is required' }, { status: 400 });

      const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

      // Handle both old simple hashes and new scrypt hashes
      let isValid = false;
      if (isOldHash(user.password)) {
        // Old simple hash verification - migrate on success
        const oldHash = ((str: string) => { let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; } return h.toString(36); })(password);
        isValid = user.password === oldHash;
        if (isValid) {
          // Migrate to scrypt
          const newHash = hashPasswordSync(password);
          await db.user.update({ where: { id: user.id }, data: { password: newHash } });
        }
      } else {
        isValid = verifyPasswordSync(password, user.password);
      }

      if (!isValid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

      const token = generateToken({ userId: user.id, email: user.email, role: user.role });
      const response = NextResponse.json({ user: sanitizeUser(user), message: 'Login successful' });
      response.headers.set('Set-Cookie', createSessionCookie(token));
      return response;
    }

    // ── Forgot Password ───────────────────────────────────────────────
    if (action === 'forgot-password') {
      const { email } = body;
      if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

      const emailLower = email.trim().toLowerCase();
      const user = await db.user.findUnique({ where: { email: emailLower } });
      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await db.passwordReset.create({ data: { email: emailLower, token, expiresAt } });
        console.log(`Password reset token for ${emailLower}: ${token}`);
      }
      return NextResponse.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // ── Reset Password ────────────────────────────────────────────────
    if (action === 'reset-password') {
      const { token, password } = body;
      if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });
      if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

      const resetRecord = await db.passwordReset.findUnique({ where: { token } });
      if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
      }

      const user = await db.user.findUnique({ where: { email: resetRecord.email } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const hashedPassword = hashPasswordSync(password);
      await db.$transaction([
        db.user.update({ where: { id: user.id }, data: { password: hashedPassword } }),
        db.passwordReset.update({ where: { id: resetRecord.id }, data: { used: true } }),
      ]);
      return NextResponse.json({ message: 'Password has been reset successfully' });
    }

    // ── Change Password (requires auth) ───────────────────────────────
    if (action === 'change-password') {
      const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
      if (!cookieToken) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      const payload = verifyToken(cookieToken);
      if (!payload) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

      const { oldPassword, newPassword } = body;
      if (!oldPassword) return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      if (!newPassword || newPassword.length < 6) return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });

      const user = await db.user.findUnique({ where: { id: payload.userId } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const isValid = verifyPasswordSync(oldPassword, user.password);
      if (!isValid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

      await db.user.update({ where: { id: user.id }, data: { password: hashPasswordSync(newPassword) } });
      return NextResponse.json({ message: 'Password changed successfully' });
    }

    // ── Logout ────────────────────────────────────────────────────────
    if (action === 'logout') {
      const response = NextResponse.json({ message: 'Logged out successfully' });
      response.headers.set('Set-Cookie', clearSessionCookie());
      return response;
    }

    // ── Me (via POST) ─────────────────────────────────────────────────
    if (action === 'me') {
      const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
      if (!cookieToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      const payload = verifyToken(cookieToken);
      if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

      const user = await db.user.findUnique({ where: { id: payload.userId } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json({ user: sanitizeUser(user) });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
    if (!cookieToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const payload = verifyToken(cookieToken);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Failed to get current user' }, { status: 500 });
  }
}

// ─── Exported utilities for other routes ─────────────────────────────────────

export { verifyToken, generateToken, createSessionCookie, clearSessionCookie, COOKIE_NAME };
