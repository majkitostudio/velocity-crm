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
      description="Order creation and history will be implemented in Slices 6–8."
      sliceLabel="Slice 6–8"
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
