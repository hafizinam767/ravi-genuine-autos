import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { db } from '@/lib/db';

interface SearchRequest {
  query: string;
}

// GET handler for simple search (no AI)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || searchParams.get('query') || '';

    if (!q.trim()) {
      return NextResponse.json({ results: [], total: 0, query: q });
    }

    const results = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { sku: { contains: q } },
          { partNumber: { contains: q } },
        ],
      },
      include: {
        category: true,
        carModel: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      aiAnalysis: null,
      results,
      total: results.length,
      query: q,
    });
  } catch (error) {
    console.error('Error in simple search:', error);
    return NextResponse.json(
      { error: 'Search failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let query = '';

  try {
    const body: SearchRequest = await request.json();
    query = body.query?.trim() || '';

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const { aiAnalysis, results } = await AIService.smartSearch(query);

    return NextResponse.json({ aiAnalysis, results });
  } catch (error) {
    console.error('Error in smart search:', error);

    // Fallback: simple database search using already-parsed query
    try {
      const simpleResults = query
        ? await db.product.findMany({
            where: {
              OR: [
                { name: { contains: query } },
                { description: { contains: query } },
              ],
            },
            include: { category: true, carModel: true },
            take: 20,
          })
        : [];

      return NextResponse.json({
        aiAnalysis: {
          partName: null,
          carMake: null,
          carModel: null,
          condition: null,
          category: null,
          keywords: query ? [query] : [],
        },
        results: simpleResults,
      });
    } catch {
      return NextResponse.json(
        { error: 'Search failed. Please try again.' },
        { status: 500 }
      );
    }
  }
}
