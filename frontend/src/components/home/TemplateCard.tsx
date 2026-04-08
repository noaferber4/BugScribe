import { Pencil, Trash2, ArrowRight } from 'lucide-react';
import type { Template } from '../../types';

interface TemplateMeta {
  icon: string;
  hoverBorder: string;
  gradient: string;
  glowShadow: string;
  iconRing: string;
  badge?: { label: string; className: string };
}

const TEMPLATE_META: Record<string, TemplateMeta> = {
  'general-bug': {
    icon: '🐛',
    hoverBorder: 'hover:border-cyan-500/35',
    gradient: 'from-cyan-500/[0.07] via-transparent to-transparent',
    glowShadow: '0 12px 40px -8px rgba(6,182,212,0.18)',
    iconRing: 'bg-cyan-500/10 border-cyan-500/15',
    badge: { label: 'Popular', className: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
  },
  'ui-visual': {
    icon: '🖼️',
    hoverBorder: 'hover:border-violet-500/35',
    gradient: 'from-violet-500/[0.07] via-transparent to-transparent',
    glowShadow: '0 12px 40px -8px rgba(139,92,246,0.18)',
    iconRing: 'bg-violet-500/10 border-violet-500/15',
  },
  'crash-fatal': {
    icon: '💥',
    hoverBorder: 'hover:border-red-500/35',
    gradient: 'from-red-500/[0.07] via-transparent to-transparent',
    glowShadow: '0 12px 40px -8px rgba(239,68,68,0.18)',
    iconRing: 'bg-red-500/10 border-red-500/15',
    badge: { label: 'Essential', className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  },
  'performance': {
    icon: '⚡',
    hoverBorder: 'hover:border-amber-500/35',
    gradient: 'from-amber-500/[0.07] via-transparent to-transparent',
    glowShadow: '0 12px 40px -8px rgba(245,158,11,0.18)',
    iconRing: 'bg-amber-500/10 border-amber-500/15',
  },
  'api-backend': {
    icon: '🔌',
    hoverBorder: 'hover:border-emerald-500/35',
    gradient: 'from-emerald-500/[0.07] via-transparent to-transparent',
    glowShadow: '0 12px 40px -8px rgba(16,185,129,0.18)',
    iconRing: 'bg-emerald-500/10 border-emerald-500/15',
    badge: { label: 'Recommended', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  },
};

const CUSTOM_META: TemplateMeta = {
  icon: '📋',
  hoverBorder: 'hover:border-white/20',
  gradient: 'from-white/[0.04] via-transparent to-transparent',
  glowShadow: '0 12px 40px -8px rgba(255,255,255,0.06)',
  iconRing: 'bg-white/[0.06] border-white/10',
  badge: { label: 'Custom', className: 'bg-white/[0.07] text-white/40 border border-white/10' },
};

export function TemplateCard({
  template,
  onSelect,
  onEdit,
  onDelete,
  animationDelay = 0,
}: {
  template: Template;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  animationDelay?: number;
}) {
  const isCustom = template.source === 'custom';
  const meta = isCustom ? CUSTOM_META : (TEMPLATE_META[template.id] ?? CUSTOM_META);

  return (
    <div
      className={`group relative bg-white/[0.025] border border-white/[0.08] rounded-2xl p-6 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 ${meta.hoverBorder} hover:bg-white/[0.04] animate-fade-up`}
      style={{
        animationDelay: `${animationDelay}ms`,
        ['--hover-shadow' as string]: meta.glowShadow,
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = meta.glowShadow;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${meta.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      />

      {/* Top row: icon + badge + actions */}
      <div className="relative flex items-start justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl border flex items-center justify-center text-xl shrink-0 ${meta.iconRing}`}>
          {meta.icon}
        </div>

        <div className="flex items-center gap-1.5">
          {meta.badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide ${meta.badge.className}`}>
              {meta.badge.label}
            </span>
          )}
          {isCustom && (onEdit || onDelete) && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity duration-200">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <p className="text-[15px] font-semibold text-white mb-1.5 tracking-tight">{template.name}</p>
        <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{template.description}</p>
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06]">
        <span className="text-[11px] font-mono text-white/25">
          {template.fields.length} {template.fields.length === 1 ? 'field' : 'fields'}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-white/30 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 -translate-x-1">
          Use template
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
