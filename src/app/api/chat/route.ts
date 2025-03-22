import { NextRequest, NextResponse } from 'next/server';
import { getAzureChatModel } from '@/lib/azure/azure-openai';
import { z } from 'zod';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  temperature: z.number().min(0).max(2).optional().default(0.7),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const validatedBody = requestSchema.parse(body);
    
    // Get the Azure Chat model
    const model = await getAzureChatModel();
    
    // Convert the messages to LangChain message format
    const messages = validatedBody.messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
    
    // Call the Azure OpenAI API through LangChain.js
    const response = await model.invoke(messages);
    
    // Return the response
    return NextResponse.json({ message: response.content }, { status: 200 });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request format', details: error.format() }, { status: 400 });
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
