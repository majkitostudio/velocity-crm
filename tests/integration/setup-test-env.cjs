/**
 * Integration test bootstrap: Fake LLM defaults for automated test runs.
 * Production/dev must configure LLM_* explicitly (see docs/AI_PRODUCTION_LLM.md).
 */
process.env.NODE_ENV ??= "test";

if (!process.env.LLM_SUMMARY_VENDOR) {
  process.env.LLM_SUMMARY_VENDOR = "fake";
  process.env.LLM_SUMMARY_MODEL = "fake-1";
}

if (!process.env.LLM_RECOMMENDATION_VENDOR) {
  process.env.LLM_RECOMMENDATION_VENDOR = "fake";
  process.env.LLM_RECOMMENDATION_MODEL = "fake-1";
}
