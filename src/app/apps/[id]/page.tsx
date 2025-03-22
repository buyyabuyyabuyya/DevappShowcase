import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { getAppById } from "@/lib/firestore/apps";
import { getUserByClerkId } from "@/lib/firestore/users";
import { getFeedback } from "@/lib/actions/ratings";
import { AppDetailView } from "@/components/apps/app-detail-view";
import { notFound } from "next/navigation";

export default async function AppDetailPage({ params }: { params: { id: string } }) {
  const appResponse = await getAppById(params.id);
  
  if (!appResponse.success || !appResponse.app) {
    notFound();
  }

  const app = appResponse.app as any; // Type assertion to handle different data structure
  
  // Fetch feedback data
  const feedbackResponse = await getFeedback(params.id);
  if (feedbackResponse.success) {
    app.feedback = feedbackResponse.feedback;
  } else {
    app.feedback = [];
  }
  
  const session = await auth();
  const userId = session?.userId;
  // Check ownership safely
  const isOwner = !!userId && userId === app.userId;

  // Get user's pro status
  let isProUser = false;
  if (userId) {
    const userResponse = await getUserByClerkId(userId);
    isProUser = userResponse.success ? userResponse.user?.isPro ?? false : false;
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl">
        <AppDetailView 
          app={app}
          isOwner={isOwner} 
          isProUser={isProUser}
        />
      </div>
    </DashboardShell>
  );
} 