import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
