interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <div className="container grid gap-12 p-8">
          {children}
        </div>
      </main>
    </div>
  );
} 