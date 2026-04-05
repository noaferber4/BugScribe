import { BUILTIN_TEMPLATES } from '../../constants/builtinTemplates';
import type { Template, TemplateField } from '../../types';
import { TemplateItem } from '../sidebar/TemplateItem';

export function Sidebar({
  allTemplates,
  selectedTemplateId,
  onSelect,
  onUpdate,
  onDelete,
  onCreateTemplate,
  onEditTemplate,
}: {
  allTemplates: Template[];
  selectedTemplateId: string;
  onSelect: (id: string) => void;
  onUpdate: (id: string, draft: { name: string; description: string; fields: TemplateField[] }) => void;
  onDelete: (id: string) => void;
  onCreateTemplate: () => void;
  onEditTemplate: (t: Template) => void;
}) {
  const builtinIds = new Set(BUILTIN_TEMPLATES.map((t) => t.id));
  const customTemplates = allTemplates.filter((t) => !builtinIds.has(t.id));
  const builtinTemplates = allTemplates.filter((t) => builtinIds.has(t.id));

  return (
    <aside className="w-64 shrink-0 border-r border-gray-100 bg-white flex flex-col h-full">
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">
            🐛
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">BugScribe</p>
            <p className="text-xs text-gray-400 mt-0.5">AI Bug Report Writer</p>
          </div>
        </div>
      </div>

      <div className="px-3 pb-1 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2 mb-1">
          Templates
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {builtinTemplates.map((t) => (
          <TemplateItem
            key={t.id}
            template={t}
            isSelected={t.id === selectedTemplateId}
            onSelect={() => onSelect(t.id)}
          />
        ))}

        {customTemplates.length > 0 && (
          <>
            <div className="my-2 border-t border-gray-100" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2 mb-1 pt-1">
              My Templates
            </p>
            {customTemplates.map((t) => (
              <TemplateItem
                key={t.id}
                template={t}
                isSelected={t.id === selectedTemplateId}
                onSelect={() => onSelect(t.id)}
                onEdit={() => onEditTemplate(t)}
                onDelete={() => onDelete(t.id)}
              />
            ))}
          </>
        )}
      </nav>

      <div className="px-3 pb-4 pt-2 border-t border-gray-100">
        <button
          onClick={onCreateTemplate}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Template
        </button>
      </div>
    </aside>
  );
}
