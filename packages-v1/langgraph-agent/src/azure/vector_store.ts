import {
  AzureAISearchVectorStore,
  AzureAISearchQueryType,
} from "@langchain/community/vectorstores/azure_aisearch";
import type { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { getEmbeddingClient } from "./embeddings.js";
import { CREDENTIAL } from "../azure/azure-credential.js";
import { AzureAISearchConfig } from "@langchain/community/vectorstores/azure_aisearch";
import { waiter } from "./embeddings.js";

const endpoint = process.env.AZURE_AISEARCH_ENDPOINT;
const indexName = process.env.AZURE_AISEARCH_INDEX_NAME;

const adminKey = process.env.AZURE_AISEARCH_ADMIN_KEY;
const queryKey = process.env.AZURE_AISEARCH_QUERY_KEY;

export const QUERY_DOC_COUNT = 3;
const MAX_INSERT_RETRIES = 3;

const shared_admin = {
  endpoint,
  indexName,
};

export const VECTOR_STORE_ADMIN_KEY: AzureAISearchConfig = {
  ...shared_admin,
  key: adminKey,
};

export const VECTOR_STORE_ADMIN_PASSWORDLESS: AzureAISearchConfig = {
  ...shared_admin,
  credentials: CREDENTIAL,
};

export const VECTOR_STORE_ADMIN_CONFIG: AzureAISearchConfig =
  process.env.SET_PASSWORDLESS == "true"
    ? VECTOR_STORE_ADMIN_PASSWORDLESS
    : VECTOR_STORE_ADMIN_KEY;

const shared_query = {
  endpoint,
  indexName,
  search: {
    type: AzureAISearchQueryType.Similarity,
  },
};

// Key-based config
export const VECTOR_STORE_QUERY_KEY: AzureAISearchConfig = {
  key: queryKey,
  ...shared_query,
};

export const VECTOR_STORE_QUERY_PASSWORDLESS: AzureAISearchConfig = {
  credentials: CREDENTIAL,
  ...shared_query,
};

export const VECTOR_STORE_QUERY_CONFIG =
  process.env.SET_PASSWORDLESS == "true"
    ? VECTOR_STORE_QUERY_PASSWORDLESS
    : VECTOR_STORE_QUERY_KEY;

// <AI_SEARCH_QUERY_FUNCTIONS>    
export function getReadOnlyVectorStore(): AzureAISearchVectorStore {
  const embeddings = getEmbeddingClient();
  return new AzureAISearchVectorStore(embeddings, VECTOR_STORE_QUERY_CONFIG);
}

export async function getDocsFromVectorStore(
  query: string,
): Promise<Document[]> {
  const store = getReadOnlyVectorStore();

  // @ts-ignore
  //return store.similaritySearchWithScore(query, QUERY_DOC_COUNT);
  return store.similaritySearch(query, QUERY_DOC_COUNT);
}
// </AI_SEARCH_QUERY_FUNCTIONS>    

// <AI_SEARCH_LOAD_INDEX_FUNCTIONS>    
export async function loadDocsIntoAiSearchVector(
  embeddingsClient: EmbeddingsInterface,
  chunks: Document<Record<string, any>>[],
): Promise<AzureAISearchVectorStore> {
  let retries = 0;

  while (retries < MAX_INSERT_RETRIES) {
    try {
      const vectorStore = await AzureAISearchVectorStore.fromDocuments(
        chunks,
        embeddingsClient,
        VECTOR_STORE_ADMIN_CONFIG,
      );
      return vectorStore;
    } catch (error: any) {
      if (error.status === 429 && retries < MAX_INSERT_RETRIES - 1) {
        const waitTime =
          parseInt(error.headers.get("retry-after") || "10") * 1000;
        console.log(
          `Rate limited. Waiting ${waitTime}ms before retry ${retries + 1}...`,
        );
        await waiter(waitTime);
        retries++;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}
// </AI_SEARCH_LOAD_INDEX_FUNCTIONS>    
