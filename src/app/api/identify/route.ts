import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';

interface IdentifyRequest {
  image: string;
  hint?: string;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function estimateBase64SizeBytes(dataUrl: string): number {
  const base64 = dataUrl.includes('base64,') ? dataUrl.split('base64,')[1] : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

export async function POST(request: NextRequest) {
  try {
    const body: IdentifyRequest = await request.json();
    const { image, hint } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    if (estimateBase64SizeBytes(image) > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'Image size must be less than 10MB' },
        { status: 400 }
      );
    }

    const identification = await AIService.identifyPart(image, hint);

    return NextResponse.json({ identification });
  } catch (error) {
    console.error('Error in image identification route:', error);
    return NextResponse.json(
      {
        identification: {
          partName: 'Unknown Vehicle Part',
          partCategory: null,
          description: 'Image analysis could not complete.',
          possibleCarModels: ['Suzuki Alto', 'Toyota Corolla', 'Honda Civic'],
          condition: null,
          estimatedCategory: null,
          tips: 'Please contact Mehar Zulfeqar Ali at 0320-0408917 / 0332-4131636 for expert part identification.',
          confidence: 'low',
        },
        error: 'Image identification service issue',
      },
      { status: 500 }
    );
  }
}
