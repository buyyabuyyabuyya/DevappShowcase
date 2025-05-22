"use server";

import { auth } from "@clerk/nextjs/server";
import { editFeedback, deleteFeedback } from "@/lib/firestore/ratings";

export async function editFeedbackAction(
  appId: string,
  feedbackId: string,
  text: string
) {
  try {
    const session = await auth();
  
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const userId = session.userId;
    
    if (!userId) {
      console.error("No user ID found in session");
      return { success: false, error: "Not authenticated" };
    }
    
    console.log(`User ${userId} attempting to edit feedback ${feedbackId}`);
    
    const result = await editFeedback({
      appId,
      feedbackId,
      userId,
      text,
    });
    
    return result;
  } catch (error) {
    console.error("Error in editFeedbackAction:", error);
    return { success: false, error: "Failed to edit feedback" };
  }
}

export async function deleteFeedbackAction(
  appId: string,
  feedbackId: string
) {
  try {
    const session = await auth();
  
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const userId = session.userId;
    
    if (!userId) {
      console.error("No user ID found in session");
      return { success: false, error: "Not authenticated" };
    }
    
    console.log(`User ${userId} attempting to delete feedback ${feedbackId}`);
    
    const result = await deleteFeedback({
      appId,
      feedbackId,
      userId,
    });
    
    return result;
  } catch (error) {
    console.error("Error in deleteFeedbackAction:", error);
    return { success: false, error: "Failed to delete feedback" };
  }
} 