import { useState, useRef, useEffect } from 'react';
import type { Template, FormValues } from '../../types';
import { Badge } from '../common/Badge';

const severityVariants: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

const inputClass =
  'w-full px-3 py-2 text-sm bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 rounded-lg focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/15 transition-colors';

function CustomSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm bg-white/[0.05] border rounded-lg transition-colors text-left ${
          open
            ? 'border-cyan-500/60 ring-1 ring-cyan-500/15'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        <span className={selectedLabel ? 'text-white' : 'text-white/40'}>
          {selectedLabel ?? placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-white/30 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#0d1424] border border-white/10 rounded-lg shadow-xl overflow-hidden">
          <div
            onClick={() => { onChange(''); setOpen(false); }}
            className="px-3 py-2 text-sm text-white/40 hover:bg-white/[0.06] hover:text-white/60 cursor-pointer transition-colors"
          >
            {placeholder}
          </div>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                value === opt.value
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {opt.label}
              {value === opt.value && (
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
              <label className="text-sm font-medium text-white/70">{field.label}</label>
              {field.required && (
                <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
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
                className={inputClass}
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={field.id === 'steps_to_reproduce' || field.id === 'logs' || field.id === 'stack_trace' ? 5 : 3}
                className={`${inputClass} resize-y font-mono`}
              />
            )}

            {field.type === 'select' && (
              <CustomSelect
                value={value}
                onChange={(v) => onChange(field.id, v)}
                placeholder={`Select ${field.label.toLowerCase()}...`}
                options={field.options ?? []}
              />
            )}

            {field.type === 'file' && (
              <div>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-cyan-500/30 hover:bg-white/[0.03] transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".log"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length === 0) return;
                      const names = files.map((f) => f.name).join(', ');
                      onChange(field.id, names);

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
                      <svg className="h-5 w-5 text-cyan-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-white/70 font-medium truncate max-w-[220px]">{value.startsWith('[File:') ? value.split('\n')[0] : value}</p>
                      <p className="text-xs text-cyan-400/70 mt-0.5">Click to change</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="h-6 w-6 text-white/20 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-white/40">Click to upload a log file</p>
                      <p className="text-xs text-white/20 mt-0.5">.log files only</p>
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
        className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/30 disabled:cursor-not-allowed text-[#05080f] disabled:text-[#05080f]/50 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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
