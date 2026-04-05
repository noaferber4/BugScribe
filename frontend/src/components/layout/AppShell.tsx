import type { ReactNode } from 'react';

export function AppShell({
  sidebar,
  main,
  rightPanel,
}: {
  sidebar: ReactNode;
  main: ReactNode;
  rightPanel: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="h-full">{sidebar}</div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden border-r border-gray-100">
        {main}
      </div>

      {/* Right panel */}
      <div className="w-[420px] shrink-0 bg-white h-full">
        {rightPanel}
      </div>
    </div>
  );
}
