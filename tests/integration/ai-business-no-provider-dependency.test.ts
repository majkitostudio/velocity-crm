import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const BUSINESS_DIRS = [
  "src/features/ai/services/contact-summary",
  "src/features/ai/services/recommendation",
];

const FORBIDDEN_PROVIDER_IMPORT_PATTERNS = [
  /llm\/adapters/,
  /fake-llm-vendor/,
  /fakeLlmVendor/,
  /FakeLlmVendor/,
  /openai-vendor/,
  /anthropic-vendor/,
  /ollama-vendor/,
  /azure-openai/,
  /createLlmGateway/,
  /defaultLlmGateway/,
  /registerLlmVendorAdapter/,
  /resolveLlmVendorAdapter/,
  /llm\/gateway\/llm-gateway(?!-middleware|-service)/,
];

const FORBIDDEN_GATEWAY_ENTRY = /getLlmGateway/;

function collectTypeScriptFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTypeScriptFiles(fullPath));
      continue;
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function assertNoForbiddenProviderImports(filePath: string): void {
  const content = readFileSync(filePath, "utf8");
  const importLines = content
    .split("\n")
    .filter((line) => line.trim().startsWith("import "));

  for (const line of importLines) {
    for (const pattern of FORBIDDEN_PROVIDER_IMPORT_PATTERNS) {
      assert.ok(
        !pattern.test(line),
        `Forbidden LLM provider import in ${filePath}: ${line.trim()}`,
      );
    }
  }
}

function assertBusinessLayerDiscipline(root: string, filePath: string): void {
  const relativePath = relative(root, filePath).replaceAll("\\", "/");
  const content = readFileSync(filePath, "utf8");
  const importLines = content
    .split("\n")
    .filter((line) => line.trim().startsWith("import "));

  for (const line of importLines) {
    assert.ok(
      !FORBIDDEN_GATEWAY_ENTRY.test(line),
      `${relativePath} must not import getLlmGateway(); gateway is wired in createAiPipelinePorts()`,
    );
  }
}

async function main() {
  const root = join(import.meta.dirname, "..", "..");

  for (const relativeDir of BUSINESS_DIRS) {
    const absoluteDir = join(root, relativeDir);
    const files = collectTypeScriptFiles(absoluteDir);
    assert.ok(files.length > 0, `Expected business service files in ${relativeDir}`);

    for (const file of files) {
      assertNoForbiddenProviderImports(file);
      assertBusinessLayerDiscipline(root, file);
    }
  }

  console.log("ai-business-no-provider-dependency: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
