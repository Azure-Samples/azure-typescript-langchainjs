import fs from "fs/promises";
import path from "path";

export async function updateEnv(key: string, value: string): Promise<void> {
  const envPath = path.join(process.cwd(), ".env");
  let envConfig = "";
  try {
    envConfig = await fs.readFile(envPath, "utf8");
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
  await fs.writeFile(envPath, envConfig, "utf8");
}
