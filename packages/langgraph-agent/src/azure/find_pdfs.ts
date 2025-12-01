import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { waiter } from "../utils/waiter.js";
import { loadDocsIntoAiSearchVector } from "./load_vector_store.js";
import fs from "fs/promises";
import path from "path";

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

        console.log(`PDF: Sending ${fullPath} to index`);
        const storeResult = await loadDocsIntoAiSearchVector(embeddings, docs);
        console.log(`PDF: Indexing result: ${JSON.stringify(storeResult)}`);

        await waiter(1000 * 60); // waits for 1 minute between files
      }
    }
  } catch (err) {
    console.error("Error loading PDFs:", err);
  }
}
