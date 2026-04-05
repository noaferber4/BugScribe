import { useState, useCallback } from 'react';
import { BUILTIN_TEMPLATES } from '../constants/builtinTemplates';
import type { Template, CustomTemplatesStore, TemplateField } from '../types';

const STORAGE_KEY = 'bugscribe_custom_templates';

function loadCustomTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const store: CustomTemplatesStore = JSON.parse(raw);
    if (store.version !== 1) return [];
    return store.templates;
  } catch {
    return [];
  }
}

function saveCustomTemplates(templates: Template[]): void {
  const store: CustomTemplatesStore = { version: 1, templates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function useTemplates() {
  const [customTemplates, setCustomTemplates] = useState<Template[]>(loadCustomTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(BUILTIN_TEMPLATES[0].id);

  const allTemplates: Template[] = [
    ...BUILTIN_TEMPLATES,
    ...[...customTemplates].sort((a, b) =>
      (a.createdAt ?? '') < (b.createdAt ?? '') ? -1 : 1
    ),
  ];

  const selectedTemplate = allTemplates.find((t) => t.id === selectedTemplateId) ?? BUILTIN_TEMPLATES[0];

  const setSelectedTemplate = useCallback((id: string) => {
    setSelectedTemplateId(id);
  }, []);

  const addCustomTemplate = useCallback(
    (draft: { name: string; description: string; fields: TemplateField[] }) => {
      const newTemplate: Template = {
        id: `custom-${Date.now().toString(36)}`,
        name: draft.name,
        description: draft.description,
        source: 'custom',
        fields: draft.fields,
        createdAt: new Date().toISOString(),
      };
      setCustomTemplates((prev) => {
        const updated = [...prev, newTemplate];
        saveCustomTemplates(updated);
        return updated;
      });
      setSelectedTemplateId(newTemplate.id);
    },
    []
  );

  const updateCustomTemplate = useCallback(
    (id: string, draft: { name: string; description: string; fields: TemplateField[] }) => {
      setCustomTemplates((prev) => {
        const updated = prev.map((t) =>
          t.id === id
            ? { ...t, name: draft.name, description: draft.description, fields: draft.fields }
            : t
        );
        saveCustomTemplates(updated);
        return updated;
      });
    },
    []
  );

  const deleteCustomTemplate = useCallback((id: string) => {
    setCustomTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveCustomTemplates(updated);
      return updated;
    });
    setSelectedTemplateId((current) => {
      if (current === id) return BUILTIN_TEMPLATES[0].id;
      return current;
    });
  }, []);

  return {
    allTemplates,
    selectedTemplate,
    setSelectedTemplate,
    addCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate,
  };
}
