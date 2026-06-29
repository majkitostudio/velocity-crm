import assert from "node:assert/strict";

import { normalizeContactDraft } from "../../src/features/contacts/server/import/contact-normalizer";
import {
  formatImportTagPreview,
  parseImportTagCell,
} from "../../src/features/contacts/lib/parse-import-tags";

function assertParseTags() {
  assert.deepEqual(parseImportTagCell(""), { ok: true, tagNames: [] });
  assert.deepEqual(parseImportTagCell("  "), { ok: true, tagNames: [] });

  assert.deepEqual(parseImportTagCell("VIP, Kampaň 2026"), {
    ok: true,
    tagNames: ["VIP", "Kampaň 2026"],
  });

  assert.deepEqual(parseImportTagCell("VIP; Kampaň 2026"), {
    ok: true,
    tagNames: ["VIP", "Kampaň 2026"],
  });

  assert.deepEqual(parseImportTagCell("VIP, vip, VIP"), {
    ok: true,
    tagNames: ["VIP"],
  });

  const tooMany = Array.from({ length: 11 }, (_, index) => `tag-${index}`).join(",");
  const tooManyResult = parseImportTagCell(tooMany);
  assert.equal(tooManyResult.ok, false);

  const invalid = parseImportTagCell("   ");
  assert.equal(invalid.ok, true);
  if (invalid.ok) {
    assert.deepEqual(invalid.tagNames, []);
  }

  assert.equal(formatImportTagPreview([]), "—");
  assert.equal(formatImportTagPreview(["VIP", "Kampaň"]), "VIP, Kampaň");
}

function assertNormalizerTags() {
  const valid = normalizeContactDraft({
    rowNumber: 1,
    name: "Test Lead",
    phone: "+420601123456",
    tags: "VIP; Import",
  });

  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.deepEqual(valid.draft.tagNames, ["VIP", "Import"]);
  }

  const invalid = normalizeContactDraft({
    rowNumber: 2,
    name: "Test Lead",
    phone: "+420601123457",
    tags: " ",
  });

  assert.equal(invalid.ok, true);
  if (invalid.ok) {
    assert.deepEqual(invalid.draft.tagNames, []);
  }
}

async function main() {
  assertParseTags();
  assertNormalizerTags();
  console.log("import-tags: ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
