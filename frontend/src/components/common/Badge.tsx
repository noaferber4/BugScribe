import type { ReactNode } from 'react';

const variants = {
  indigo: 'bg-cyan-500/10 text-cyan-400',
  gray: 'bg-white/[0.07] text-white/40',
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  low: 'bg-green-500/15 text-green-400',
};

export function Badge({
  children,
  variant = 'gray',
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
