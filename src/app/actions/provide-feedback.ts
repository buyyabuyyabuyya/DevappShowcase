'use server';

import { auth } from "@clerk/nextjs/server";
import { provideFeedback as firestoreProvideFeedback } from "@/lib/firestore/ratings";
import { revalidatePath } from "next/cache";

export async function provideFeedback({ 
  appId, 
  comment 
}: { 
  appId: string; 
  comment: string 
}) {
  const { userId } = auth();
  
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  try {
    // Call Firestore function
    const result = await firestoreProvideFeedback({ appId, comment });
    
    if (result.success) {
      revalidatePath(`/apps/${appId}`);
    }
    
    // Return a serializable result (without Firestore timestamps)
    return { 
      success: result.success,
      error: result.error || null,
      feedbackEntry: result.success && result.feedbackEntry ? {
        id: result.feedbackEntry.id,
        userId: result.feedbackEntry.userId || '',
        appId: result.feedbackEntry.appId || '',
        userName: result.feedbackEntry.userName || '',
        userImage: result.feedbackEntry.userImage || '',
        comment: result.feedbackEntry.comment || '',
        // Convert timestamp to string to make it serializable
        createdAt: new Date().toISOString()
      } : null
    };
  } catch (error) {
    console.error("Error providing feedback:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to submit feedback" 
    };
  }
} 