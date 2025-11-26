import fs from "fs/promises";
import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, process.env.ENV_PATH || "../../", ".env");

export async function updateEnv(key: string, value: string): Promise<void> {
  let envConfig = "";
  try {
    envConfig = await fs.readFile(filePath, "utf8");
  } catch (err) {
    // File doesn't exist; continue with empty string.
  }

  const regex = new RegExp(`^${key}=.*$`, "m");
  const newLine = `${key}=${value}`;
  if (regex.test(envConfig)) {
    envConfig = envConfig.replace(regex, newLine);
  } else {
    envConfig += envConfig.length > 0 ? "\n" + newLine : newLine;
  }
  await fs.writeFile(filePath, envConfig, "utf8");
}
