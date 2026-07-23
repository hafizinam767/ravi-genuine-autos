import { NextRequest, NextResponse } from 'next/server';
import { AIService, ChatMessage } from '@/lib/ai-service';

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await AIService.processChat(message, history);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      {
        response:
          'I apologize, but I am having trouble processing your request right now. Please contact Mehar Zulfeqar Ali directly at 0320-0408917 / 0332-4131636 for assistance.',
        error: 'Chat service temporary error',
      },
      { status: 500 }
    );
  }
}
