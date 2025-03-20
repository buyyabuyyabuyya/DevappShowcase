"use server"

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from 'next/cache';
import { clerkClient } from "@clerk/nextjs";
import { rateApp as firestoreRateApp, provideFeedback as firestoreProvideFeedback, getAppFeedback } from '@/lib/firestore/ratings';

interface RatingInput {
  appId: string;
  type: 'idea' | 'product';
  rating: number;
}

export async function rateApp({ appId, type, rating }: RatingInput) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    // Convert to the format expected by Firestore implementation
    const result = await firestoreRateApp({
      appId,
      ideaRating: type === 'idea' ? rating : 0,
      productRating: type === 'product' ? rating : 0,
      provideFeedback: false
    });

    return result;
  } catch (error) {
    console.error("Error rating app:", error);
    return { success: false, error: 'Failed to update rating' };
  }
}

export async function provideFeedback({ 
  appId, 
  comment 
}: { 
  appId: string; 
  comment: string 
}) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

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