import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const carModelId = searchParams.get('carModelId');
    const categoryId = searchParams.get('categoryId');
    const currentProductId = searchParams.get('currentProductId');

    const result = await AIService.getRecommendations(carModelId, categoryId, currentProductId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
