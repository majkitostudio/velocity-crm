"use client";

import { useState } from "react";

import type { ActionResult } from "@/src/domain/action-result";

import {
  executeImportAction,
  parseImportAction,
  validateImportAction,
} from "../../actions";
import type { ContactFieldKey } from "../../lib/contact-fields";
import { isCompleteImportColumnMapping } from "../../lib/contact-fields";
import type { ImportPageView } from "../../types";
import type {
  ExecuteImportResult,
  ImportColumnMapping,
  ImportPreviewResult,
  ImportPreviewSections,
  ParseImportResult,
} from "../../server/import/import.types";
import { ImportConfirmStep } from "./import-confirm-step";
import { ImportMappingStep } from "./import-mapping-step";
import { ImportPreviewStep } from "./import-preview-step";
import { ImportResultStep } from "./import-result-step";
import { ImportUploadStep } from "./import-upload-step";

type ImportWizardProps = {
  view: ImportPageView;
};

type WizardStep = "upload" | "mapping" | "preview" | "confirm" | "result";

function emptyMapping(): ImportColumnMapping {
  return {};
}

export function ImportWizard({ view }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ImportColumnMapping>(emptyMapping());
  const [parseResult, setParseResult] = useState<ParseImportResult | null>(null);
  const [previewResult, setPreviewResult] = useState<
    (ImportPreviewResult & { sections: ImportPreviewSections }) | null
  >(null);
  const [executeResult, setExecuteResult] = useState<ExecuteImportResult | null>(null);
  const [assignedUserId, setAssignedUserId] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetWizard() {
    setStep("upload");
    setCsvText("");
    setFileName("");
    setHeaders([]);
    setMapping(emptyMapping());
    setParseResult(null);
    setPreviewResult(null);
    setExecuteResult(null);
    setAssignedUserId("");
    setConfirmChecked(false);
    setError(null);
  }

  async function handleUpload(file: File) {
    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const result: ActionResult<ParseImportResult> = await parseImportAction({
        content,
        fileName: file.name,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setCsvText(content);
      setFileName(file.name);
      setHeaders(result.data.headers);
      setParseResult(result.data);
      setMapping(result.data.suggestedMapping);
      setPreviewResult(null);
      setExecuteResult(null);
      setStep("mapping");
    } catch {
      setError("Soubor se nepodařilo zpracovat.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleValidateMapping() {
    if (!isCompleteImportColumnMapping(mapping)) {
      setError("Mapování jména a telefonu je povinné.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await validateImportAction({ content: csvText, mapping });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setPreviewResult(result.data);
      setStep("preview");
    } catch {
      setError("Validace importu selhala.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExecuteImport() {
    if (!confirmChecked) {
      setError("Potvrďte, že rozumíte chování importu.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await executeImportAction({
        content: csvText,
        mapping,
        assignedUserId: assignedUserId || undefined,
        fileName,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setExecuteResult(result.data);
      setStep("result");
    } catch {
      setError("Import se nepodařilo dokončit.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateMapping(key: ContactFieldKey, column: string) {
    setMapping((current) => ({
      ...current,
      [key]: column || undefined,
    }));
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="import-error"
        >
          {error}
        </p>
      ) : null}

      {step === "upload" ? (
        <ImportUploadStep isLoading={isLoading} onUpload={handleUpload} />
      ) : null}

      {step === "mapping" && parseResult ? (
        <ImportMappingStep
          fields={view.mappableFields}
          headers={headers}
          mapping={mapping}
          totalRows={parseResult.totalRows}
          isLoading={isLoading}
          onMappingChange={updateMapping}
          onBack={() => setStep("upload")}
          onContinue={handleValidateMapping}
        />
      ) : null}

      {step === "preview" && previewResult ? (
        <ImportPreviewStep
          preview={previewResult}
          isLoading={isLoading}
          onBack={() => setStep("mapping")}
          onContinue={() => setStep("confirm")}
        />
      ) : null}

      {step === "confirm" && previewResult ? (
        <ImportConfirmStep
          preview={previewResult}
          assignableOperators={view.assignableOperators}
          assignedUserId={assignedUserId}
          confirmChecked={confirmChecked}
          isLoading={isLoading}
          onAssignedUserIdChange={setAssignedUserId}
          onConfirmCheckedChange={setConfirmChecked}
          onBack={() => setStep("preview")}
          onExecute={handleExecuteImport}
        />
      ) : null}

      {step === "result" && executeResult ? (
        <ImportResultStep
          result={executeResult}
          returnTo={view.returnTo}
          onReset={resetWizard}
        />
      ) : null}
    </div>
  );
}
