import { useState, useCallback, useEffect } from 'react';
import { BUILTIN_TEMPLATES } from '../constants/builtinTemplates';
import type { Template, TemplateField } from '../types';
import { supabase } from '../lib/supabase';

export function useTemplates() {
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(BUILTIN_TEMPLATES[0].id);

  useEffect(() => {
    supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setCustomTemplates(
            data.map((row) => ({
              id: row.id,
              name: row.name,
              description: row.description,
              source: 'custom' as const,
              fields: row.fields,
              createdAt: row.created_at,
            }))
          );
        }
      });
  }, []);

  const allTemplates: Template[] = [...BUILTIN_TEMPLATES, ...customTemplates];

  const selectedTemplate =
    allTemplates.find((t) => t.id === selectedTemplateId) ?? BUILTIN_TEMPLATES[0];

  const setSelectedTemplate = useCallback((id: string) => {
    setSelectedTemplateId(id);
  }, []);

  const addCustomTemplate = useCallback(
    async (draft: { name: string; description: string; fields: TemplateField[] }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('templates')
        .insert({ user_id: session.user.id, name: draft.name, description: draft.description, fields: draft.fields })
        .select()
        .single();

      if (error || !data) return;

      const newTemplate: Template = {
        id: data.id,
        name: data.name,
        description: data.description,
        source: 'custom',
        fields: data.fields,
        createdAt: data.created_at,
      };
      setCustomTemplates((prev) => [...prev, newTemplate]);
      setSelectedTemplateId(newTemplate.id);
    },
    []
  );

  const updateCustomTemplate = useCallback(
    async (id: string, draft: { name: string; description: string; fields: TemplateField[] }) => {
      const { error } = await supabase
        .from('templates')
        .update({ name: draft.name, description: draft.description, fields: draft.fields })
        .eq('id', id);

      if (error) return;

      setCustomTemplates((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, name: draft.name, description: draft.description, fields: draft.fields }
            : t
        )
      );
    },
    []
  );

  const deleteCustomTemplate = useCallback(async (id: string) => {
    const { error } = await supabase.from('templates').delete().eq('id', id);

    if (error) return;

    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    setSelectedTemplateId((current) => (current === id ? BUILTIN_TEMPLATES[0].id : current));
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
