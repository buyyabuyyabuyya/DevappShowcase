import { DashboardShell } from "@/components/dashboard/shell";
import { getAppById } from "@/lib/firestore/apps";
import { getAppFeedback } from "@/lib/firestore/ratings";
import { AppDetailView } from "@/components/apps/app-detail-view";
import { notFound } from "next/navigation";

export const revalidate = 300;

export default async function AppDetailPage({ params }: { params: { id: string } }) {
  const appResponse = await getAppById(params.id);
  
  if (!appResponse.success || !appResponse.app) {
    notFound();
  }

  const app = appResponse.app as any; // Type assertion to handle different data structure
  
  // Fetch feedback data
  const feedbackResponse = await getAppFeedback(params.id);
  if (feedbackResponse.success && Array.isArray(feedbackResponse.feedback)) {
    // Make sure each feedback item's timestamp is valid
    app.feedback = feedbackResponse.feedback.map((item: any) => {
      // Safe timestamp handling
      let createdAt = item.createdAt;
      
      // If it's a Firestore timestamp, convert it
      if (typeof item.createdAt?.toDate === 'function') {
        createdAt = item.createdAt.toDate().toISOString();
      } 
      // Handle invalid timestamps by providing a fallback
      else if (item.createdAt && isNaN(new Date(item.createdAt).getTime())) {
        createdAt = new Date().toISOString();
      }
      
      return {
        ...item,
        createdAt
      };
    });
  } else {
    app.feedback = [];
  }
  
  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl">
        <AppDetailView 
          app={app}
        />
      </div>
    </DashboardShell>
  );
}
