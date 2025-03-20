import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { getAppById } from "@/lib/firestore/apps";
import { EditAppForm } from "@/components/apps/edit-app-form";
import { notFound, redirect } from "next/navigation";

export default async function EditAppPage({ params }: { params: { id: string } }) {
  const appResponse = await getAppById(params.id);
  
  if (!appResponse.success || !appResponse.app) {
    notFound();
  }

  const app = appResponse.app as any;
  const session = await auth();
  const userId = session?.userId;
  
  if (!userId || userId !== app.userId) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Edit Application</h1>
        <EditAppForm app={app} />
      </div>
    </DashboardShell>
  );
} 