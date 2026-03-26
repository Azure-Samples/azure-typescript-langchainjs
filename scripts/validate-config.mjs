#!/usr/bin/env node
/**
 * Validates that model names and API versions are consistent across:
 *   - sample.env (local dev config template)
 *   - infra/main.bicep (Azure deployment config)
 *   - Source code fallback defaults (packages-v1/.../azure/*.ts)
 *
 * Run: node scripts/validate-config.mjs
 * Exit code 0 = all consistent, 1 = mismatch detected
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Parsers ─────────────────────────────────────────────────────────

function parseSampleEnv(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function parseBicepParams(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const params = {};
  // Match: param <name> string = '<value>'
  const paramRegex = /^param\s+(\w+)\s+\w+\s*=\s*'([^']+)'/gm;
  let match;
  while ((match = paramRegex.exec(content)) !== null) {
    params[match[1]] = match[2];
  }
  return params;
}

function parseSourceFallbacks(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const fallbacks = {};
  // Match: process.env.SOME_VAR || "value"  or  process.env.SOME_VAR || 'value'
  const regex = /process\.env\.(\w+)\s*\|\|\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    fallbacks[match[1]] = match[2];
  }
  return fallbacks;
}

// ── Config map: what to check ───────────────────────────────────────
// Maps sample.env keys → Bicep param names → source fallback env var names
const CONFIG_CHECKS = [
  {
    label: "GPT model name",
    envKey: "AZURE_OPENAI_COMPLETE_MODEL",
    bicepParam: "gptModelName",
    sourceFiles: [
      "packages-v1/langgraph-agent/src/azure/llm.ts",
      "packages/langgraph-agent/src/config/llm.ts",
    ],
  },
  {
    label: "GPT API version",
    envKey: "AZURE_OPENAI_COMPLETE_API_VERSION",
    bicepParam: "gptApiVersion",
    sourceFiles: [
      "packages-v1/langgraph-agent/src/azure/llm.ts",
      "packages/langgraph-agent/src/config/llm.ts",
    ],
  },
  {
    label: "Embedding model name",
    envKey: "AZURE_OPENAI_EMBEDDING_MODEL",
    bicepParam: "embeddingModelName",
    sourceFiles: [],
  },
  {
    label: "Embedding API version",
    envKey: "AZURE_OPENAI_EMBEDDING_API_VERSION",
    bicepParam: "embeddingApiVersion",
    sourceFiles: [],
  },
];

// ── Main ────────────────────────────────────────────────────────────

let errors = 0;
let warnings = 0;

console.log("🔍 Validating config consistency...\n");

const envVars = parseSampleEnv(resolve(ROOT, "sample.env"));
const bicepParams = parseBicepParams(resolve(ROOT, "infra/main.bicep"));

// Cache parsed source files
const sourceCache = {};

for (const check of CONFIG_CHECKS) {
  const envValue = envVars[check.envKey];
  const bicepValue = bicepParams[check.bicepParam];

  console.log(`  ${check.label}:`);
  console.log(`    sample.env          → ${envValue ?? "(not set)"}`);
  console.log(`    infra/main.bicep    → ${bicepValue ?? "(not set)"}`);

  if (envValue && bicepValue && envValue !== bicepValue) {
    console.log(
      `    ❌ MISMATCH: sample.env="${envValue}" vs bicep="${bicepValue}"`,
    );
    errors++;
  } else if (envValue && bicepValue) {
    console.log(`    ✅ Consistent`);
  } else {
    console.log(`    ⚠️  One or both values not found`);
    warnings++;
  }

  // Check source fallbacks if applicable
  for (const sourceFile of check.sourceFiles ?? []) {
    const srcPath = resolve(ROOT, sourceFile);
    if (!sourceCache[srcPath]) {
      try {
        sourceCache[srcPath] = parseSourceFallbacks(srcPath);
      } catch {
        sourceCache[srcPath] = {};
        console.log(`    ⚠️  Could not read ${sourceFile}`);
        warnings++;
      }
    }
    const fallback = sourceCache[srcPath][check.envKey];
    if (fallback) {
      console.log(`    ${sourceFile} → ${fallback}`);
      if (bicepValue && fallback !== bicepValue) {
        console.log(
          `    ❌ Source fallback "${fallback}" in ${sourceFile} doesn't match bicep "${bicepValue}"`,
        );
        errors++;
      } else if (bicepValue) {
        console.log(`    ✅ Source fallback consistent`);
      }
    }
  }

  console.log();
}

// ── Summary ─────────────────────────────────────────────────────────
console.log("─".repeat(50));
if (errors > 0) {
  console.log(
    `\n❌ FAILED: ${errors} mismatch(es) found, ${warnings} warning(s)`,
  );
  console.log(
    "   Fix sample.env, infra/main.bicep, and source fallbacks to be consistent.\n",
  );
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\n⚠️  PASSED with ${warnings} warning(s)\n`);
} else {
  console.log("\n✅ All config values are consistent!\n");
}
