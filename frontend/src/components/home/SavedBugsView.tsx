import { X, FileText, Clock, ArrowRight } from 'lucide-react';
import type { SavedReport } from '../../hooks/useReports';

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SavedBugsView({
  savedReports,
  onLoadReport,
  onDeleteReport,
}: {
  savedReports: SavedReport[];
  onLoadReport: (r: SavedReport) => void;
  onDeleteReport: (id: string) => void;
}) {
  return (
    <div className="h-full overflow-y-auto bg-[#05080f]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-8 pb-12">
        {/* Header */}
        <div className="pt-12 pb-8">
          <p className="text-[11px] font-mono text-cyan-400/60 uppercase tracking-[0.2em] mb-3 animate-fade-up">
            Saved Reports
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 animate-fade-up" style={{ animationDelay: '60ms' }}>
            Your Bug Reports
          </h1>
          <p className="text-sm text-white/35 animate-fade-up" style={{ animationDelay: '120ms' }}>
            {savedReports.length === 0
              ? 'No reports saved yet. Generate one and save it.'
              : `${savedReports.length} report${savedReports.length === 1 ? '' : 's'} saved.`}
          </p>
        </div>

        {savedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up" style={{ animationDelay: '180ms' }}>
            <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-white/15" />
            </div>
            <p className="text-sm text-white/30 mb-1">Nothing here yet</p>
            <p className="text-xs text-white/20">Generate a report and click Save — it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedReports.map((r, i) => (
              <div
                key={r.id}
                onClick={() => onLoadReport(r)}
                className="group flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/[0.025] border border-white/[0.08] cursor-pointer hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-fade-up"
                style={{ animationDelay: `${180 + i * 45}ms` }}
              >
                {/* Icon */}
                <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-white/30 group-hover:text-white/50 transition-colors" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80 group-hover:text-white truncate transition-colors">
                    {r.title}
                  </p>
                  <p className="text-xs text-white/25 mt-0.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
                      {r.templateName}
                    </span>
                    <span className="text-white/15">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(r.createdAt)}
                    </span>
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-4 w-4 text-white/15 group-hover:text-white/40 transition-all duration-200 group-hover:translate-x-0.5 shrink-0" />

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteReport(r.id); }}
                  className="shrink-0 p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all duration-150"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
