import { ArrowRight, FileText, Clock, Sparkles } from 'lucide-react';
import type { Template } from '../../types';
import type { SavedReport } from '../../hooks/useReports';
import { TemplateCard } from './TemplateCard';
import { BUILTIN_TEMPLATES } from '../../constants/builtinTemplates';

const BUILTIN_IDS = new Set(BUILTIN_TEMPLATES.map((t) => t.id));

function CreateTemplateCard({
  onClick,
  animationDelay = 0,
}: {
  onClick: () => void;
  animationDelay?: number;
}) {
  return (
    <div
      className="group relative bg-white/[0.02] border border-dashed border-white/[0.1] rounded-2xl p-6 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-white/[0.04] animate-fade-up"
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px -8px rgba(6,182,212,0.14)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Icon */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-xl border border-dashed border-white/[0.12] group-hover:border-cyan-500/30 bg-white/[0.03] group-hover:bg-cyan-500/[0.08] flex items-center justify-center transition-all duration-300 shrink-0">
          <Sparkles className="h-4 w-4 text-white/25 group-hover:text-cyan-400 transition-colors duration-300" />
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <p className="text-[15px] font-semibold text-white/55 group-hover:text-white mb-1.5 tracking-tight transition-colors duration-200">
          Create Your Template
        </p>
        <p className="text-xs text-white/30 leading-relaxed line-clamp-2">
          Build a custom bug report structure tailored to your team's workflow and requirements.
        </p>
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06]">
        <span className="text-[11px] font-mono text-white/20 group-hover:text-white/30 transition-colors">
          Fully customizable
        </span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-cyan-400/80 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 -translate-x-1">
          Start building
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TemplateGrid({
  allTemplates,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateTemplate,
  savedReports = [],
  onLoadReport,
  onViewAllReports,
}: {
  allTemplates: Template[];
  onSelectTemplate: (id: string) => void;
  onEditTemplate: (t: Template) => void;
  onDeleteTemplate: (id: string) => void;
  onCreateTemplate: () => void;
  savedReports?: SavedReport[];
  onLoadReport?: (r: SavedReport) => void;
  onViewAllReports?: () => void;
}) {
  const builtinTemplates = allTemplates.filter((t) => BUILTIN_IDS.has(t.id));
  const customTemplates = allTemplates.filter((t) => !BUILTIN_IDS.has(t.id));
  const recentReports = savedReports.slice(0, 3);

  return (
    <div className="h-full overflow-y-auto bg-[#05080f]">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-8 pb-12">

        {/* ─── Hero ─── */}
        <div className="pt-12 pb-10">
          <p className="text-[11px] font-mono text-cyan-400/60 uppercase tracking-[0.2em] mb-3 animate-fade-up">
            AI Bug Report Generator
          </p>
          <h1
            className="text-4xl font-bold tracking-tight mb-3 animate-fade-up"
            style={{ animationDelay: '60ms' }}
          >
            <span className="text-white">What are we</span>{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #22d3ee 0%, #818cf8 60%, #a78bfa 100%)',
              }}
            >
              fixing today?
            </span>
          </h1>
          <p
            className="text-base text-white/40 max-w-lg leading-relaxed animate-fade-up"
            style={{ animationDelay: '120ms' }}
          >
            Turn rough notes into polished, structured bug reports in seconds.
            Pick a template or describe the issue in plain language.
          </p>
          <button
            onClick={() => onSelectTemplate(BUILTIN_TEMPLATES[0].id)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#05080f] text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(6,182,212,0.35)] animate-fade-up"
            style={{ animationDelay: '180ms' }}
          >
            Create Bug Report
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* ─── Recent Reports ─── */}
        {recentReports.length > 0 && (
          <section className="mb-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-white/30" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                  Recent
                </span>
              </div>
              {onViewAllReports && savedReports.length > 3 && (
                <button
                  onClick={onViewAllReports}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {recentReports.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => onLoadReport?.(r)}
                  className="group text-left flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.07] hover:bg-white/[0.05] hover:border-white/15 transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${220 + i * 50}ms` }}
                >
                  <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="h-3.5 w-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white/70 truncate group-hover:text-white transition-colors leading-snug">
                      {r.title}
                    </p>
                    <p className="text-[11px] text-white/25 mt-0.5 flex items-center gap-1.5">
                      <span>{r.templateName}</span>
                      <span className="w-px h-2.5 bg-white/10" />
                      <span>{formatDate(r.createdAt)}</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ─── Templates ─── */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">
              Templates
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {builtinTemplates.map((t, i) => (
              <TemplateCard
                key={t.id}
                template={t}
                onSelect={() => onSelectTemplate(t.id)}
                animationDelay={280 + i * 55}
              />
            ))}
            <CreateTemplateCard onClick={onCreateTemplate} animationDelay={390} />
          </div>
        </section>

        {/* ─── My Templates ─── */}
        {customTemplates.length > 0 && (
          <section className="mb-8 animate-fade-up" style={{ animationDelay: '480ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                My Templates
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {customTemplates.map((t, i) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onSelect={() => onSelectTemplate(t.id)}
                  onEdit={() => onEditTemplate(t)}
                  onDelete={() => onDeleteTemplate(t.id)}
                  animationDelay={500 + i * 55}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
