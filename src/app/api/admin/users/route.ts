import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helper';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const key = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${key.toString('hex')}`;
}

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });

    const users = await db.user.findMany({
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        emailVerified: true, address: true, city: true, createdAt: true,
        _count: { select: { orders: true, wishlists: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id, name: u.name, email: u.email, phone: u.phone,
        role: u.role, emailVerified: u.emailVerified, address: u.address,
        city: u.city, createdAt: u.createdAt,
        orderCount: u._count.orders, wishlistCount: u._count.wishlists,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });

    const body = await request.json();
    const { name, email, phone, password, role } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    const userRole = ['customer', 'admin'].includes(role) ? role : 'customer';
    const emailLower = email.trim().toLowerCase();
    const existing = await db.user.findUnique({ where: { email: emailLower } });
    if (existing) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });

    const user = await db.user.create({
      data: { name: name.trim(), email: emailLower, phone: phone?.trim() || null, password: hashPassword(password), role: userRole },
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt } }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT - Update a user
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });

    const body = await request.json();
    const { id, name, email, phone, role, password } = body;
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;

    if (email !== undefined) {
      const emailLower = email.trim().toLowerCase();
      if (emailLower !== existing.email) {
        const conflict = await db.user.findUnique({ where: { email: emailLower } });
        if (conflict) return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
      }
      updateData.email = email.trim().toLowerCase();
    }

    if (role !== undefined) {
      if (!['customer', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      if (role === 'customer' && existing.role === 'admin') {
        const adminCount = await db.user.count({ where: { role: 'admin' } });
        if (adminCount <= 1) return NextResponse.json({ error: 'Cannot demote the last admin account' }, { status: 400 });
      }
      updateData.role = role;
    }

    if (password) {
      if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      updateData.password = hashPassword(password);
    }

    const user = await db.user.update({ where: { id }, data: updateData });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt } });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Remove a user
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    if (id === admin.id) return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 });

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (existing.role === 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) return NextResponse.json({ error: 'Cannot delete the last admin account' }, { status: 400 });
    }

    await db.order.updateMany({ where: { userId: id }, data: { userId: null } });
    await db.$transaction([
      db.wishlist.deleteMany({ where: { userId: id } }),
      db.address.deleteMany({ where: { userId: id } }),
      db.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
