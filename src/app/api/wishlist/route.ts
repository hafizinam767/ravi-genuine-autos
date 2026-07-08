import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helper';

// GET: Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const wishlists = await db.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: { select: { name: true } },
            carModel: { select: { name: true, make: true } },
          },
        },
      },
      orderBy: { product: { createdAt: 'desc' } },
    });

    return NextResponse.json({
      wishlists: wishlists.map((w) => ({
        id: w.id,
        productId: w.productId,
        product: {
          id: w.product.id,
          name: w.product.name,
          slug: w.product.slug,
          price: w.product.price,
          condition: w.product.condition,
          stock: w.product.stock,
          images: w.product.images,
          category: w.product.category.name,
          carModel: `${w.product.carModel.make} ${w.product.carModel.name}`,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

// POST: Add to wishlist
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Verify product exists
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if already in wishlist
    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existing) {
      return NextResponse.json({ message: 'Already in wishlist', wishlist: existing });
    }

    const wishlist = await db.wishlist.create({
      data: { userId: user.id, productId },
    });

    return NextResponse.json({ wishlist }, { status: 201 });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

// DELETE: Remove from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item not in wishlist' }, { status: 404 });
    }

    await db.wishlist.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
