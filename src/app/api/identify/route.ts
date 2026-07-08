import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface IdentifyRequest {
  image: string;
}

const IDENTIFY_SYSTEM_PROMPT = `You are an expert vehicle parts identification assistant for Ravi Genuine Autos, a Pakistani vehicle parts shop. Your job is to identify vehicle parts from images and provide detailed information.

When analyzing an image of a vehicle part, you must return a JSON object with these fields:
- partName: The name of the identified part (e.g., "Brake Pad Set", "Air Filter", "Alternator")
- partCategory: The category from: Engine, Brakes, Suspension, Electrical, Body, Filters, Clutch, Cooling, Transmission, Steering, Interior, Exhaust, Fuel System, AC
- description: A brief description of the part and its function
- possibleCarModels: An array of Pakistani car models this part might fit (e.g., ["Suzuki Alto", "Suzuki Cultus", "Toyota Corolla"])
- condition: Whether the part appears to be "new" or "used" based on the image
- estimatedCategory: The most likely broad category
- tips: Any helpful tips about this part (installation, maintenance, compatibility notes)
- confidence: Your confidence level as "high", "medium", or "low"

If the image does not appear to be a vehicle part, set confidence to "low" and provide your best guess.

IMPORTANT: Return ONLY the JSON object, no other text.

Example output:
{"partName":"Brake Pad Set","partCategory":"Brakes","description":"Disc brake pads that create friction against the brake rotor to slow or stop the vehicle","possibleCarModels":["Suzuki Alto","Suzuki Cultus","Toyota Corolla"],"condition":"new","estimatedCategory":"Brakes","tips":"Brake pads should be replaced when thickness is less than 3mm. Always replace pads in pairs for even braking.","confidence":"high"}`;

export async function POST(request: NextRequest) {
  try {
    const body: IdentifyRequest = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Initialize the AI SDK
    const zai = await ZAI.create();

    // Prepare the image data URL
    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/jpeg;base64,${image}`;

    // Use VLM (vision language model) to analyze the image
    const completion = await zai.chat.completions.createVision({
      model: 'Qwen/Qwen2.5-VL-72B-Instruct',
      messages: [
        {
          role: 'assistant',
          content: IDENTIFY_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: 'Please identify the vehicle part in this image and provide detailed information.',
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    let identification = {
      partName: 'Unknown',
      partCategory: null as string | null,
      description: 'Could not identify the part',
      possibleCarModels: [] as string[],
      condition: null as string | null,
      estimatedCategory: null as string | null,
      tips: 'Please contact Mehar Zulfeqar Ali at 0320-0408917 / 0332-4131636 for expert part identification.',
      confidence: 'low' as string,
    };

    try {
      const aiResponse = completion.choices?.[0]?.message?.content || '';
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        identification = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing AI identification response:', parseError);
      // Continue with default identification
    }

    return NextResponse.json({ identification });
  } catch (error) {
    console.error('Error in image identification:', error);
    return NextResponse.json(
      {
        identification: {
          partName: 'Unknown',
          partCategory: null,
          description: 'Image analysis failed',
          possibleCarModels: [],
          condition: null,
          estimatedCategory: null,
          tips: 'Please contact Mehar Zulfeqar Ali at 0320-0408917 / 0332-4131636 for expert part identification.',
          confidence: 'low',
        },
        error: 'Image identification service temporarily unavailable',
      },
      { status: 500 }
    );
  }
}
