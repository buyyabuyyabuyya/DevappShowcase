import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { AppList } from "@/components/dashboard/app-list";

export default async function DashboardPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

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