import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { toContactAiContext } from "../../src/features/ai/context/mappers/to-contact-ai-context";
import type { ContactContext } from "../../src/features/contacts/context/types/contact-context";

const GOLDEN_PATH = join(
  import.meta.dirname,
  "fixtures",
  "contact-ai-context-mapper-golden.json",
);

function buildGoldenContactContextFixture(): ContactContext {
  return {
    schemaVersion: 1,
    contactId: "contact-golden-1",
    companyId: "company-golden-1",
    contact: {
      id: "contact-golden-1",
      name: "Golden Contact",
      phone: "+420777123456",
      email: "golden@example.com",
      address: {
        street: "Main 1",
        city: "Prague",
        zipCode: "11000",
        country: "CZ",
      },
      status: "LEAD",
      source: "MANUAL",
      priority: "NORMAL",
      assignedUser: {
        id: "user-golden-1",
        name: "Operator Golden",
        email: "operator@example.com",
      },
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
      updatedAt: new Date("2024-02-01T12:30:00.000Z"),
    },
    snapshot: {
      workflow: {
        failCount: 1,
        failThreshold: 3,
        lastCall: {
          id: "call-golden-1",
          outcome: "CALL_LATER",
          operatorName: "Operator Golden",
          createdAt: new Date("2024-02-10T09:00:00.000Z"),
          note: "Call back tomorrow",
        },
      },
      callbacks: {
        open: [
          {
            id: "callback-golden-1",
            scheduledAt: new Date("2024-02-12T08:00:00.000Z"),
            status: "OPEN",
            note: "Follow up",
            assigneeName: "Operator Golden",
          },
        ],
        recentClosed: [],
      },
      orders: { recent: [] },
      notes: {
        recent: [
          {
            id: "note-golden-1",
            body: "Interested in premium plan",
            authorName: "Operator Golden",
            createdAt: new Date("2024-02-05T14:00:00.000Z"),
          },
        ],
      },
      products: {
        catalog: [],
        purchased: [],
        lastPurchased: null,
      },
    },
    history: { activities: [] },
    statistics: {
      totalCalls: 2,
      totalOrders: 0,
      totalOpenCallbacks: 1,
      totalNotes: 1,
      failCount: 1,
      successfulOrderCount: 0,
    },
  };
}

function assertMapperMatchesGoldenSnapshot() {
  const golden = JSON.parse(readFileSync(GOLDEN_PATH, "utf8"));
  const actual = toContactAiContext(buildGoldenContactContextFixture());

  assert.equal(JSON.stringify(actual), JSON.stringify(golden));
  assert.ok(Object.isFrozen(actual));
}

assertMapperMatchesGoldenSnapshot();
console.log("contact-ai-context-mapper-golden: ok");
