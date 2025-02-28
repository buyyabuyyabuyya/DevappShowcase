import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { App } from "@/models/App";
import { User } from "@/models/User";
import connectDB from "@/lib/db";
import { AppDetailView } from "@/components/apps/app-detail-view";
import { notFound } from "next/navigation";

export default async function AppDetailPage({ params }: { params: { id: string } }) {
  await connectDB();
  const app = await App?.findById(params.id);
  
  if (!app) {
    notFound();
  }

  const session = await auth();
  const userId = session?.userId;
  const isOwner = userId === app.userId;

  // Get user's pro status
  let isProUser = false;
  if (userId) {
    const userProfile = await User.findOne({ clerkId: userId });
    isProUser = userProfile?.isPro ?? false;
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl">
        <AppDetailView 
          app={JSON.parse(JSON.stringify(app))} 
          isOwner={isOwner} 
          isProUser={isProUser}
        />
      </div>
    </DashboardShell>
  );
} 