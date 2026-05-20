import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

const RECOMMENDATION_SYSTEM_PROMPT = `You are a product recommendation engine for Ravi Genuine Autos, a Pakistani vehicle parts e-commerce shop. Your job is to analyze a list of products and rank them by relevance for a given context.

Given a list of products and context (car model, category, current product), return a JSON object with:
- rankedProductIds: An array of product IDs ordered by relevance (most relevant first)
- reasoning: A brief explanation of why these products are recommended
- tips: Helpful advice for the customer about these types of parts

IMPORTANT: Return ONLY the JSON object, no other text.

Consider these factors when ranking:
1. Products for the same car model should rank higher
2. Products in related categories should rank higher
3. Products with "new" condition may be preferred over "used" for critical parts
4. Consider complementary parts (e.g., if looking at brake pads, recommend rotors too)
5. Featured products may be highlighted`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const carModelId = searchParams.get('carModelId');
    const categoryId = searchParams.get('categoryId');
    const currentProductId = searchParams.get('currentProductId');

    // Build query to fetch candidate products
    const where: Record<string, unknown> = {};

    if (currentProductId) {
      where.NOT = { id: currentProductId };
    }

    // Prioritize same car model and category
    const orConditions: Record<string, unknown>[] = [];

    if (carModelId) {
      orConditions.push({ carModelId });
    }
    if (categoryId) {
      orConditions.push({ categoryId });
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    // Fetch products for recommendations
    const products = await db.product.findMany({
      where: orConditions.length > 0 ? where : {},
      include: {
        category: true,
        carModel: true,
      },
      take: 30,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // If we have enough products, use AI to rank them
    if (products.length > 0) {
      try {
        const zai = await ZAI.create();

        // Get the current product for context
        let currentProduct = null;
        if (currentProductId) {
          currentProduct = await db.product.findUnique({
            where: { id: currentProductId },
            include: { category: true, carModel: true },
          });
        }

        // Get car model and category info
        let carModelInfo = null;
        if (carModelId) {
          carModelInfo = await db.carModel.findUnique({
            where: { id: carModelId },
          });
        }

        let categoryInfo = null;
        if (categoryId) {
          categoryInfo = await db.category.findUnique({
            where: { id: categoryId },
          });
        }

        const productList = products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          condition: p.condition,
          category: p.category.name,
          carModel: `${p.carModel.make} ${p.carModel.name}`,
          featured: p.featured,
        }));

        const contextMessage = `Context:
- Car Model: ${carModelInfo ? `${carModelInfo.make} ${carModelInfo.name}` : 'Not specified'}
- Category: ${categoryInfo?.name || 'Not specified'}
- Current Product: ${currentProduct ? `${currentProduct.name} (${currentProduct.category.name} for ${currentProduct.carModel.make} ${currentProduct.carModel.name})` : 'Not specified'}

Products to rank:
${JSON.stringify(productList, null, 2)}`;

        const completion = await zai.chat.completions.create({
          model: 'deepseek-ai/DeepSeek-V3',
          messages: [
            { role: 'assistant', content: RECOMMENDATION_SYSTEM_PROMPT },
            { role: 'user', content: contextMessage },
          ],
          thinking: { type: 'disabled' },
        });

        const aiResponse = completion.choices?.[0]?.message?.content || '';
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const aiResult = JSON.parse(jsonMatch[0]);
          const rankedIds = aiResult.rankedProductIds || [];

          // Sort products by AI ranking
          const productMap = new Map(products.map((p) => [p.id, p]));
          const rankedProducts = rankedIds
            .filter((id: string) => productMap.has(id))
            .map((id: string) => productMap.get(id)!)
            .slice(0, 8);

          // Add any remaining products not in the AI ranking
          const rankedIdSet = new Set(rankedIds);
          const remaining = products.filter((p) => !rankedIdSet.has(p.id));

          const recommendations = [...rankedProducts, ...remaining].slice(0, 8);

          return NextResponse.json({
            recommendations,
            reasoning: aiResult.reasoning || null,
            tips: aiResult.tips || null,
          });
        }
      } catch (aiError) {
        console.error('Error in AI recommendations, falling back to simple ranking:', aiError);
        // Fall through to simple ranking
      }
    }

    // Fallback: simple ranking without AI
    // Sort by relevance: same car model first, then same category, then featured
    const sortedProducts = [...products].sort((a, b) => {
      // Featured products first
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      // Same car model
      if (carModelId) {
        if (a.carModelId === carModelId && b.carModelId !== carModelId) return -1;
        if (a.carModelId !== carModelId && b.carModelId === carModelId) return 1;
      }
      // Same category
      if (categoryId) {
        if (a.categoryId === categoryId && b.categoryId !== categoryId) return -1;
        if (a.categoryId !== categoryId && b.categoryId === categoryId) return 1;
      }
      return 0;
    });

    return NextResponse.json({
      recommendations: sortedProducts.slice(0, 8),
      reasoning: null,
      tips: null,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
