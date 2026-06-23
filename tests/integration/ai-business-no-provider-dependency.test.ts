import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const BUSINESS_DIRS = ["src/features/ai/services/contact-summary"];

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

const ALLOWED_GATEWAY_ENTRY = /getLlmGateway/;
const GATEWAY_ENTRY_FILE = "create-contact-summary-pipeline-ports.ts";

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

function assertGatewayEntryPointDiscipline(root: string, filePath: string): void {
  const relativePath = relative(root, filePath).replaceAll("\\", "/");
  const fileName = relativePath.split("/").pop() ?? "";
  const content = readFileSync(filePath, "utf8");
  const importLines = content
    .split("\n")
    .filter((line) => line.trim().startsWith("import "));

  const importsGatewayEntry = importLines.some((line) => ALLOWED_GATEWAY_ENTRY.test(line));

  if (fileName === GATEWAY_ENTRY_FILE) {
    assert.ok(
      importsGatewayEntry,
      `${relativePath} must import getLlmGateway() as the sole LLM entry point`,
    );
    return;
  }

  assert.ok(
    !importsGatewayEntry,
    `${relativePath} must not import getLlmGateway(); use port factory wiring only`,
  );
}

async function main() {
  const root = join(import.meta.dirname, "..", "..");
  let gatewayEntryCount = 0;

  for (const relativeDir of BUSINESS_DIRS) {
    const absoluteDir = join(root, relativeDir);
    const files = collectTypeScriptFiles(absoluteDir);
    assert.ok(files.length > 0, `Expected business service files in ${relativeDir}`);

    for (const file of files) {
      assertNoForbiddenProviderImports(file);
      assertGatewayEntryPointDiscipline(root, file);

      const fileName = relative(root, file).replaceAll("\\", "/").split("/").pop() ?? "";
      if (fileName === GATEWAY_ENTRY_FILE) {
        gatewayEntryCount += 1;
      }
    }
  }

  assert.equal(
    gatewayEntryCount,
    1,
    "Exactly one business composition file must wire getLlmGateway()",
  );

  console.log("ai-business-no-provider-dependency: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
