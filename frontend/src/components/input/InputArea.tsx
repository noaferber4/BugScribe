import type { Template, FormValues, InputMode } from '../../types';
import type { AnalyzeBlockedReason } from '../../App';
import { StructuredForm } from './StructuredForm';
import { FreeTextArea } from './FreeTextArea';

const TABS: { id: InputMode; label: string }[] = [
  { id: 'structured', label: 'Structured Form' },
  { id: 'freetext', label: 'Free Text' },
];

export function InputArea({
  template,
  mode,
  formValues,
  freeText,
  isLoading,
  canAnalyze,
  analyzeBlockedReason,
  onModeChange,
  onFormChange,
  onFreeTextChange,
  onFreeTextAttachmentsChange,
  onAnalyze,
}: {
  template: Template;
  mode: InputMode;
  formValues: FormValues;
  freeText: string;
  isLoading: boolean;
  canAnalyze: boolean;
  analyzeBlockedReason: AnalyzeBlockedReason;
  onModeChange: (m: InputMode) => void;
  onFormChange: (fieldId: string, value: string) => void;
  onFreeTextChange: (v: string) => void;
  onFreeTextAttachmentsChange: (extra: string) => void;
  onAnalyze: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-semibold text-white">{template.name}</h1>
            <p className="text-xs text-white/40 mt-0.5">{template.description}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === tab.id
                  ? 'bg-white/[0.08] text-white border border-white/10'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {mode === 'structured' && (
          <StructuredForm
            template={template}
            formValues={formValues}
            onChange={onFormChange}
            onAnalyze={onAnalyze}
            isLoading={isLoading}
            canAnalyze={canAnalyze}
          />
        )}

        {mode === 'freetext' && (
          <FreeTextArea
            value={freeText}
            onChange={onFreeTextChange}
            onAttachmentsChange={onFreeTextAttachmentsChange}
            onAnalyze={onAnalyze}
            isLoading={isLoading}
            canAnalyze={canAnalyze}
            analyzeBlockedReason={analyzeBlockedReason}
          />
        )}
      </div>
    </div>
  );
}
