import type { ReactNode } from "react";

interface AppShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

// Shell de la app: layout flex con sidebar a la izquierda y main scrollable.
export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-cream">
      {sidebar}
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
