import "dotenv/config";

const endpoint = process.env.AZURE_AISEARCH_ENDPOINT;
const adminKey = process.env.AZURE_AISEARCH_ADMIN_KEY;
const indexName = process.env.AZURE_AISEARCH_INDEX_NAME;

export const VECTOR_STORE_ADMIN = {
  endpoint,
  key: adminKey,
  indexName,
};
