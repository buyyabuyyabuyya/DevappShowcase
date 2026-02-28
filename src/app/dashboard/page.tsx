import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { AppList } from "@/components/dashboard/app-list";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.userId) {
    redirect("/sign-in");
  }
  
  const userId = session.userId;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Manage your applications and projects."
      >
        <AppList />
      </DashboardHeader>
    </DashboardShell>
  );
} 
