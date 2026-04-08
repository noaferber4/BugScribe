import { useState, useCallback, useMemo } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Sidebar } from './components/layout/Sidebar';
import { InputArea } from './components/input/InputArea';
import { TemplateBuilder } from './components/input/TemplateBuilder';
import { ReportPanel } from './components/output/ReportPanel';
import { TemplateGrid } from './components/home/TemplateGrid';
import { SavedBugsView } from './components/home/SavedBugsView';
import { useTemplates } from './hooks/useTemplates';
import { useAnalyze } from './hooks/useAnalyze';
import { useReports } from './hooks/useReports';
import type { InputMode, FormValues, Template } from './types';

export type AnalyzeBlockedReason = 'files-only' | 'no-changes' | null;

type CenterView =
  | { type: 'home' }
  | { type: 'form' }
  | { type: 'saved-bugs' }
  | { type: 'template-builder'; mode: 'create' | 'edit'; template?: Template };

export default function App() {
  const { allTemplates, selectedTemplate, setSelectedTemplate, addCustomTemplate, updateCustomTemplate, deleteCustomTemplate } =
    useTemplates();
  const { report, isLoading, error, analyze, updateReport } = useAnalyze();
  const { savedReports, saveReport, deleteReport } = useReports();

  const [centerView, setCenterView] = useState<CenterView>({ type: 'home' });
  const [mode, setMode] = useState<InputMode>('structured');
  const [formValues, setFormValues] = useState<FormValues>({});
  const [freeText, setFreeText] = useState('');
  const [freeTextAttachments, setFreeTextAttachments] = useState('');
  const [lastAnalyzedKey, setLastAnalyzedKey] = useState<string | null>(null);


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
      setCenterView({ type: 'form' });
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

  const handleTemplateSave = useCallback(
    (draft: { name: string; description: string; fields: import('./types').TemplateField[] }) => {
      if (centerView.type === 'template-builder' && centerView.mode === 'edit' && centerView.template) {
        updateCustomTemplate(centerView.template.id, draft);
      } else {
        addCustomTemplate(draft);
      }
      setCenterView({ type: 'home' });
    },
    [centerView, addCustomTemplate, updateCustomTemplate]
  );

  const handleLoadReport = useCallback(
    (r: { content: string }) => {
      updateReport(r.content);
      setCenterView({ type: 'form' });
    },
    [updateReport]
  );

  // Derive the editing template for TemplateBuilder
  const editingTemplate =
    centerView.type === 'template-builder' && centerView.mode === 'edit'
      ? centerView.template
      : undefined;

  let mainContent: React.ReactNode;
  switch (centerView.type) {
    case 'home':
      mainContent = (
        <TemplateGrid
          allTemplates={allTemplates}
          onSelectTemplate={handleSelectTemplate}
          onEditTemplate={(t) => setCenterView({ type: 'template-builder', mode: 'edit', template: t })}
          onDeleteTemplate={deleteCustomTemplate}
          onCreateTemplate={() => setCenterView({ type: 'template-builder', mode: 'create' })}
          savedReports={savedReports}
          onLoadReport={handleLoadReport}
          onViewAllReports={() => setCenterView({ type: 'saved-bugs' })}
        />
      );
      break;
    case 'form':
      mainContent = (
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
      break;
    case 'saved-bugs':
      mainContent = (
        <SavedBugsView
          savedReports={savedReports}
          onLoadReport={handleLoadReport}
          onDeleteReport={deleteReport}
        />
      );
      break;
    case 'template-builder':
      mainContent = (
        <TemplateBuilder
          editingTemplate={editingTemplate}
          onSave={handleTemplateSave}
          onCancel={() => setCenterView({ type: 'home' })}
        />
      );
      break;
  }

  return (
    <AppShell
      sidebar={
        <Sidebar
          centerViewType={centerView.type}
          onNavHome={() => setCenterView({ type: 'home' })}
          onNavCreateTemplate={() => setCenterView({ type: 'template-builder', mode: 'create' })}
          onNavSavedBugs={() => setCenterView({ type: 'saved-bugs' })}
        />
      }
      main={mainContent}
      rightPanel={
        centerView.type === 'form' ? (
          <ReportPanel
            report={report}
            isLoading={isLoading}
            error={error}
            onSave={updateReport}
            onSaveReport={report ? async () => { await saveReport(report, selectedTemplate.name); } : undefined}
          />
        ) : undefined
      }
    />
  );
}
