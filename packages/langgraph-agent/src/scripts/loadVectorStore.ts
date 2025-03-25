import { loadPdfsFromDirectory } from "../azure/find_pdfs.js";
import { updateEnv } from "../utils/update_env.js";
import { getEmbeddingClient } from "../azure/embeddings.js";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NORTHWIND_PDF_DIRECTORY = "../data";

async function loadData(embeddings: any): Promise<void> {
  let dataLoaded = process.env.NORTHWIND_PDF_LOADED;
  console.log(dataLoaded);

  if (!dataLoaded || dataLoaded === "true") {
    const dirPath = path.join(__dirname, NORTHWIND_PDF_DIRECTORY);
    await loadPdfsFromDirectory(embeddings, dirPath);
    await updateEnv("NORTHWIND_PDF_LOADED", "true");
  }
}

export async function main() {
  const embeddings = getEmbeddingClient();
  await loadData(embeddings);
}

main()
  .then(() => {
    console.log("Load vector store complete");
  })
  .catch(console.error);
