'use server';

import { auth } from "@clerk/nextjs/server";
import { provideFeedback as firestoreProvideFeedback } from "@/lib/firestore/ratings";
import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase/firestore";

export async function provideFeedback({ 
  appId, 
  comment 
}: { 
  appId: string; 
  comment: string 
}) {
  const session = await auth();
  
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const userId = session.userId;
  
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  try {
    // Call Firestore function
    const result = await firestoreProvideFeedback({ appId, comment });
    
    if (result.success) {
      revalidatePath(`/apps/${appId}`);
    }
    
    // Return a serializable result with more accurate timestamp processing
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
        // Convert the Firestore timestamp to ISO string if it exists
        createdAt: result.feedbackEntry.createdAt && 
                  typeof result.feedbackEntry.createdAt.toDate === 'function' ? 
                  result.feedbackEntry.createdAt.toDate().toISOString() : 
                  new Date().toISOString()
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