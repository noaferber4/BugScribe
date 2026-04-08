import { useState } from 'react';
import type { Template } from '../../types';
import { Badge } from '../common/Badge';

export function TemplateItem({
  template,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
}: {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const icons: Record<string, string> = {
    'general-bug': '🐛',
    'ui-visual': '🖼',
    'crash-fatal': '💥',
    performance: '⚡',
    'api-backend': '🔌',
  };

  const icon = icons[template.id] ?? '📄';

  return (
    <button
      onClick={onSelect}
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
        isSelected
          ? 'bg-cyan-500/10 text-cyan-400'
          : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
      }`}
    >
      <span className="text-base leading-none shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{template.name}</span>
          {template.source === 'builtin' && (
            <Badge variant="gray">Built-in</Badge>
          )}
        </div>
      </div>

      {template.source === 'custom' && (
        <>
          {confirmingDelete ? (
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-red-400 font-medium mr-0.5">Delete?</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                className="px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmingDelete(false); }}
                className="px-1.5 py-0.5 text-xs font-medium bg-white/[0.06] text-white/60 rounded hover:bg-white/[0.10] transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all shrink-0">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1 text-white/30 hover:text-cyan-400 transition-colors"
                  title="Edit template"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
                  className="p-1 text-white/30 hover:text-red-400 transition-colors"
                  title="Delete template"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </button>
  );
}
