import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, address, city } = body;

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null;
    }

    if (address !== undefined) {
      updateData.address = address?.trim() || null;
    }

    if (city !== undefined) {
      updateData.city = city?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        city: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user: {
        ...updatedUser,
        phone: updatedUser.phone ?? undefined,
        address: updatedUser.address ?? undefined,
        city: updatedUser.city ?? undefined,
        role: updatedUser.role ?? undefined,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
