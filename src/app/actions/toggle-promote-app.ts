'use server';

import { auth } from "@clerk/nextjs/server";
import { togglePromoteApp as firestoreTogglePromoteApp } from "@/lib/firestore/apps";
import { revalidatePath } from "next/cache";

export async function togglePromoteApp(appId: string) {
  const session = await auth();
  
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const userId = session.userId;

  try {
    // Call Firestore function - it only expects one argument
    const result = await firestoreTogglePromoteApp(appId);
    
    if (result.success) {
      revalidatePath(`/apps/${appId}`);
      revalidatePath('/dashboard');
    }
    
    // Return serializable result without the isPromoted property
    return { 
      success: result.success,
      error: result.error
    };
  } catch (error) {
    console.error("Error toggling promotion:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update promotion status" 
    };
  }
} 