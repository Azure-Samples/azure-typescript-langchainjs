import "dotenv/config";
import {
  AzureAISearchConfig,
  AzureAISearchQueryType,
} from "@langchain/community/vectorstores/azure_aisearch";
const endpoint = process.env.AZURE_AISEARCH_ENDPOINT;
const queryKey = process.env.AZURE_AISEARCH_QUERY_KEY;
const indexName = process.env.AZURE_AISEARCH_INDEX_NAME;

export const DOC_COUNT = 3;

export const VECTOR_STORE_QUERY: AzureAISearchConfig = {
  endpoint,
  key: queryKey,
  indexName,
  search: {
    type: AzureAISearchQueryType.Similarity,
  },
};
