import { ChatOpenAI } from '@langchain/openai';

/**
 * Gets an instance of the Azure Chat model configured with environment variables.
 * 
 * @returns An instance of ChatOpenAI configured for Azure for generating chat completions.
 */
export async function getAzureChatModel(): Promise<ChatOpenAI> {
  // Get environment variables
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deploymentName = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2023-12-01-preview';

  // Validate environment variables
  if (!apiKey || !endpoint || !deploymentName) {
    throw new Error(
      'Missing required environment variables for Azure OpenAI. ' +
      'Please set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_API_DEPLOYMENT_NAME.'
    );
  }

  // Create and return the Azure OpenAI model
  return new ChatOpenAI({
    temperature: 0.7,
    modelName: deploymentName,
    azureOpenAIApiKey: apiKey,
    azureOpenAIApiVersion: apiVersion,
    azureOpenAIApiDeploymentName: deploymentName,
    azureOpenAIBasePath: endpoint
  });
}
