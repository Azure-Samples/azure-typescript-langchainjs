import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { EMBEDDINGS_CONFIG } from "../config/embeddings.js";

export function getEmbeddingClient(): AzureOpenAIEmbeddings {
  return new AzureOpenAIEmbeddings({ ...EMBEDDINGS_CONFIG, maxRetries: 1 });
}
