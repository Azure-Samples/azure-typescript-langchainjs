/**
 * Advanced example demonstrating how to use LangChain.js with Azure OpenAI
 * to create more complex chains and flows.
 */

import * as dotenv from 'dotenv';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { SequentialChain } from 'langchain/chains';
import { getAzureChatModel } from '../src/lib/azure/azure-openai';

// Load environment variables
dotenv.config();

async function runAdvancedChainExample() {
  try {
    console.log('Initializing Azure OpenAI chat model...');
    const model = await getAzureChatModel();
    
    // Create a prompt template for summarization
    const summarizePrompt = new PromptTemplate({
      template: "You are an expert summarizer. Summarize the following text concisely: {text}",
      inputVariables: ["text"],
    });
    
    // Create a prompt template for topic extraction
    const topicPrompt = new PromptTemplate({
      template: "You are an expert at identifying key topics. Extract the main topics from the following text: {text}",
      inputVariables: ["text"],
    });
    
    // Create chains for summarization and topic extraction
    const summarizeChain = new LLMChain({
      llm: model,
      prompt: summarizePrompt,
      outputKey: "summary",
    });
    
    const topicChain = new LLMChain({
      llm: model,
      prompt: topicPrompt,
      outputKey: "topics",
    });
    
    // Sample text to analyze
    const sampleText = `
    Azure OpenAI Service provides REST API access to OpenAI's powerful language models including the GPT-4, 
    GPT-4 Turbo, GPT-3.5-Turbo, and Embeddings model series. These models can be easily adapted to your 
    specific task including but not limited to content generation, summarization, semantic search, and 
    natural language to code translation. Users can access the service through REST APIs, Python SDK, 
    or our web-based interface in the Azure OpenAI Studio.
    `;
    
    // Create a sequential chain
    const overallChain = new SequentialChain({
      chains: [summarizeChain, topicChain],
      inputVariables: ["text"],
      outputVariables: ["summary", "topics"],
      verbose: true,
    });
    
    // Run the chain
    console.log('Running the combined chain...');
    const result = await overallChain.call({ text: sampleText });
    
    // Print results
    console.log('\nOriginal Text:');
    console.log(sampleText);
    
    console.log('\nSummary:');
    console.log(result.summary);
    
    console.log('\nMain Topics:');
    console.log(result.topics);
  } catch (error) {
    console.error('Error running advanced chain example:', error);
  }
}

// Run the example
runAdvancedChainExample();
