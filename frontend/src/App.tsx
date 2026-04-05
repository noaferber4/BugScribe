import { useState, useCallback, useMemo } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Sidebar } from './components/layout/Sidebar';
import { InputArea } from './components/input/InputArea';
import { TemplateBuilder } from './components/input/TemplateBuilder';
import { ReportPanel } from './components/output/ReportPanel';
import { useTemplates } from './hooks/useTemplates';
import { useAnalyze } from './hooks/useAnalyze';
import type { InputMode, FormValues, Template } from './types';

export type AnalyzeBlockedReason = 'files-only' | 'no-changes' | null;

type TemplateView =
  | { mode: 'create' }
  | { mode: 'edit'; template: Template }
  | null;

export default function App() {
  const { allTemplates, selectedTemplate, setSelectedTemplate, addCustomTemplate, updateCustomTemplate, deleteCustomTemplate } =
    useTemplates();
  const { report, isLoading, error, analyze, updateReport } = useAnalyze();

  const [mode, setMode] = useState<InputMode>('structured');
  const [formValues, setFormValues] = useState<FormValues>({});
  const [freeText, setFreeText] = useState('');
  const [freeTextAttachments, setFreeTextAttachments] = useState('');
  const [lastAnalyzedKey, setLastAnalyzedKey] = useState<string | null>(null);
  const [templateView, setTemplateView] = useState<TemplateView>(null);

  const currentInputKey = useMemo(
    () => JSON.stringify({ templateId: selectedTemplate.id, mode, formValues, freeText, freeTextAttachments }),
    [selectedTemplate.id, mode, formValues, freeText, freeTextAttachments]
  );

  const inputChanged = lastAnalyzedKey === null || currentInputKey !== lastAnalyzedKey;

  const allRequiredFieldsFilled = useMemo(() => {
    if (mode !== 'structured') return true;
    return selectedTemplate.fields
      .filter((f) => f.required && f.type !== 'file')
      .every((f) => {
        const val = formValues[f.id];
        if (!val) return false;
        return typeof val === 'string' ? val.trim().length > 0 : val.length > 0;
      });
  }, [mode, selectedTemplate.fields, formValues]);

  const hasFreeTextInput = freeText.trim().length > 0;

  const analyzeBlockedReason: AnalyzeBlockedReason = useMemo(() => {
    if (mode === 'freetext') {
      if (!hasFreeTextInput) return 'files-only';
      if (report && !inputChanged) return 'no-changes';
    }
    if (mode === 'structured') {
      if (report && !inputChanged) return 'no-changes';
    }
    return null;
  }, [mode, hasFreeTextInput, report, inputChanged]);

  const canAnalyze = useMemo(() => {
    if (mode === 'structured') return allRequiredFieldsFilled && analyzeBlockedReason === null;
    return analyzeBlockedReason === null;
  }, [mode, allRequiredFieldsFilled, analyzeBlockedReason]);

  const handleSelectTemplate = useCallback(
    (id: string) => {
      setSelectedTemplate(id);
      setFormValues({});
      setFreeText('');
      setFreeTextAttachments('');
      setLastAnalyzedKey(null);
      setTemplateView(null);
    },
    [setSelectedTemplate]
  );

  const handleFormChange = useCallback((fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleModeChange = useCallback((m: InputMode) => {
    setMode(m);
    setFreeTextAttachments('');
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!canAnalyze) return;
    setLastAnalyzedKey(currentInputKey);

    const combinedFreeText = freeTextAttachments
      ? `${freeText}\n\n${freeTextAttachments}`.trim()
      : freeText;

    analyze({
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      fields: selectedTemplate.fields,
      formValues: mode === 'structured' ? formValues : undefined,
      freeText: mode === 'freetext' ? combinedFreeText : undefined,
      mode,
    });
  }, [canAnalyze, currentInputKey, analyze, selectedTemplate, mode, formValues, freeText, freeTextAttachments]);

  const missingFields = useMemo(() => {
    if (mode !== 'structured' || !report) return [];
    return selectedTemplate.fields
      .filter((f) => f.type !== 'file')
      .filter((f) => {
        const val = formValues[f.id];
        return !val || (typeof val === 'string' && !val.trim());
      })
      .map((f) => f.label);
  }, [mode, report, selectedTemplate.fields, formValues]);

  const handleTemplateSave = useCallback(
    (draft: { name: string; description: string; fields: import('./types').TemplateField[] }) => {
      if (templateView?.mode === 'edit') {
        updateCustomTemplate(templateView.template.id, draft);
      } else {
        addCustomTemplate(draft);
      }
      setTemplateView(null);
    },
    [templateView, addCustomTemplate, updateCustomTemplate]
  );

  const mainContent = templateView !== null ? (
    <TemplateBuilder
      editingTemplate={templateView.mode === 'edit' ? templateView.template : undefined}
      onSave={handleTemplateSave}
      onCancel={() => setTemplateView(null)}
    />
  ) : (
    <InputArea
      template={selectedTemplate}
      mode={mode}
      formValues={formValues}
      freeText={freeText}
      isLoading={isLoading}
      canAnalyze={canAnalyze}
      analyzeBlockedReason={analyzeBlockedReason}
      onModeChange={handleModeChange}
      onFormChange={handleFormChange}
      onFreeTextChange={setFreeText}
      onFreeTextAttachmentsChange={setFreeTextAttachments}
      onAnalyze={handleAnalyze}
    />
  );

  return (
    <AppShell
      sidebar={
        <Sidebar
          allTemplates={allTemplates}
          selectedTemplateId={selectedTemplate.id}
          onSelect={handleSelectTemplate}
          onUpdate={updateCustomTemplate}
          onDelete={deleteCustomTemplate}
          onCreateTemplate={() => setTemplateView({ mode: 'create' })}
          onEditTemplate={(t) => setTemplateView({ mode: 'edit', template: t })}
        />
      }
      main={mainContent}
      rightPanel={
        <ReportPanel
          report={report}
          isLoading={isLoading}
          error={error}
          onSave={updateReport}
          missingFields={missingFields}
        />
      }
    />
  );
}
