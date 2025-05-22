'use server';

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { 
  rateApp as firestoreRateApp, 
  provideFeedback as firestoreProvideFeedback, 
  getAppFeedback as firestoreGetAppFeedback 
} from '@/lib/firestore/ratings';

interface RatingInput {
  appId: string;
  type: 'idea' | 'product';
  rating: number;
}

export async function rateApp({ appId, type, rating }: RatingInput) {
  try {
    const session = await auth();
    if (!session?.userId) throw new Error("Unauthorized");
    
    const userId = session.userId;

    // Convert to the format expected by Firestore implementation
    const result = await firestoreRateApp({
      appId,
      ideaRating: type === 'idea' ? rating : null,
      productRating: type === 'product' ? rating : null,
      provideFeedback: false
    });

    if (result.success) {
      revalidatePath(`/apps/${appId}`);
    }

    return result;
  } catch (error) {
    console.error("Error rating app:", error);
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
  if (!session?.userId) throw new Error("Unauthorized");
  
  const userId = session.userId;

  try {
    // Use Firestore implementation
    const result = await firestoreProvideFeedback({ appId, comment });
    
    if (result.success) {
      revalidatePath(`/apps/${appId}`);
    }
    
    return result;
  } catch (error) {
    console.error("Error providing feedback:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit feedback' 
    };
  }
}

export async function getFeedback(appId: string) {
  try {
    // Use Firestore implementation
    const result = await firestoreGetAppFeedback(appId);
    return result;
  } catch (error) {
    console.error("Error getting feedback:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get feedback' 
    };
  }
} 