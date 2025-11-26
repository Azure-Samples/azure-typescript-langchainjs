import {
  AzureAISearchVectorStore,
  AzureAISearchConfig,
} from "@langchain/community/vectorstores/azure_aisearch";
import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { EMBEDDINGS_CONFIG } from "../azure/embeddings.js";
import { VECTOR_STORE_ADMIN_CONFIG } from "../azure/vector_store.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import path from "path";

const filePath = path.join(
  __dirname,
  "../../",
  "data/Contoso_Electronics_Company_Overview.md",
);

console.log(VECTOR_STORE_ADMIN_CONFIG);
console.log(EMBEDDINGS_CONFIG);

console.log("Loading document from:", filePath);

const loader = new TextLoader(filePath);

try {
  const rawDocuments = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 0,
  });
  const documents = await splitter.splitDocuments(rawDocuments);

  const azureEmbeddingClient = new AzureOpenAIEmbeddings({
    ...EMBEDDINGS_CONFIG,
  });

  const azureAiSearchConfig: AzureAISearchConfig = {
    ...VECTOR_STORE_ADMIN_CONFIG,
  };

  // Create Azure AI Search vector store
  const store = await AzureAISearchVectorStore.fromDocuments(
    documents,
    azureEmbeddingClient,
    azureAiSearchConfig,
  );

  console.log(store);
} catch (error) {
  console.error("Error loading documents or creating vector store:", error);
}
