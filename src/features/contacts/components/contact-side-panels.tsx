import { PanelShell } from "./panel-shell";

export function ContactAiPanelShell() {
  return (
    <PanelShell
      title="AI assistant"
      description="Customer summary and next-action suggestions will be implemented in Slice 10."
      sliceLabel="Slice 10"
    />
  );
}

export function ContactOrdersPanelShell() {
  return (
    <PanelShell
      title="Orders"
      description="Completed orders are shown in the activity timeline. Full order detail will be implemented in a future slice."
      sliceLabel="Future slice"
    />
  );
}

export function ContactCallbacksPanelShell() {
  return (
    <PanelShell
      title="Callbacks"
      description="Callback scheduling and management will be implemented in Slice 7."
      sliceLabel="Slice 7"
    />
  );
}
