import { loadPdfsFromDirectory } from "../azure/find_pdfs.js";
import { updateEnv } from "../utils/update_env.js";
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
  let dataLoaded = process.env.NORTHWIND_PDF_LOADED;

  if (!dataLoaded || dataLoaded === "false") {
    const dirPath = path.join(__dirname, NORTHWIND_PDF_DIRECTORY);
    await loadPdfsFromDirectory(embeddings, dirPath);
    await updateEnv("NORTHWIND_PDF_LOADED", "true");
  } else {
    console.log("Data already loaded, skipping...");
  }
}

try {
  const embeddingsClient = getEmbeddingClient();
  await loadData(embeddingsClient);
  console.log("Load vector store complete");
} catch (error) {
  console.error("An error occurred while loading the vector store:", error);
}
