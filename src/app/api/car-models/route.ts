import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helper';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET() {
  try {
    const carModels = await db.carModel.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ make: 'asc' }, { name: 'asc' }],
    });

    const formatted = carModels.map((model) => ({
      id: model.id,
      name: model.name,
      make: model.make,
      slug: model.slug,
      image: model.image,
      productCount: model._count.products,
      createdAt: model.createdAt,
    }));

    return NextResponse.json({ carModels: formatted });
  } catch (error) {
    console.error('Error fetching car models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car models' },
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
    const { name, make, image } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Car model name is required' },
        { status: 400 }
      );
    }

    if (!make?.trim()) {
      return NextResponse.json(
        { error: 'Car make (brand) is required' },
        { status: 400 }
      );
    }

    // Generate unique slug from make + name
    const baseSlug = slugify(`${make.trim()}-${name.trim()}`);
    let slug = baseSlug;
    let slugCounter = 1;

    while (await db.carModel.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

    const carModel = await db.carModel.create({
      data: {
        name: name.trim(),
        make: make.trim(),
        slug,
        image: image?.trim() || null,
      },
    });

    return NextResponse.json({ carModel }, { status: 201 });
  } catch (error) {
    console.error('Error creating car model:', error);
    return NextResponse.json(
      { error: 'Failed to create car model' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, make, image } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Car model ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.carModel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Car model not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (make !== undefined) {
      updateData.make = make.trim();
    }

    // Regenerate slug if name or make changes
    if (name !== undefined || make !== undefined) {
      const newName = (name !== undefined ? name : existing.name).trim();
      const newMake = (make !== undefined ? make : existing.make).trim();
      const baseSlug = slugify(`${newMake}-${newName}`);
      let slug = baseSlug;
      let slugCounter = 1;

      const existingWithSlug = await db.carModel.findUnique({
        where: { slug },
      });
      while (existingWithSlug && existingWithSlug.id !== id) {
        slug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
      }
      updateData.slug = slug;
    }

    if (image !== undefined) {
      updateData.image = image?.trim() || null;
    }

    const carModel = await db.carModel.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ carModel });
  } catch (error) {
    console.error('Error updating car model:', error);
    return NextResponse.json(
      { error: 'Failed to update car model' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Car model ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.carModel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Car model not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if car model has products
    if (existing._count.products > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete car model. It has ${existing._count.products} product(s). Please move or delete the products first.`,
        },
        { status: 400 }
      );
    }

    await db.carModel.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Car model deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting car model:', error);
    return NextResponse.json(
      { error: 'Failed to delete car model' },
      { status: 500 }
    );
  }
}
