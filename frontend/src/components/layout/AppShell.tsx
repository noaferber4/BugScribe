import type { ReactNode } from 'react';

export function AppShell({
  sidebar,
  main,
  rightPanel,
}: {
  sidebar: ReactNode;
  main: ReactNode;
  rightPanel?: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#05080f] overflow-hidden">
      {/* Sidebar */}
      <div className="h-full shrink-0">{sidebar}</div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden min-w-0">
        {main}
      </div>

      {/* Right panel — only rendered when content is provided */}
      {rightPanel && (
        <div className="w-[420px] shrink-0 h-full border-l border-white/10">
          {rightPanel}
        </div>
      )}
    </div>
  );
}
