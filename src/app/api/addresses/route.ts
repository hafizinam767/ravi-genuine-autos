import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helper';

// GET: Get user's addresses
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST: Add new address
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { label, name, phone, address, city, isDefault } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Recipient name is required' }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    if (!address?.trim()) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    if (!city?.trim()) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the first address, make it default
    const addressCount = await db.address.count({ where: { userId: user.id } });
    const shouldDefault = isDefault || addressCount === 0;

    const newAddress = await db.address.create({
      data: {
        userId: user.id,
        label: label?.trim() || 'Home',
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        isDefault: shouldDefault,
      },
    });

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}

// PUT: Update address
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, label, name, phone, address, city, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (label !== undefined) updateData.label = label.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedAddress = await db.address.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE: Delete address
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Support both query param and body
    const { searchParams } = new URL(request.url);
    const idFromBody = searchParams.get('id');
    let id = idFromBody;
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // No body
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    await db.address.delete({ where: { id } });

    // If deleted address was default, set another as default
    if (existing.isDefault) {
      const firstAddress = await db.address.findFirst({
        where: { userId: user.id },
        orderBy: { id: 'desc' },
      });
      if (firstAddress) {
        await db.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
