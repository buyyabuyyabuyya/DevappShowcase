"use server"

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from 'next/cache';
import { clerkClient } from "@clerk/nextjs/server";
import { rateApp as firestoreRateApp, provideFeedback as firestoreProvideFeedback, getAppFeedback } from '@/lib/firestore/ratings';

interface RatingInput {
  appId: string;
  type: 'idea' | 'product';
  rating: number;
}

export async function rateApp({ appId, type, rating }: RatingInput) {
  try {
    console.log("[RatingAction] Starting with appId:", appId, "type:", type, "rating:", rating);
    const session = await auth();
  
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const userId = session.userId;
    if (!session?.userId) if (!userId) throw new Error("Unauthorized");

    // Convert to the format expected by Firestore implementation
    const result = await firestoreRateApp({
      appId,
      ideaRating: type === 'idea' ? rating : null,
      productRating: type === 'product' ? rating : null,
      provideFeedback: false
    });

    console.log("[RatingAction] Firestore result:", result);
    
    if (result.success) {
      revalidatePath(`/apps/${appId}`);
    }

    return result;
  } catch (error) {
    console.error("[RatingAction] Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update rating' 
    };
  }
}

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
  if (!session?.userId) if (!userId) throw new Error("Unauthorized");

  try {
    // Use Firestore implementation
    const result = await firestoreProvideFeedback({ appId, comment });
    return result;
  } catch (error) {
    console.error("Error providing feedback:", error);
    return { success: false, error: 'Failed to submit feedback' };
  }
}

export async function getFeedback(appId: string) {
  try {
    // Use Firestore implementation
    const result = await getAppFeedback(appId);
    return result;
  } catch (error) {
    console.error("Error getting feedback:", error);
    return { success: false, error: 'Failed to get feedback' };
  }
} 