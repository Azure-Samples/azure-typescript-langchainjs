import { loadPdfsFromDirectory } from "../azure/find_pdfs.js";
import { updateEnv } from "../utils/update_env.js";
import { getEmbeddingClient } from "../azure/embeddings.js";
import { fileURLToPath } from "url";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NORTHWIND_PDF_DIRECTORY = "../../data";

async function loadData(embeddings: EmbeddingsInterface): Promise<void> {
  let dataLoaded = process.env.NORTHWIND_PDF_LOADED;

  if (!dataLoaded || dataLoaded === "true") {
    const dirPath = path.join(__dirname, NORTHWIND_PDF_DIRECTORY);
    await loadPdfsFromDirectory(embeddings, dirPath);
    await updateEnv("NORTHWIND_PDF_LOADED", "true");
  }
}

try {
  const embeddings = getEmbeddingClient();
  await loadData(embeddings);
  console.log("Load vector store complete");
} catch (error) {
  console.error("An error occurred while loading the vector store:", error);
}
