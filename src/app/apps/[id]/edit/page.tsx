import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { App } from "@/models/App";
import connectDB from "@/lib/db";
import { EditAppForm } from "@/components/apps/edit-app-form";
import { notFound, redirect } from "next/navigation";

export default async function EditAppPage({ params }: { params: { id: string } }) {
  await connectDB();
  const app = await App?.findById(params.id);
  
  if (!app) {
    notFound();
  }

  const session = await auth();
  const userId = session?.userId;
  
  if (!userId || userId !== app.userId) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Edit Application</h1>
        <EditAppForm app={JSON.parse(JSON.stringify(app))} />
      </div>
    </DashboardShell>
  );
} 