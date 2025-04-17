import { AzureAISearchVectorStore } from "@langchain/community/vectorstores/azure_aisearch";
import { VECTOR_STORE_QUERY, DOC_COUNT } from "../config/vector_store_query.js";
import { getEmbeddingClient } from "./embeddings.js";

export function getReadOnlyVectorStore(): AzureAISearchVectorStore {
  const embeddings = getEmbeddingClient();
  return new AzureAISearchVectorStore(embeddings, VECTOR_STORE_QUERY);
}

export async function getDocsFromVectorStore(
  query: string,
): Promise<Document[]> {
  const store = getReadOnlyVectorStore();

  // @ts-ignore
  //return store.similaritySearchWithScore(query, DOC_COUNT);
  return store.similaritySearch(query, DOC_COUNT);
}
