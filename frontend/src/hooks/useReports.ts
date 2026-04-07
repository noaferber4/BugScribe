import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SavedReport {
  id: string;
  title: string;
  content: string;
  templateName: string;
  createdAt: string;
}

export function useReports() {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setSavedReports(
            data.map((row) => ({
              id: row.id,
              title: row.title,
              content: row.content,
              templateName: row.template_name,
              createdAt: row.created_at,
            }))
          );
        }
      });
  }, []);

  const saveReport = useCallback(async (content: string, templateName: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const title = content.split('\n').find((l) => l.trim().length > 0)?.replace(/^#+\s*/, '').trim() ?? 'Untitled Report';

    const { data, error } = await supabase
      .from('reports')
      .insert({ user_id: session.user.id, title, content, template_name: templateName })
      .select()
      .single();

    if (error || !data) return null;

    const saved: SavedReport = {
      id: data.id,
      title: data.title,
      content: data.content,
      templateName: data.template_name,
      createdAt: data.created_at,
    };
    setSavedReports((prev) => [saved, ...prev]);
    return saved;
  }, []);

  const deleteReport = useCallback(async (id: string) => {
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) return;
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { savedReports, saveReport, deleteReport };
}
