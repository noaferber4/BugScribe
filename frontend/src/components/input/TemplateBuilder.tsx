import { useState, useEffect, useRef } from 'react';
import type { Template, TemplateField, FieldType } from '../../types';

interface FieldDraft {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string;
}

function newFieldDraft(): FieldDraft {
  return {
    id: Math.random().toString(36).slice(2),
    label: '',
    type: 'text',
    required: false,
    options: '',
  };
}

function templateToFieldDrafts(fields: TemplateField[]): FieldDraft[] {
  return fields.map((f) => ({
    id: Math.random().toString(36).slice(2),
    label: f.label,
    type: f.type,
    required: f.required,
    options: f.options ? f.options.map((o) => o.label).join(', ') : '',
  }));
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
  { value: 'multi-select', label: 'Multi-select' },
  { value: 'file', label: 'File Upload' },
];

const inputClass =
  'w-full px-3 py-2 text-sm bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 rounded-lg focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/15 transition-colors';

function TypeSelect({
  value,
  onChange,
}: {
  value: FieldType;
  onChange: (v: FieldType) => void;
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

  const label = FIELD_TYPES.find((t) => t.value === value)?.label ?? value;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 px-2 py-1.5 text-sm bg-white/[0.05] border rounded transition-colors text-white/70 whitespace-nowrap ${
          open ? 'border-cyan-500/60 ring-1 ring-cyan-500/15' : 'border-white/10 hover:border-white/20'
        }`}
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 right-0 mt-1 w-36 bg-[#0d1424] border border-white/10 rounded-lg shadow-xl overflow-hidden">
          {FIELD_TYPES.map((t) => (
            <div
              key={t.value}
              onClick={() => { onChange(t.value); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                value === t.value
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {t.label}
              {value === t.value && (
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export function TemplateBuilder({
  editingTemplate,
  onSave,
  onCancel,
}: {
  editingTemplate?: Template;
  onSave: (draft: { name: string; description: string; fields: TemplateField[] }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldDrafts, setFieldDrafts] = useState<FieldDraft[]>([newFieldDraft()]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setDescription(editingTemplate.description);
      setFieldDrafts(templateToFieldDrafts(editingTemplate.fields));
    } else {
      setName('');
      setDescription('');
      setFieldDrafts([newFieldDraft()]);
    }
    setError('');
  }, [editingTemplate]);

  function updateField(id: string, patch: Partial<FieldDraft>) {
    setFieldDrafts((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    setFieldDrafts((prev) => prev.filter((f) => f.id !== id));
  }

  function handleSave() {
    if (!name.trim()) { setError('Template name is required.'); return; }
    if (fieldDrafts.length === 0) { setError('Add at least one field.'); return; }
    if (fieldDrafts.some((f) => !f.label.trim())) { setError('All fields must have a label.'); return; }

    const usedIds = new Set<string>();
    const fields: TemplateField[] = fieldDrafts.map((f, i) => {
      let base = f.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (!base) base = `field_${i}`;
      let id = base;
      let suffix = 2;
      while (usedIds.has(id)) { id = `${base}_${suffix++}`; }
      usedIds.add(id);
      return {
        id,
        label: f.label.trim(),
        type: f.type,
        required: f.required,
        options:
          f.type === 'select' || f.type === 'multi-select'
            ? f.options.split(',').map((o) => o.trim()).filter(Boolean)
                .map((o) => ({ label: o, value: o.toLowerCase().replace(/\s+/g, '_') }))
            : undefined,
      };
    });

    onSave({ name: name.trim(), description: description.trim(), fields });
  }

  const isEditing = !!editingTemplate;

  return (
    <div className="flex flex-col h-full bg-[#05080f]">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-white">
              {isEditing ? `Edit Template: ${editingTemplate!.name}` : 'Create Custom Template'}
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              {isEditing ? 'Update the fields and save your changes.' : 'Define your own fields and save as a reusable template.'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
            title="Cancel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-xl space-y-5">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Template Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g., Security Issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="Short description of this template"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white/70">Fields</label>
              <button
                type="button"
                onClick={() => setFieldDrafts((prev) => [...prev, newFieldDraft()])}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                + Add Field
              </button>
            </div>

            <div className="space-y-3">
              {fieldDrafts.map((field, i) => (
                <div key={field.id} className="border border-white/10 rounded-lg p-3 bg-white/[0.02] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/25 w-5 shrink-0">{i + 1}.</span>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Field label"
                      className="flex-1 px-2 py-1.5 text-sm bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 rounded focus:outline-none focus:border-cyan-500/60 transition-colors"
                    />
                    <TypeSelect
                      value={field.type}
                      onChange={(type) => updateField(field.id, { type })}
                    />
                    <label className="flex items-center gap-1 text-xs text-white/40 shrink-0">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded accent-cyan-500"
                      />
                      Req.
                    </label>
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="text-white/25 hover:text-red-400 transition-colors shrink-0"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {(field.type === 'select' || field.type === 'multi-select') && (
                    <div className="pl-7">
                      <input
                        type="text"
                        value={field.options}
                        onChange={(e) => updateField(field.id, { options: e.target.value })}
                        placeholder="Options (comma-separated, e.g., Low, Medium, High)"
                        className="w-full px-2 py-1.5 text-xs bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 rounded focus:outline-none focus:border-cyan-500/60 transition-colors"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-white/50 hover:text-white font-medium border border-white/10 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-cyan-500 text-[#05080f] rounded-lg hover:bg-cyan-400 font-semibold transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
