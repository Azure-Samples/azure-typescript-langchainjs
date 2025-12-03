import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { loadDocsIntoAiSearchVector } from "./vector_store.js";
import fs from "fs/promises";
import path from "path";
import { azureADTokenProvider_OpenAI } from "./azure-credential.js";
import { Document } from "@langchain/core/documents";

const key = process.env.AZURE_OPENAI_EMBEDDING_KEY!;
const instance = process.env.AZURE_OPENAI_EMBEDDING_INSTANCE!;
const apiVersion = process.env.AZURE_OPENAI_EMBEDDING_API_VERSION!;
const model = process.env.AZURE_OPENAI_EMBEDDING_MODEL!;
const basePath = process.env.AZURE_OPENAI_BASE_PATH!;

// <AZURE_OPENAI_EMBEDDINGS_UPLOAD_CONFIGURATION>
// Rate limit configuration
const REQUESTS_PER_MINUTE = 300;
const BATCH_SIZE = 10; // Number of chunks to embed per batch
const EMBEDDING_BATCH_SIZE = 5; // Chunks per API call
const DELAY_BETWEEN_BATCHES_MS =
  (60 * 1000) / (REQUESTS_PER_MINUTE / EMBEDDING_BATCH_SIZE); // ~1 second
// </AZURE_OPENAI_EMBEDDINGS_UPLOAD_CONFIGURATION>

const shared = {
  azureOpenAIApiInstanceName: instance,
  azureOpenAIApiEmbeddingsDeploymentName: model,
  azureOpenAIApiVersion: apiVersion,
  dimensions: 1536, // for text-embedding-3-small
  batchSize: EMBEDDING_BATCH_SIZE,
  maxRetries: 7,
  timeout: 60000,
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
// <AZURE_OPENAI_EMBEDDINGS_FUNCTION>
export function getEmbeddingClient(): AzureOpenAIEmbeddings {
  return new AzureOpenAIEmbeddings({ ...EMBEDDINGS_CONFIG });
}
// </AZURE_OPENAI_EMBEDDINGS_FUNCTION>

// <AZURE_OPENAI_EMBEDDINGS_LOADING_FUNCTIONS>
export async function loadPdfsFromDirectory(
  embeddingsClient: AzureOpenAIEmbeddings,
  dirPath: string,
): Promise<void> {
  try {
    const files = await fs.readdir(dirPath);
    const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"));

    console.log(`PDF: Found ${pdfFiles.length} PDF files in ${dirPath}`);

    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      const fullPath = path.join(dirPath, file);

      console.log(
        `\n=== Processing PDF ${i + 1}/${pdfFiles.length}: ${file} ===`,
      );

      const pdfLoader = new PDFLoader(fullPath);
      const langchainChunks = await pdfLoader.load();

      console.log(`Loaded ${langchainChunks.length} chunks from ${file}`);

      await loadDocumentsInBatches(embeddingsClient, langchainChunks);

      console.log(`Completed indexing ${file}`);

      // Wait between files
      if (i < pdfFiles.length - 1) {
        await waiter(2000); // 2 second pause between files
      }
    }

    console.log(`\n=== All PDFs processed successfully ===`);
  } catch (err) {
    console.error("Error loading PDFs:", err);
    throw err;
  }
}

async function loadDocumentsInBatches(
  embeddingsClient: AzureOpenAIEmbeddings,
  documents: Document<Record<string, any>>[],
): Promise<void> {
  const batches = chunkArray(documents, BATCH_SIZE);

  console.log(
    `Processing ${documents.length} chunks in ${batches.length} batches`,
  );
  console.log(
    `Estimated time: ${Math.ceil((batches.length * DELAY_BETWEEN_BATCHES_MS) / 1000)}s`,
  );

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `Processing batch ${i + 1}/${batches.length} (${batch.length} chunks)`,
    );

    try {
      await loadDocsIntoAiSearchVector(embeddingsClient, batch);
      console.log(`Batch ${i + 1} completed successfully`);

      // Wait between batches to respect rate limits (except for last batch)
      if (i < batches.length - 1) {
        await waiter(DELAY_BETWEEN_BATCHES_MS);
      }
    } catch (error: any) {
      if (error.status === 429) {
        const retryAfter =
          parseInt(error.headers?.get?.("retry-after") || "10") * 1000;
        console.warn(
          `Rate limited on batch ${i + 1}. Waiting ${retryAfter}ms...`,
        );
        await waiter(retryAfter);
        // Retry this batch
        i--;
      } else {
        throw error;
      }
    }
  }
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
// </AZURE_OPENAI_EMBEDDINGS_LOADING_FUNCTIONS>