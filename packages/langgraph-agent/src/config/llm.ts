const key = process.env.AZURE_OPENAI_COMPLETE_KEY;
const instance = process.env.AZURE_OPENAI_COMPLETE_INSTANCE;
const apiVersion =
  process.env.AZURE_OPENAI_COMPLETE_API_VERSION || "2024-10-21";
const model = process.env.AZURE_OPENAI_COMPLETE_MODEL || "gpt-4o";
const maxTokens = process.env.AZURE_OPENAI_COMPLETE_MAX_TOKENS;

export const LLM_CONFIG = {
  model,
  azureOpenAIApiKey: key,
  azureOpenAIApiInstanceName: instance,
  azureOpenAIApiDeploymentName: model,
  azureOpenAIApiVersion: apiVersion,
  maxTokens: maxTokens ? parseInt(maxTokens, 10) : 100,
  maxRetries: 1,
  timeout: 60000,
};
