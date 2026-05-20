import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

const SYSTEM_PROMPT = `You are a helpful assistant for Ravi Genuine Autos, a Pakistani vehicle parts shop. Help customers find parts, answer questions about compatibility, pricing, and availability. Contact: M.Zulfiqar 0320-0408917. Be friendly and knowledgeable about Pakistani car models (Suzuki, Toyota, Honda, etc.)

Key information about our shop:
- We sell genuine and quality aftermarket parts for Pakistani cars
- Popular models we serve: Suzuki Alto, Suzuki Cultus, Suzuki Swift, Suzuki Wagon R, Toyota Corolla, Toyota Yaris, Honda Civic, Honda City, Honda BR-V, Daihatsu Cuore, Mitsubishi Lancer, etc.
- We offer both new and used/genuine parts
- Customers can contact us at M.Zulfiqar 0320-0408917 for orders and inquiries
- We are located in Pakistan and serve the local market
- Common part categories: Engine parts, Brake parts, Suspension, Electrical, Body parts, Filters, Clutch parts, Cooling system, Transmission, Steering parts

Always be helpful, specific, and suggest the customer contact the shop for precise pricing and availability. If unsure about a specific part, recommend they call the shop directly.`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Initialize the AI SDK
    const zai = await ZAI.create();

    // Build messages array with system prompt as assistant message
    const messages: ChatMessage[] = [
      { role: 'assistant', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message },
    ];

    const completion = await zai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3',
      messages,
      thinking: { type: 'disabled' },
    });

    const response =
      completion.choices?.[0]?.message?.content ||
      'I apologize, but I could not generate a response. Please try again or contact us at M.Zulfiqar 0320-0408917.';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      {
        response:
          'I apologize, but I am having trouble connecting right now. Please contact us directly at M.Zulfiqar 0320-0408917 for assistance.',
        error: 'Chat service temporarily unavailable',
      },
      { status: 500 }
    );
  }
}
