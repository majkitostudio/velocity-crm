import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PLATFORM_DIRS = [
  "src/features/ai/services/shared",
  "src/features/ai/registry",
  "src/features/ai/flags",
  "src/features/ai/config",
  "src/features/ai/metrics",
  "src/features/ai/cache",
];

const CONTACTS_DIRS = ["src/features/contacts"];

const FORBIDDEN_IMPORT_PATTERNS = [
  /features\/contacts/,
  /\/app\//,
  /\/components\//,
  /@\/app\//,
  /@\/src\/features\/contacts/,
  /@\/components\//,
];

const FORBIDDEN_CONTACTS_AI_IMPORT_PATTERNS = [
  /features\/ai/,
  /@\/src\/features\/ai/,
];

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
      continue;
    }
    if (entry.endsWith(".tsx") && !entry.endsWith(".test.tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function assertNoForbiddenImports(
  filePath: string,
  patterns: RegExp[],
): void {
  const content = readFileSync(filePath, "utf8");
  const importLines = content
    .split("\n")
    .filter((line) => line.trim().startsWith("import "));

  for (const line of importLines) {
    for (const pattern of patterns) {
      assert.ok(
        !pattern.test(line),
        `Forbidden import in ${filePath}: ${line.trim()}`,
      );
    }
  }
}

async function main() {
  const root = join(import.meta.dirname, "..", "..");

  for (const relativeDir of PLATFORM_DIRS) {
    const absoluteDir = join(root, relativeDir);
    const files = collectTypeScriptFiles(absoluteDir);
    assert.ok(files.length > 0, `Expected platform files in ${relativeDir}`);

    for (const file of files) {
      assertNoForbiddenImports(file, FORBIDDEN_IMPORT_PATTERNS);
    }
  }

  for (const relativeDir of CONTACTS_DIRS) {
    const absoluteDir = join(root, relativeDir);
    const files = collectTypeScriptFiles(absoluteDir);
    assert.ok(files.length > 0, `Expected contacts files in ${relativeDir}`);

    for (const file of files) {
      assertNoForbiddenImports(file, FORBIDDEN_CONTACTS_AI_IMPORT_PATTERNS);
    }
  }

  console.log("ai-platform-no-contacts-dependency: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
