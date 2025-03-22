/**
 * Simple example demonstrating how to use the Azure TypeScript LangChain.js library
 * to create a basic chat application.
 */

import * as dotenv from 'dotenv';
import { getAzureChatModel } from '../src/lib/azure/azure-openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

// Load environment variables
dotenv.config();

async function runSimpleChat() {
  try {
    // Get the Azure Chat model
    console.log('Initializing Azure OpenAI chat model...');
    const model = await getAzureChatModel();
    
    // Sample conversation using proper message objects
    const messages = [
      new SystemMessage('You are a helpful assistant.'),
      new HumanMessage('Hello, how are you?')
    ];
    
    console.log('\nUser: Hello, how are you?');
    
    // Generate a response with proper message objects
    console.log('\nGenerating response...');
    const response = await model.invoke(messages);
    
    console.log(`\nAssistant: ${response.content}`);
    
    // Continue the conversation
    const updatedMessages = [
      ...messages,
      response, // AIMessage is already returned by invoke
      new HumanMessage('What can you help me with today?')
    ];
    
    console.log('\nUser: What can you help me with today?');
    
    // Generate another response
    console.log('\nGenerating response...');
    const secondResponse = await model.invoke(updatedMessages);
    
    console.log(`\nAssistant: ${secondResponse.content}`);
  } catch (error) {
    console.error('Error running chat example:', error);
  }
}

// Run the example
runSimpleChat();
