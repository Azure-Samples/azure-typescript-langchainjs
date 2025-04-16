const key = process.env.AZURE_OPENAI_EMBEDDING_KEY;
const instance = process.env.AZURE_OPENAI_EMBEDDING_INSTANCE;
const apiVersion =
  process.env.AZURE_OPENAI_EMBEDDING_API_VERSION || "2023-05-15";
const model =
  process.env.AZURE_OPENAI_EMBEDDING_MODEL || "text-embedding-ada-002";

export const EMBEDDINGS_CONFIG = {
  azureOpenAIApiKey: key,
  azureOpenAIApiInstanceName: instance,
  azureOpenAIApiEmbeddingsDeploymentName: model,
  azureOpenAIApiVersion: apiVersion,
  maxRetries: 1,
};
