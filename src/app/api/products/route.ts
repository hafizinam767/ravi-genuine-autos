import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helper';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const carModel = searchParams.get('carModel');
    const condition = searchParams.get('condition');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (category) {
      where.categoryId = category;
    }

    if (carModel) {
      where.carModelId = carModel;
    }

    if (condition) {
      where.condition = condition;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
        { partNumber: { contains: search } },
      ];
    }

    // Determine sort order
    const sortBy = searchParams.get('sortBy') || 'default';
    let orderBy: Record<string, string> = { createdAt: 'desc' };

    if (sortBy === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          carModel: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
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

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'Product description is required' },
        { status: 400 }
      );
    }

    if (price === undefined || price === null || price < 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!carModelId) {
      return NextResponse.json(
        { error: 'Car model is required' },
        { status: 400 }
      );
    }

    // Verify category exists
    const categoryExists = await db.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      );
    }

    // Verify car model exists
    const carModelExists = await db.carModel.findUnique({
      where: { id: carModelId },
    });
    if (!carModelExists) {
      return NextResponse.json(
        { error: 'Car model not found' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = slugify(name.trim());
    let slug = baseSlug;
    let slugCounter = 1;

    while (await db.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

    const product = await db.product.create({
      data: {
        name: name.trim(),
        slug,
        description: description.trim(),
        price: parseFloat(String(price)),
        condition: condition || 'new',
        stock: stock !== undefined ? parseInt(String(stock), 10) : 0,
        images: images || '',
        sku: sku?.trim() || null,
        partNumber: partNumber?.trim() || null,
        categoryId,
        carModelId,
        featured: featured || false,
      },
      include: {
        category: true,
        carModel: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
