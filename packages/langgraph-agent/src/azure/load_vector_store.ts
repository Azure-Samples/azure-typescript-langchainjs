import { AzureAISearchVectorStore } from "@langchain/community/vectorstores/azure_aisearch";

import type { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VECTOR_STORE_ADMIN } from "../config/vector_store_admin.js";

export async function loadDocsIntoAiSearchVector(
  embeddings: EmbeddingsInterface,
  documents: Document[],
): Promise<AzureAISearchVectorStore> {
  const vectorStore = await AzureAISearchVectorStore.fromDocuments(
    documents,
    embeddings,
    VECTOR_STORE_ADMIN,
  );
  return vectorStore;
}
