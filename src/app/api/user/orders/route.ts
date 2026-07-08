import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const orders = await db.order.findMany({
      where: { userId: user.userId },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      userName: order.userName,
      userPhone: order.userPhone,
      userAddress: order.userAddress,
      userCity: order.userCity,
      notes: order.notes,
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
    }));

    return NextResponse.json({ orders: formatted });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
