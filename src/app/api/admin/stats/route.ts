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

    // Run all count queries in parallel
    const [totalProducts, totalCategories, totalOrders, totalUsers, recentOrders, lowStockProducts, revenueResult] =
      await Promise.all([
        db.product.count(),
        db.category.count(),
        db.order.count(),
        db.user.count(),
        db.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  select: { name: true, images: true },
                },
              },
            },
          },
        }),
        db.product.findMany({
          where: {
            stock: { lt: 5 },
          },
          include: {
            category: {
              select: { name: true },
            },
            carModel: {
              select: { name: true, make: true },
            },
          },
          orderBy: { stock: 'asc' },
          take: 10,
        }),
        db.order.aggregate({
          _sum: {
            total: true,
          },
        }),
      ]);

    // Calculate revenue by status
    const [pendingRevenue, completedRevenue] = await Promise.all([
      db.order.aggregate({
        where: { status: 'pending' },
        _sum: { total: true },
        _count: true,
      }),
      db.order.aggregate({
        where: { status: 'delivered' },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    const totalRevenue = revenueResult._sum.total || 0;

    return NextResponse.json({
      overview: {
        totalProducts,
        totalCategories,
        totalOrders,
        totalUsers,
        totalRevenue,
      },
      revenueBreakdown: {
        pending: {
          count: pendingRevenue._count,
          total: pendingRevenue._sum.total || 0,
        },
        completed: {
          count: completedRevenue._count,
          total: completedRevenue._sum.total || 0,
        },
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        userName: order.userName,
        userPhone: order.userPhone,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.items.length,
        items: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      })),
      lowStockProducts: lowStockProducts.map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        price: product.price,
        category: product.category.name,
        carModel: `${product.carModel.make} ${product.carModel.name}`,
      })),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
