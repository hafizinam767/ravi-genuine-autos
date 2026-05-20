import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Simple hash for demo purposes — in production use bcrypt
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'register') {
      const { name, email, phone, password } = body;

      // Validate
      if (!name?.trim()) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }
      if (!email?.trim()) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existing = await db.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      // Create user
      const user = await db.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          password: simpleHash(password),
          address: null,
          city: null,
        },
      });

      return NextResponse.json(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone ?? undefined,
            address: user.address ?? undefined,
            city: user.city ?? undefined,
          },
        },
        { status: 201 }
      );
    }

    if (action === 'login') {
      const { email, password } = body;

      if (!email?.trim()) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }

      // Find user
      const user = await db.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (!user || user.password !== simpleHash(password)) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone ?? undefined,
          address: user.address ?? undefined,
          city: user.city ?? undefined,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
