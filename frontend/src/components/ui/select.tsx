import { useState, useEffect, useRef } from 'react';

const chevron = (
  <svg
    className="h-4 w-4 text-white/30 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const check = (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

/**
 * Dark-themed custom select that replaces native <select> elements.
 *
 * Props:
 *   fullWidth  – when false the trigger button sizes to its content (use in inline rows)
 */
export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  fullWidth = true,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={[
          'flex items-center justify-between gap-2 px-3 py-2 text-sm',
          'bg-white/[0.06] border rounded-lg transition-colors text-left',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          open
            ? 'border-cyan-500/60 ring-1 ring-cyan-500/15'
            : 'border-white/10 hover:border-white/20',
          fullWidth ? 'w-full' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className={selectedLabel ? 'text-white/80 truncate' : 'text-white/30 truncate'}>
          {selectedLabel ?? placeholder ?? 'Select…'}
        </span>
        <span className={`transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}>
          {chevron}
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full min-w-[10rem] bg-[#0d1424] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {placeholder && (
              <div
                onClick={() => { onChange(''); setOpen(false); }}
                className="px-3 py-2 text-sm text-white/30 hover:bg-white/[0.06] cursor-pointer transition-colors"
              >
                {placeholder}
              </div>
            )}
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                  value === opt.value
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && check}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
