import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
// import { SequentialChain } from 'langchain/chains';
import { getAzureChatModel } from '../azure/azure-openai';
import { ChatMessage } from '@/types/chat';

/**
 * Creates a LangChain chain for chat completions.
 * 
 * This function creates a simple chain that formats messages using a chat prompt template,
 * sends them to the Azure OpenAI model, and parses the response.
 * 
 * @returns A runnable sequence that processes chat messages and returns a response string.
 */
export async function createChatChain() {
  // Get the Azure Chat model
  const model = await getAzureChatModel();
  
  // Create a prompt template
  const prompt = new PromptTemplate({
    template: "You are a helpful AI assistant. {input}",
    inputVariables: ["input"],
  });
  
  // Create and return the chain
  const chain = new LLMChain({
    llm: model,
    prompt: prompt,
  });
  
  return chain;
}

/**
 * Formats a list of chat messages for input to LangChain.
 * 
 * @param messages The chat messages to format
 * @returns Formatted message string for LangChain's text models
 */
export function formatChatMessages(messages: ChatMessage[]) {
  return messages
    .map(message => `${message.role}: ${message.content}`)
    .join('\n');
}
