import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helper';

// ─── PUT — Update order status and/or contact details ────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, userName, userPhone, userEmail, userAddress, userCity, notes } = body;

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (userName !== undefined) updateData.userName = userName.trim();
    if (userPhone !== undefined) updateData.userPhone = userPhone.trim();
    if (userEmail !== undefined) updateData.userEmail = userEmail?.trim() || null;
    if (userAddress !== undefined) updateData.userAddress = userAddress?.trim() || null;
    if (userCity !== undefined) updateData.userCity = userCity?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const order = await db.order.update({ where: { id }, data: updateData });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// ─── DELETE — Remove an order ─────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Delete order items first, then the order
    await db.$transaction([
      db.orderItem.deleteMany({ where: { orderId: id } }),
      db.order.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

