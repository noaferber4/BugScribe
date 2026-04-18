import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import type { Template, TemplateField, FieldType } from '../../types';

interface FieldDraft {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string; // comma-separated
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

const inputClass =
  'w-full px-3 py-2 text-sm bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 rounded-lg focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/15 transition-colors';

export function CreateTemplateModal({
  isOpen,
  onClose,
  onSave,
  editingTemplate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: { name: string; description: string; fields: TemplateField[] }) => void;
  editingTemplate?: Template;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldDrafts, setFieldDrafts] = useState<FieldDraft[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && editingTemplate) {
      setName(editingTemplate.name);
      setDescription(editingTemplate.description);
      setFieldDrafts(templateToFieldDrafts(editingTemplate.fields));
      setError('');
    } else if (isOpen && !editingTemplate) {
      setName('');
      setDescription('');
      setFieldDrafts([]);
      setError('');
    }
  }, [isOpen, editingTemplate]);

  function updateField(id: string, patch: Partial<FieldDraft>) {
    setFieldDrafts((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    setFieldDrafts((prev) => prev.filter((f) => f.id !== id));
  }

  function handleSave() {
    if (!name.trim()) { setError('Template name is required.'); return; }
    if (!description.trim()) { setError('Bug description is required.'); return; }
    const filledDrafts = fieldDrafts.filter((f) => f.label.trim());

    const fields: TemplateField[] = filledDrafts.map((f) => ({
      id: f.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      label: f.label.trim(),
      type: f.type,
      required: f.required,
      options:
        f.type === 'select' || f.type === 'multi-select'
          ? f.options.split(',').map((o) => o.trim()).filter(Boolean)
              .map((o) => ({ label: o, value: o.toLowerCase().replace(/\s+/g, '_') }))
          : undefined,
    }));

    onSave({ name: name.trim(), description: description.trim(), fields });
    onClose();
  }

  const isEditing = !!editingTemplate;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Template: ${editingTemplate!.name}` : 'Create Custom Template'}
    >
      <div className="space-y-5">
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
          <label className="block text-sm font-medium text-white/70 mb-1">Bug Description *</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="e.g., Describe the bug that occurred"
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
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                    className="px-2 py-1.5 text-sm bg-[#0a0f1e] border border-white/10 text-white/70 rounded focus:outline-none focus:border-cyan-500/60 transition-colors"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                    <option value="multi-select">Multi-select</option>
                    <option value="file">File Upload</option>
                  </select>
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

        <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
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
    </Modal>
  );
}
