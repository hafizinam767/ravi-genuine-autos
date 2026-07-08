import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateResetToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();

    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (user) {
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.passwordReset.create({
        data: {
          email: emailLower,
          token,
          expiresAt,
        },
      });

      // In production, send email with reset link containing the token
      // For development, log the token
      console.log(`Password reset token for ${emailLower}: ${token}`);
    }

    return NextResponse.json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return success-like message to prevent enumeration
    return NextResponse.json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  }
}
