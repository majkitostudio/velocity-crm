import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const UI_DIRS = [
  "src/features/ai/components",
  "src/features/ai/actions",
];

const UI_APP_FILES = ["app/(crm)/contacts/[contactId]/page.tsx"];

const FORBIDDEN_UI_IMPORT_PATTERNS = [
  /features\/ai\/llm\//,
  /features\/ai\/prompts\//,
  /features\/ai\/context\//,
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
  /getLlmGateway/,
  /registerLlmVendorAdapter/,
  /resolveLlmVendorAdapter/,
  /runAiServicePipeline/,
  /createContactSummaryPipelinePorts/,
  /getContactSummaryService/,
  /llm\/gateway\/llm-gateway(?!-middleware|-service)/,
];

const FORBIDDEN_GENERATE_EXECUTOR_IMPORT = /from ["'].*\/generate-contact-summary["']/;
const FORBIDDEN_RECOMMENDATION_EXECUTOR_IMPORT = /from ["'].*\/generate-recommendation["']/;
const FORBIDDEN_RECOMMENDATION_SERVICE_IMPORT = /features\/ai\/services\/recommendation\//;
const ACTION_DIR_SEGMENT = `${join("src", "features", "ai", "actions")}`.replaceAll("\\", "/");

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
    if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      if (!entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function assertNoForbiddenUiImports(filePath: string, root: string): void {
  const relativePath = relative(root, filePath).replaceAll("\\", "/");
  const content = readFileSync(filePath, "utf8");
  const importLines = content
    .split("\n")
    .filter((line) => line.trim().startsWith("import "));

  for (const line of importLines) {
    for (const pattern of FORBIDDEN_UI_IMPORT_PATTERNS) {
      assert.ok(
        !pattern.test(line),
        `Forbidden UI import in ${relativePath}: ${line.trim()}`,
      );
    }

    if (
      FORBIDDEN_GENERATE_EXECUTOR_IMPORT.test(line) &&
      !relativePath.startsWith(ACTION_DIR_SEGMENT)
    ) {
      assert.fail(
        `Only actions may import generateContactSummary executor; found in ${relativePath}: ${line.trim()}`,
      );
    }

    if (
      FORBIDDEN_RECOMMENDATION_EXECUTOR_IMPORT.test(line) &&
      !relativePath.startsWith(ACTION_DIR_SEGMENT)
    ) {
      assert.fail(
        `Only actions may import generateRecommendation executor; found in ${relativePath}: ${line.trim()}`,
      );
    }

    if (
      FORBIDDEN_RECOMMENDATION_SERVICE_IMPORT.test(line) &&
      !relativePath.startsWith(ACTION_DIR_SEGMENT)
    ) {
      assert.fail(
        `UI must not import recommendation service; found in ${relativePath}: ${line.trim()}`,
      );
    }
  }
}

async function main() {
  const root = join(import.meta.dirname, "..", "..");

  for (const relativeDir of UI_DIRS) {
    const absoluteDir = join(root, relativeDir);
    const files = collectTypeScriptFiles(absoluteDir);
    assert.ok(files.length > 0, `Expected UI files in ${relativeDir}`);

    for (const file of files) {
      assertNoForbiddenUiImports(file, root);
    }
  }

  for (const relativeFile of UI_APP_FILES) {
    const absoluteFile = join(root, relativeFile);
    assertNoForbiddenUiImports(absoluteFile, root);
  }

  console.log("ai-ui-no-llm-dependency: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
