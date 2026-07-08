import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helper';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        carModel: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

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

    // Check if product exists
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      condition,
      stock,
      categoryId,
      carModelId,
      featured,
      sku,
      partNumber,
      images,
    } = body;

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name.trim();
      // Regenerate slug if name changes
      const baseSlug = slugify(name.trim());
      let slug = baseSlug;
      let slugCounter = 1;

      const existingWithSlug = await db.product.findUnique({
        where: { slug },
      });
      while (existingWithSlug && existingWithSlug.id !== id) {
        slug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
      }
      updateData.slug = slug;
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (price !== undefined) {
      updateData.price = parseFloat(String(price));
    }

    if (condition !== undefined) {
      updateData.condition = condition;
    }

    if (stock !== undefined) {
      updateData.stock = parseInt(String(stock), 10);
    }

    if (categoryId !== undefined) {
      const categoryExists = await db.category.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        );
      }
      updateData.categoryId = categoryId;
    }

    if (carModelId !== undefined) {
      const carModelExists = await db.carModel.findUnique({
        where: { id: carModelId },
      });
      if (!carModelExists) {
        return NextResponse.json(
          { error: 'Car model not found' },
          { status: 400 }
        );
      }
      updateData.carModelId = carModelId;
    }

    if (featured !== undefined) {
      updateData.featured = featured;
    }

    if (sku !== undefined) {
      updateData.sku = sku?.trim() || null;
    }

    if (partNumber !== undefined) {
      updateData.partNumber = partNumber?.trim() || null;
    }

    if (images !== undefined) {
      updateData.images = images;
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        carModel: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

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

    // Check if product exists
    const existing = await db.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
        wishlists: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete related records first, then the product
    await db.$transaction(async (tx) => {
      // Delete wishlist entries for this product
      await tx.wishlist.deleteMany({
        where: { productId: id },
      });

      // Delete order items for this product
      await tx.orderItem.deleteMany({
        where: { productId: id },
      });

      // Delete the product
      await tx.product.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
