'use server';

import { auth } from "@clerk/nextjs/server";
import { rateApp as firestoreRateApp } from "@/lib/firestore/ratings";
import { revalidatePath } from "next/cache";

export async function rateApp({
  appId,
  ideaRating,
  productRating,
  provideFeedback
}: {
  appId: string;
  ideaRating: number | null;
  productRating: number | null;
  provideFeedback: boolean;
}) {
  const { userId } = auth();
  
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  try {
    // Call Firestore function
    const result = await firestoreRateApp({
      appId,
      ideaRating,
      productRating,
      provideFeedback
    });
    
    if (result.success) {
      revalidatePath(`/apps/${appId}`);
    }
    
    return { 
      success: result.success,
      error: result.error || null
    };
  } catch (error) {
    console.error("Error rating app:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to submit rating" 
    };
  }
} 