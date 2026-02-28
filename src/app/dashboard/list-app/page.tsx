import { ListAppForm } from "@/components/dashboard/list-app-form";
import { DashboardShell } from "@/components/dashboard/shell";

export const dynamic = 'force-dynamic';

export default function ListAppPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">List Your Application</h1>
        <ListAppForm />
      </div>
    </DashboardShell>
  );
} 
