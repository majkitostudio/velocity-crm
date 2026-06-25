import type { AiServiceId } from "../registry/ai-service-id";
import { getAiServiceFeatureFlagKeys } from "../flags/ai-service-feature-flag-registry";

export type ContactAiWorkspacePanelId =
  | "summary"
  | "recommendation"
  | "call-preparation"
  | "email-draft"
  | "sms-draft"
  | "copilot";

export type ContactAiWorkspacePanelDefinition = {
  readonly id: ContactAiWorkspacePanelId;
  readonly serviceId: AiServiceId;
  readonly displayOrder: number;
};

export const CONTACT_AI_WORKSPACE_PANELS: readonly ContactAiWorkspacePanelDefinition[] =
  Object.freeze([
    { id: "summary", serviceId: "contact-summary", displayOrder: 1 },
    { id: "recommendation", serviceId: "recommendation", displayOrder: 2 },
    { id: "call-preparation", serviceId: "call-prep", displayOrder: 3 },
    { id: "email-draft", serviceId: "email-draft", displayOrder: 4 },
    { id: "sms-draft", serviceId: "sms-draft", displayOrder: 5 },
    { id: "copilot", serviceId: "copilot", displayOrder: 6 },
  ]);

export function listContactAiWorkspacePanels(): readonly ContactAiWorkspacePanelDefinition[] {
  return CONTACT_AI_WORKSPACE_PANELS;
}

export function getContactAiWorkspacePanel(
  panelId: ContactAiWorkspacePanelId,
): ContactAiWorkspacePanelDefinition {
  const panel = CONTACT_AI_WORKSPACE_PANELS.find((entry) => entry.id === panelId);
  if (!panel) {
    throw new Error(`Contact AI workspace panel not found: ${panelId}`);
  }
  return panel;
}

export function getContactAiWorkspacePanelFeatureFlags(
  panelId: ContactAiWorkspacePanelId,
) {
  const panel = getContactAiWorkspacePanel(panelId);
  return getAiServiceFeatureFlagKeys(panel.serviceId);
}
