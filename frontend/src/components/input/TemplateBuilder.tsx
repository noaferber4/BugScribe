import { useState, useEffect } from 'react';
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              {isEditing ? `Edit Template: ${editingTemplate!.name}` : 'Create Custom Template'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEditing ? 'Update the fields and save your changes.' : 'Define your own fields and save as a reusable template.'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
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
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              placeholder="e.g., Security Issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              placeholder="Short description of this template"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Fields</label>
              <button
                type="button"
                onClick={() => setFieldDrafts((prev) => [...prev, newFieldDraft()])}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add Field
              </button>
            </div>

            <div className="space-y-3">
              {fieldDrafts.map((field, i) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}.</span>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Field label"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-indigo-400"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                      className="px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-indigo-400"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="multi-select">Multi-select</option>
                      <option value="file">File Upload</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded"
                      />
                      Req.
                    </label>
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="text-gray-400 hover:text-red-500 shrink-0"
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
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-indigo-400"
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
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
