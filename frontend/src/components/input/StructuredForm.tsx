import type { Template, FormValues } from '../../types';
import { Badge } from '../common/Badge';

const severityVariants: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

export function StructuredForm({
  template,
  formValues,
  onChange,
  onAnalyze,
  isLoading,
  canAnalyze,
}: {
  template: Template;
  formValues: FormValues;
  onChange: (fieldId: string, value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  canAnalyze: boolean;
}) {
  return (
    <div className="space-y-5">
      {template.fields.map((field) => {
        const value = (formValues[field.id] as string) ?? '';

        return (
          <div key={field.id}>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-sm font-medium text-gray-700">{field.label}</label>
              {field.required && (
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  Required
                </span>
              )}
              {field.id === 'severity' && value && severityVariants[value] && (
                <Badge variant={severityVariants[value]}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </Badge>
              )}
            </div>

            {field.type === 'text' && (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={field.id === 'steps_to_reproduce' || field.id === 'logs' || field.id === 'stack_trace' ? 5 : 3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors resize-y font-mono"
              />
            )}

            {field.type === 'select' && (
              <div className="relative">
                <select
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors appearance-none bg-white pr-8"
                >
                  <option value="">Select {field.label.toLowerCase()}...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}

            {field.type === 'file' && (
              <div>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".log"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length === 0) return;
                      const names = files.map((f) => f.name).join(', ');
                      // Store filenames as the field value for display in the prompt
                      onChange(field.id, names);

                      // For text-based files, read content and append
                      const textFile = files.find((f) =>
                        /\.(log|txt|json|xml|csv)$/i.test(f.name)
                      );
                      if (textFile) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const content = ev.target?.result as string;
                          onChange(field.id, `[File: ${names}]\n${content.slice(0, 4000)}`);
                        };
                        reader.readAsText(textFile);
                      }
                    }}
                  />
                  {value ? (
                    <div className="text-center px-3">
                      <svg className="h-5 w-5 text-indigo-500 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-gray-700 font-medium truncate max-w-[220px]">{value.startsWith('[File:') ? value.split('\n')[0] : value}</p>
                      <p className="text-xs text-indigo-500 mt-0.5">Click to change</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="h-6 w-6 text-gray-300 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-500">Click to upload a log file</p>
                      <p className="text-xs text-gray-400 mt-0.5">.log files only</p>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={onAnalyze}
        disabled={isLoading || !canAnalyze}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Analyze
          </>
        )}
      </button>
    </div>
  );
}
