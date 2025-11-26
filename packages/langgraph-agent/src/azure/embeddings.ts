import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { loadDocsIntoAiSearchVector } from "./vector_store.js";
import fs from "fs/promises";
import path from "path";
import { azureADTokenProvider_OpenAI } from "./azure-credential.js";

const key = process.env.AZURE_OPENAI_EMBEDDING_KEY!;
const instance = process.env.AZURE_OPENAI_EMBEDDING_INSTANCE!;
const apiVersion = process.env.AZURE_OPENAI_EMBEDDING_API_VERSION!;
const model = process.env.AZURE_OPENAI_EMBEDDING_MODEL!;
const basePath = process.env.AZURE_OPENAI_BASE_PATH!;

const shared = {
  azureOpenAIApiInstanceName: instance,
  azureOpenAIApiEmbeddingsDeploymentName: model,
  azureOpenAIApiVersion: apiVersion,
  dimensions: 1536, // for text-embedding-3-small
  batchSize: 3,
  maxRetries: 5,
  timeout: 60000,
  requestTimeoutMs: 60000,
};

export const EMBEDDINGS_KEY_CONFIG = {
  azureOpenAIApiKey: key,
  ...shared,
};

export const EMBEDDINGS_CONFIG_PASSWORDLESS = {
  azureOpenAIBasePath: basePath,
  azureADTokenProvider: azureADTokenProvider_OpenAI,
  ...shared,
};

export const EMBEDDINGS_CONFIG =
  process.env.SET_PASSWORDLESS == "true"
    ? EMBEDDINGS_CONFIG_PASSWORDLESS
    : EMBEDDINGS_KEY_CONFIG;

export async function waiter(ms: number): Promise<void> {
  // waiting for ms milliseconds
  console.log(`Waiting for ${ms} milliseconds`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getEmbeddingClient(): AzureOpenAIEmbeddings {
  return new AzureOpenAIEmbeddings({ ...EMBEDDINGS_CONFIG });
}

export async function loadPdfsFromDirectory(
  embeddings: any,
  dirPath: string,
): Promise<void> {
  try {
    const files = await fs.readdir(dirPath);
    console.log(
      `PDF: Loading directory ${dirPath}, ${files.length} files found`,
    );
    for (const file of files) {
      if (file.toLowerCase().endsWith(".pdf")) {
        const fullPath = path.join(dirPath, file);
        console.log(`PDF: Found ${fullPath}`);

        const pdfLoader = new PDFLoader(fullPath);
        console.log(`PDF: Loading ${fullPath}`);
        const docs = await pdfLoader.load();

        console.log(
          `PDF: Sending ${fullPath} to index with ${docs.length} docs`,
        );
        const storeResult = await loadDocsIntoAiSearchVector(embeddings, docs);
        console.log(`PDF: Indexing result: ${JSON.stringify(storeResult)}`);

        await waiter(1000 * 60); // waits for 1 minute between files
      }
    }
  } catch (err) {
    console.error("Error loading PDFs:", err);
  }
}
