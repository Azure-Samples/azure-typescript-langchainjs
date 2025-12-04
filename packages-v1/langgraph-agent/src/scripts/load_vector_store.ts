import { loadPdfsFromDirectory } from "../azure/embeddings.js";
import { getEmbeddingClient } from "../azure/embeddings.js";
import { fileURLToPath } from "url";
import type { AzureOpenAIEmbeddings } from "@langchain/openai";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NORTHWIND_PDF_DIRECTORY = "../../data";

async function loadData(
  embeddingsClient: AzureOpenAIEmbeddings,
): Promise<void> {
  const indexCreated = process.env.INDEX_CREATED;
  const docCount = process.env.INDEX_DOCUMENT_COUNT;

  if (indexCreated !== "true") {
    console.log(
      `Loading data into vector store... (Current docs: ${docCount || 0})`,
    );
    const dirPath = path.join(__dirname, NORTHWIND_PDF_DIRECTORY);
    await loadPdfsFromDirectory(embeddingsClient, dirPath);
  } else {
    console.log(`Data already loaded. Index has ${docCount} documents.`);
  }
}

try {
  const embeddingsClient = getEmbeddingClient();
  await loadData(embeddingsClient);
  console.log("Load vector store complete");
} catch (error) {
  console.error("An error occurred while loading the vector store:", error);
}
