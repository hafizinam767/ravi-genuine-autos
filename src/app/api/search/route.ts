import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
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

const SEARCH_SYSTEM_PROMPT = `You are an intelligent search assistant for Ravi Genuine Autos, a Pakistani vehicle parts e-commerce shop. Your job is to analyze a customer's search query and extract structured search intent.

Given a search query, you must return a JSON object with these fields:
- partName: The specific part name the user is looking for (e.g., "brake pads", "air filter", "headlight"). If not clear, use null.
- carMake: The car manufacturer (e.g., "Suzuki", "Toyota", "Honda"). If not specified, use null.
- carModel: The specific car model (e.g., "Alto", "Corolla", "Civic"). If not specified, use null.
- condition: The condition preference - "new", "used", or null if not specified.
- category: The most likely category from: Engine, Brakes, Suspension, Electrical, Body, Filters, Clutch, Cooling, Transmission, Steering, Interior, Exhaust, Fuel System, AC. If unclear, use null.
- keywords: An array of relevant search keywords extracted from the query.

IMPORTANT: Return ONLY the JSON object, no other text. Be generous in interpretation - if someone says "brakes", they likely mean brake pads or brake shoes. If someone says "engine oil filter", the part is "oil filter" and category is "Filters".

Example inputs and outputs:
Input: "Suzuki Alto brake pads"
Output: {"partName":"brake pads","carMake":"Suzuki","carModel":"Alto","condition":null,"category":"Brakes","keywords":["suzuki","alto","brake","pads"]}

Input: "used headlight for Honda Civic"
Output: {"partName":"headlight","carMake":"Honda","carModel":"Civic","condition":"used","category":"Electrical","keywords":["used","headlight","honda","civic"]}

Input: "air filter"
Output: {"partName":"air filter","carMake":null,"carModel":null,"condition":null,"category":"Filters","keywords":["air","filter"]}`;

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Initialize the AI SDK
    const zai = await ZAI.create();

    // Get AI analysis of the search query
    const completion = await zai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [
        { role: 'assistant', content: SEARCH_SYSTEM_PROMPT },
        { role: 'user', content: query },
      ],
      thinking: { type: 'disabled' },
    });

    let aiAnalysis = {
      partName: null as string | null,
      carMake: null as string | null,
      carModel: null as string | null,
      condition: null as string | null,
      category: null as string | null,
      keywords: [] as string[],
    };

    try {
      const aiResponse = completion.choices?.[0]?.message?.content || '';
      // Extract JSON from the response (handle potential markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing AI search response:', parseError);
      // Continue with default aiAnalysis
    }

    // Build database query based on AI analysis
    const where: Record<string, unknown> = {};

    if (aiAnalysis.condition) {
      where.condition = aiAnalysis.condition;
    }

    // Search by keywords if available
    const searchTerms = aiAnalysis.keywords?.length
      ? aiAnalysis.keywords
      : [query];

    where.OR = searchTerms.flatMap((term: string) => [
      { name: { contains: term } },
      { description: { contains: term } },
      { sku: { contains: term } },
      { partNumber: { contains: term } },
    ]);

    // Also try to match by category name
    if (aiAnalysis.category) {
      const category = await db.category.findFirst({
        where: { name: { contains: aiAnalysis.category } },
      });
      if (category) {
        where.OR.push({ categoryId: category.id });
      }
    }

    // Also try to match by car model
    if (aiAnalysis.carMake || aiAnalysis.carModel) {
      const carModelWhere: Record<string, unknown> = {};
      if (aiAnalysis.carMake) {
        carModelWhere.make = { contains: aiAnalysis.carMake };
      }
      if (aiAnalysis.carModel) {
        carModelWhere.name = { contains: aiAnalysis.carModel };
      }

      const carModels = await db.carModel.findMany({
        where: carModelWhere,
      });
      if (carModels.length > 0) {
        where.OR.push(
          ...carModels.map((cm) => ({ carModelId: cm.id }))
        );
      }
    }

    const results = await db.product.findMany({
      where,
      include: {
        category: true,
        carModel: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      aiAnalysis,
      results,
    });
  } catch (error) {
    console.error('Error in smart search:', error);

    // Fallback: do a simple database search without AI
    try {
      const body: SearchRequest = await new Request(request).json();
      const simpleResults = await db.product.findMany({
        where: {
          OR: [
            { name: { contains: body.query } },
            { description: { contains: body.query } },
          ],
        },
        include: {
          category: true,
          carModel: true,
        },
        take: 20,
      });

      return NextResponse.json({
        aiAnalysis: {
          partName: null,
          carMake: null,
          carModel: null,
          condition: null,
          category: null,
          keywords: [body.query],
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
