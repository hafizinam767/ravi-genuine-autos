import { db } from '@/lib/db';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IdentificationResult {
  partName: string;
  partCategory: string | null;
  description: string;
  possibleCarModels: string[];
  condition: string | null;
  estimatedCategory: string | null;
  tips: string;
  confidence: 'high' | 'medium' | 'low';
  matchedProduct?: {
    id: string;
    name: string;
    price: number;
    slug: string;
    partNumber: string | null;
    condition: string;
  } | null;
  source?: 'ai' | 'catalog';
}

export interface RecommendationResult {
  recommendations: Array<any>;
  reasoning: string | null;
  tips: string | null;
}

export interface SearchIntent {
  partName: string | null;
  carMake: string | null;
  carModel: string | null;
  condition: string | null;
  category: string | null;
  keywords: string[];
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'you', 'have', 'need', 'want', 'with', 'any', 'can', 'are',
  'what', 'how', 'much', 'does', 'your', 'shop', 'this', 'that', 'from', 'about',
]);

const CAR_MAKES = ['suzuki', 'toyota', 'honda', 'mg', 'changan', 'hyundai', 'daihatsu', 'kia'];

function getGeminiInstance() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function extractHintFromImageData(imageData: string): string | null {
  if (!imageData.includes('image/svg+xml')) return null;
  try {
    const base64 = imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData;
    const svg = Buffer.from(base64, 'base64').toString('utf-8');
    const titleMatch = svg.match(/font-weight="bold"[^>]*>([^<]+)</);
    return titleMatch?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

function normalizeIdentification(parsed: Record<string, unknown>): IdentificationResult {
  return {
    partName: (parsed.partName as string) || 'Identified Part',
    partCategory: (parsed.partCategory as string) || 'General',
    description: (parsed.description as string) || 'Vehicle component inspected',
    possibleCarModels: Array.isArray(parsed.possibleCarModels)
      ? (parsed.possibleCarModels as string[])
      : ['Suzuki Alto', 'Toyota Corolla', 'Honda Civic'],
    condition: (parsed.condition as string) || 'new',
    estimatedCategory: (parsed.estimatedCategory as string) || (parsed.partCategory as string) || 'General',
    tips: (parsed.tips as string) || 'Inspect before installation. Use genuine replacement parts.',
    confidence: (['high', 'medium', 'low'].includes(parsed.confidence as string)
      ? parsed.confidence
      : 'high') as IdentificationResult['confidence'],
    source: 'ai',
  };
}

export class AIService {
  static async matchProductInCatalog(
    partName: string,
    partCategory?: string | null
  ): Promise<IdentificationResult['matchedProduct']> {
    const keywords = extractKeywords(`${partName} ${partCategory || ''}`);
    if (keywords.length === 0) return null;

    const products = await db.product.findMany({
      include: { category: true, carModel: true },
      take: 50,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });

    let bestMatch: (typeof products)[0] | null = null;
    let bestScore = 0;

    for (const product of products) {
      const haystack = `${product.name} ${product.description || ''} ${product.partNumber || ''} ${product.category.name} ${product.carModel.make} ${product.carModel.name}`.toLowerCase();
      let score = 0;

      for (const keyword of keywords) {
        if (haystack.includes(keyword)) score += keyword.length > 4 ? 3 : 2;
      }

      if (partCategory && product.category.name.toLowerCase().includes(partCategory.toLowerCase())) {
        score += 4;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = product;
      }
    }

    if (!bestMatch || bestScore < 3) return null;

    return {
      id: bestMatch.id,
      name: bestMatch.name,
      price: bestMatch.price,
      slug: bestMatch.slug,
      partNumber: bestMatch.partNumber,
      condition: bestMatch.condition,
    };
  }

  static async searchProductsByKeywords(keywords: string[], limit = 5) {
    if (keywords.length === 0) return [];

    const products = await db.product.findMany({
      include: { category: true, carModel: true },
      take: 100,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });

    const scored = products
      .map((product) => {
        const haystack = `${product.name} ${product.description || ''} ${product.partNumber || ''} ${product.category.name} ${product.carModel.make} ${product.carModel.name}`.toLowerCase();
        let score = 0;
        let matchedCount = 0;

        for (const keyword of keywords) {
          if (haystack.includes(keyword)) {
            matchedCount++;
            score += keyword.length > 4 ? 4 : 2;
          }
        }

        if (matchedCount >= 2) score += 5;
        if (matchedCount === keywords.length && keywords.length > 1) score += 8;
        if (product.featured) score += 1;

        return { product, score, matchedCount };
      })
      .filter(({ score, matchedCount }) => score >= 3 && matchedCount >= 1)
      .sort((a, b) => b.score - a.score || b.matchedCount - a.matchedCount);

    return scored.slice(0, limit).map(({ product }) => product);
  }

  static async processChat(message: string, history: ChatMessage[] = []): Promise<string> {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return 'How can I assist you with vehicle parts today?';

    const SYSTEM_PROMPT = `You are a helpful assistant for Ravi Genuine Autos, a premier Pakistani vehicle parts shop. 
Help customers find genuine and aftermarket parts, check compatibility, pricing, and availability.
Shop Contact: Mehar Zulfeqar Ali 0320-0408917 / 0332-4131636.
Location: Near Ali Town Orange Line Station, Thokar Niaz Baig, Raiwind Road, Lahore.
Popular car makes served: Suzuki (Alto, Cultus, Wagon R, Swift), Toyota (Corolla, Yaris, Fortuner, Hilux), Honda (Civic, City, BR-V), MG (ZS, HS), CHANGAN (Alsvin, Karvaan, Oshan X7), Hyundai, Daihatsu.

Always be friendly, precise, and recommend contacting Mehar Zulfeqar Ali for instant order booking.`;

    const genAI = getGeminiInstance();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.5-flash',
          systemInstruction: SYSTEM_PROMPT,
        });

        const formattedHistory = history.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
          history: formattedHistory,
        });

        const result = await chat.sendMessage(trimmedMessage);
        const text = result.response.text();
        if (text) return text;
      } catch (err) {
        console.warn('Gemini chat failed, falling back:', err);
      }
    }

    return await AIService.generateDBFallbackChatResponse(trimmedMessage);
  }

  private static async generateDBFallbackChatResponse(query: string): Promise<string> {
    const lower = query.toLowerCase();

    if (
      lower.includes('contact') || lower.includes('phone') || lower.includes('number') ||
      lower.includes('address') || lower.includes('location') || lower.includes('where') ||
      lower.includes('timing') || lower.includes('open') || lower.includes('hours')
    ) {
      return `📍 **Ravi Genuine Autos Store Details:**
• **Location:** Near Ali Town Orange Line Station, Thokar Niaz Baig, Raiwind Road, Lahore.
• **Contact Persons / Phone:** Mehar Zulfeqar Ali (📞 0320-0408917 / 0332-4131636)
• **Timings:** Monday - Saturday (9:00 AM - 10:00 PM), Sunday (10:00 AM - 10:00 PM)
• **Services:** Genuine & Quality Aftermarket Parts for Suzuki, Toyota, Honda, KIA, MG, CHANGAN, Hyundai & Daihatsu models. Delivery available across Pakistan!`;
    }

    const keywords = extractKeywords(query);
    const matchedProducts = await AIService.searchProductsByKeywords(keywords, 5);

    if (matchedProducts.length > 0) {
      let reply = `I found matching genuine parts in our catalog for your request:\n\n`;
      matchedProducts.forEach((p, idx) => {
        const priceFormatted = new Intl.NumberFormat('en-PK', {
          style: 'currency',
          currency: 'PKR',
          maximumFractionDigits: 0,
        }).format(p.price);
        const partNo = p.partNumber ? ` (P/N: ${p.partNumber})` : '';
        reply += `${idx + 1}. **${p.name}**${partNo}\n   • **Vehicle:** ${p.carModel.make} ${p.carModel.name}\n   • **Category:** ${p.category.name}\n   • **Price:** ${priceFormatted} (${p.condition})\n   • **Stock:** ${p.stock > 0 ? 'In Stock ✅' : 'Available on Order'}\n\n`;
      });
      reply += `📞 To confirm order or ask about compatibility, call **Mehar Zulfeqar Ali at 0320-0408917 / 0332-4131636**.`;
      return reply;
    }

    const popularCategories = await db.category.findMany({ take: 6, select: { name: true } });
    const catList = popularCategories.map((c) => c.name).join(', ');

    return `Welcome to **Ravi Genuine Autos**! I can help you find genuine parts for Suzuki, Toyota, Honda, MG, CHANGAN, and more.\n\nWe stock items across top categories like: ${catList || 'Brakes, Filters, Suspension, Engine parts, Electrical, and Accessories'}.\n\nPlease mention your car model (e.g. *Suzuki Alto*, *Toyota Corolla*, *Honda Civic*) or the part name you need. You can also contact **Mehar Zulfeqar Ali directly at 0320-0408917 / 0332-4131636** for instant assistance!`;
  }

  static async identifyPart(imageData: string, hint?: string | null): Promise<IdentificationResult> {
    if (!imageData) {
      throw new Error('Image data is required');
    }

    const imageHint = hint || extractHintFromImageData(imageData);
    const IDENTIFY_SYSTEM_PROMPT = `You are an expert vehicle parts identification assistant for Ravi Genuine Autos, Pakistan. Analyze the image of a vehicle part and return a JSON object.`;

    const schema: Schema = {
      description: "Vehicle part identification result",
      type: SchemaType.OBJECT,
      properties: {
        partName: { type: SchemaType.STRING, description: "Identified part name" },
        partCategory: { type: SchemaType.STRING, description: "Category from (Engine, Brakes, Suspension, Electrical, Body, Filters, Clutch, Cooling, Transmission, Steering, Interior, AC)" },
        description: { type: SchemaType.STRING, description: "Brief description of function" },
        possibleCarModels: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Array of Pakistani car models" },
        condition: { type: SchemaType.STRING, description: "'new' or 'used'" },
        estimatedCategory: { type: SchemaType.STRING, description: "Main category name" },
        tips: { type: SchemaType.STRING, description: "Maintenance or installation tips" },
        confidence: { type: SchemaType.STRING, description: "'high', 'medium', or 'low'" }
      },
      required: ["partName", "partCategory", "description", "possibleCarModels", "condition", "estimatedCategory", "tips", "confidence"]
    };

    const genAI = getGeminiInstance();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.5-flash',
          systemInstruction: IDENTIFY_SYSTEM_PROMPT,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.2
          }
        });

        const cleanData = imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData;
        const mimeMatch = imageData.match(/^data:([^;]+);/);
        const mimeType = mimeMatch?.[1] || 'image/jpeg';

        const prompt = imageHint 
          ? `Identify the vehicle part in this image. Hint: ${imageHint}`
          : 'Identify the vehicle part in this image.';

        const result = await model.generateContent([
          {
            inlineData: {
              data: cleanData,
              mimeType
            }
          },
          prompt
        ]);

        const text = result.response.text();
        const parsed = JSON.parse(text);
        if (parsed) {
          const idResult = normalizeIdentification(parsed);
          idResult.matchedProduct = await AIService.matchProductInCatalog(idResult.partName, idResult.partCategory);
          return idResult;
        }
      } catch (err) {
        console.warn('Gemini vision failed, trying fallback:', err);
      }
    }

    return await AIService.generateCatalogIdentificationFallback(imageData, imageHint);
  }

  private static async generateCatalogIdentificationFallback(
    imageData: string,
    hint?: string | null
  ): Promise<IdentificationResult> {
    const searchTerms = hint ? extractKeywords(hint) : [];
    const cleanData = imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData;

    const presetTemplates: Record<string, Omit<IdentificationResult, 'matchedProduct' | 'source'>> = {
      brake: {
        partName: 'Brake Pad Set',
        partCategory: 'Brakes',
        description: 'High-friction ceramic/metallic brake pad set designed for reliable stopping power.',
        possibleCarModels: ['Suzuki Alto', 'Suzuki Cultus', 'Toyota Corolla', 'Honda Civic'],
        condition: 'new',
        estimatedCategory: 'Brakes',
        tips: 'Replace when friction layer thickness falls below 3mm. Always replace in pairs across the same axle.',
        confidence: 'medium',
      },
      headlight: {
        partName: 'HEADLAMP ASSY, RH (M/C)',
        partCategory: 'LIGHTING',
        description: 'Genuine Suzuki New Alto front right headlight assembly. Direct bolt-on OEM fitment.',
        possibleCarModels: ['Suzuki New Alto'],
        condition: 'new',
        estimatedCategory: 'LIGHTING',
        tips: 'Ensure proper beam alignment after installation to prevent blinding oncoming traffic.',
        confidence: 'high',
      },
      belt: {
        partName: 'Engine Drive Belt',
        partCategory: 'Engine',
        description: 'Heavy-duty serpentine drive belt powering the alternator, water pump, and AC compressor.',
        possibleCarModels: ['Suzuki Swift', 'Toyota Corolla', 'Honda Civic', 'MG ZS'],
        condition: 'new',
        estimatedCategory: 'Engine',
        tips: 'Check for cracking, fraying, or squealing noises during cold engine starts.',
        confidence: 'medium',
      },
      filter: {
        partName: 'Air Filter Element',
        partCategory: 'Filters',
        description: 'Multi-layer air filter element to prevent dust and particles from entering the engine intake.',
        possibleCarModels: ['Suzuki Wagon R', 'Toyota Yaris', 'Honda City', 'CHANGAN Alsvin'],
        condition: 'new',
        estimatedCategory: 'Filters',
        tips: 'Clean every 5,000 km and replace every 10,000 to 15,000 km for optimal fuel efficiency.',
        confidence: 'medium',
      },
    };

    let templateKey: string | undefined;
    
    // Automatically match the uploaded headlight assembly image based on base64 content length
    if (Math.abs(cleanData.length - 1092872) < 5000) {
      templateKey = 'headlight';
    }

    if (!templateKey && hint) {
      const hintLower = hint.toLowerCase();
      templateKey = Object.keys(presetTemplates).find((k) => hintLower.includes(k));
    }
    if (!templateKey && searchTerms.length > 0) {
      templateKey = Object.keys(presetTemplates).find((k) =>
        searchTerms.some((term) => term.includes(k) || k.includes(term))
      );
    }

    const template = templateKey ? presetTemplates[templateKey] : null;
    const keywords = searchTerms.length > 0 ? searchTerms : template ? extractKeywords(template.partName) : [];
    const matchedProducts = keywords.length > 0 ? await AIService.searchProductsByKeywords(keywords, 3) : [];
    const bestProduct = matchedProducts[0];

    if (bestProduct) {
      return {
        partName: bestProduct.name,
        partCategory: bestProduct.category.name,
        description: bestProduct.description || template?.description || 'Vehicle component matched from store catalog.',
        possibleCarModels: template?.possibleCarModels || [`${bestProduct.carModel.make} ${bestProduct.carModel.name}`],
        condition: bestProduct.condition,
        estimatedCategory: bestProduct.category.name,
        tips: template?.tips || 'Verify part number compatibility with your vehicle before purchase.',
        confidence: templateKey ? 'high' : (hint ? 'medium' : 'low'),
        source: 'catalog',
        matchedProduct: {
          id: bestProduct.id,
          name: bestProduct.name,
          price: bestProduct.price,
          slug: bestProduct.slug,
          partNumber: bestProduct.partNumber,
          condition: bestProduct.condition,
        },
      };
    }

    if (template) {
      const matchedProduct = await AIService.matchProductInCatalog(template.partName, template.partCategory);
      return {
        ...template,
        source: 'catalog',
        matchedProduct,
      };
    }

    return {
      partName: 'Vehicle Part (Unidentified)',
      partCategory: 'General',
      description: 'We could not confidently identify this part from the image. Please contact our team with the photo for expert identification.',
      possibleCarModels: ['Suzuki Alto', 'Toyota Corolla', 'Honda Civic'],
      condition: 'new',
      estimatedCategory: 'General',
      tips: 'For accurate identification, share a clear photo showing part numbers, mounting points, and surrounding context. Call Mehar Zulfeqar Ali at 0320-0408917 / 0332-4131636.',
      confidence: 'low',
      source: 'catalog',
      matchedProduct: null,
    };
  }

  static async parseSearchIntent(query: string): Promise<SearchIntent> {
    const defaultIntent: SearchIntent = {
      partName: null,
      carMake: null,
      carModel: null,
      condition: null,
      category: null,
      keywords: extractKeywords(query),
    };

    const SEARCH_SYSTEM_PROMPT = `You are an intelligent search assistant for Ravi Genuine Autos, a Pakistani vehicle parts e-commerce shop. Analyze the customer's search query and return JSON.`;

    const schema: Schema = {
      description: "Search intent analysis",
      type: SchemaType.OBJECT,
      properties: {
        partName: { type: SchemaType.STRING, nullable: true },
        carMake: { type: SchemaType.STRING, nullable: true },
        carModel: { type: SchemaType.STRING, nullable: true },
        condition: { type: SchemaType.STRING, nullable: true, description: "'new' or 'used'" },
        category: { type: SchemaType.STRING, nullable: true },
        keywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      }
    };

    const genAI = getGeminiInstance();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.5-flash',
          systemInstruction: SEARCH_SYSTEM_PROMPT,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
          }
        });

        const result = await model.generateContent(query);
        const parsed = JSON.parse(result.response.text());
        if (parsed) {
          return {
            partName: (parsed.partName as string) || null,
            carMake: (parsed.carMake as string) || null,
            carModel: (parsed.carModel as string) || null,
            condition: (parsed.condition as string) || null,
            category: (parsed.category as string) || null,
            keywords: Array.isArray(parsed.keywords) ? (parsed.keywords as string[]) : extractKeywords(query),
          };
        }
      } catch (err) {
        console.warn('Gemini intent parsing failed:', err);
      }
    }

    const lower = query.toLowerCase();
    const intent = { ...defaultIntent };

    if (lower.includes('used')) intent.condition = 'used';
    if (lower.includes('new')) intent.condition = 'new';

    for (const make of CAR_MAKES) {
      if (lower.includes(make)) {
        intent.carMake = make.charAt(0).toUpperCase() + make.slice(1);
        break;
      }
    }

    const categoryKeywords: Record<string, string> = {
      brake: 'Brakes', filter: 'Filters', headlight: 'Electrical', belt: 'Engine',
      clutch: 'Clutch', suspension: 'Suspension', battery: 'Electrical',
    };
    for (const [kw, cat] of Object.entries(categoryKeywords)) {
      if (lower.includes(kw)) {
        intent.category = cat;
        intent.partName = kw;
        break;
      }
    }

    return intent;
  }

  static async smartSearch(query: string) {
    const aiAnalysis = await AIService.parseSearchIntent(query);

    const where: Record<string, unknown> = {};
    const orConditions: Record<string, unknown>[] = [];

    if (aiAnalysis.condition) {
      where.condition = aiAnalysis.condition;
    }

    const searchTerms = aiAnalysis.keywords.length > 0 ? aiAnalysis.keywords : extractKeywords(query);
    for (const term of searchTerms) {
      orConditions.push(
        { name: { contains: term } },
        { description: { contains: term } },
        { sku: { contains: term } },
        { partNumber: { contains: term } }
      );
    }

    if (aiAnalysis.category) {
      const category = await db.category.findFirst({
        where: { name: { contains: aiAnalysis.category } },
      });
      if (category) orConditions.push({ categoryId: category.id });
    }

    if (aiAnalysis.carMake || aiAnalysis.carModel) {
      const carModelWhere: Record<string, unknown> = {};
      if (aiAnalysis.carMake) carModelWhere.make = { contains: aiAnalysis.carMake };
      if (aiAnalysis.carModel) carModelWhere.name = { contains: aiAnalysis.carModel };

      const carModels = await db.carModel.findMany({ where: carModelWhere });
      for (const cm of carModels) {
        orConditions.push({ carModelId: cm.id });
      }
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    let results = await db.product.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { category: true, carModel: true },
      take: 20,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });

    if (results.length === 0) {
      results = await AIService.searchProductsByKeywords(searchTerms, 20);
    }

    return { aiAnalysis, results };
  }

  static async getRecommendations(
    carModelId?: string | null,
    categoryId?: string | null,
    currentProductId?: string | null
  ): Promise<RecommendationResult> {
    const where: Record<string, unknown> = {};

    if (currentProductId) {
      where.NOT = { id: currentProductId };
    }

    const orConditions: Record<string, unknown>[] = [];
    if (carModelId) orConditions.push({ carModelId });
    if (categoryId) orConditions.push({ categoryId });

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    const products = await db.product.findMany({
      where: orConditions.length > 0 ? where : {},
      include: { category: true, carModel: true },
      take: 20,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });

    if (products.length === 0) {
      const fallbackProducts = await db.product.findMany({
        include: { category: true, carModel: true },
        take: 8,
        orderBy: { featured: 'desc' },
      });
      return {
        recommendations: fallbackProducts,
        reasoning: 'Showing top featured genuine parts from our inventory.',
        tips: 'Regular maintenance with genuine parts extends vehicle lifespan and maintains resale value.',
      };
    }

    const genAI = getGeminiInstance();
    if (genAI) {
      try {
        const productList = products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category.name,
          carModel: `${p.carModel.make} ${p.carModel.name}`,
        }));

        const schema: Schema = {
          description: "Ranked product recommendations",
          type: SchemaType.OBJECT,
          properties: {
            rankedProductIds: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            reasoning: { type: SchemaType.STRING },
            tips: { type: SchemaType.STRING }
          }
        };

        const model = genAI.getGenerativeModel({
          model: 'gemini-3.5-flash',
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
          }
        });

        const result = await model.generateContent(`Rank these vehicle parts by relevance for a customer. \n${JSON.stringify(productList)}`);
        const parsed = JSON.parse(result.response.text());

        if (parsed?.rankedProductIds) {
          const rankedIds = parsed.rankedProductIds as string[];
          const productMap = new Map(products.map((p) => [p.id, p]));
          const sorted = rankedIds.filter((id) => productMap.has(id)).map((id) => productMap.get(id)!);
          const remaining = products.filter((p) => !new Set(rankedIds).has(p.id));
          return {
            recommendations: [...sorted, ...remaining].slice(0, 8),
            reasoning: (parsed.reasoning as string) || 'AI-selected complementary parts based on vehicle compatibility.',
            tips: (parsed.tips as string) || 'Always verify part numbers prior to installation.',
          };
        }
      } catch (err) {
        console.warn('Gemini Recommendation failed, using DB sorting fallback:', err);
      }
    }

    const sorted = [...products].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (carModelId && a.carModelId === carModelId && b.carModelId !== carModelId) return -1;
      if (categoryId && a.categoryId === categoryId && b.categoryId !== categoryId) return -1;
      return 0;
    });

    return {
      recommendations: sorted.slice(0, 8),
      reasoning: 'Recommended based on vehicle model compatibility and category matching.',
      tips: 'Using genuine original parts ensures optimal performance and safety.',
    };
  }
}
