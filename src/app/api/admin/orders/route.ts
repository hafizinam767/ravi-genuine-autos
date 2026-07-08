import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  carModel: true,
                },
              },
            },
          },
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.order.count(),
    ]);

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        userName: order.userName,
        userPhone: order.userPhone,
        userEmail: order.userEmail,
        userAddress: order.userAddress,
        userCity: order.userCity,
        notes: order.notes,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: item.product
            ? {
                id: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                images: item.product.images,
                condition: item.product.condition,
                category: item.product.category?.name ?? '',
                carModel: item.product.carModel
                  ? `${item.product.carModel.make} ${item.product.carModel.name}`
                  : '',
              }
            : null,
        })),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
