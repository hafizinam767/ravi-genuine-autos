import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, address, city, email, notes, items, total, userId } =
      body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }
    if (!address?.trim()) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }
    if (!city?.trim()) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Create the order with items in a transaction
    const order = await db.order.create({
      data: {
        userName: name.trim(),
        userPhone: phone.trim(),
        userAddress: address.trim(),
        userCity: city.trim(),
        total,
        userId: userId || null,
        status: 'pending',
        items: {
          create: items.map(
            (item: {
              productId: string;
              price: number;
              quantity: number;
            }) => ({
              productId: item.productId,
              price: item.price,
              quantity: item.quantity,
            })
          ),
        },
      },
    });

    return NextResponse.json(
      {
        orderId: order.id,
        message: 'Order placed successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to place order. Please try again.' },
      { status: 500 }
    );
  }
}
