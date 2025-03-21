'use server';

import { auth } from "@clerk/nextjs/server";
import { deleteApp as firestoreDeleteApp } from "@/lib/firestore/apps";
import { revalidatePath } from "next/cache";

export async function deleteApp(appId: string) {
  const { userId } = auth();
  
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  try {
    // Call Firestore function with userId
    const result = await firestoreDeleteApp(appId, userId);
    
    if (result.success) {
      // Revalidate dashboard
      revalidatePath('/dashboard');
    }
    
    // Return serializable result
    return { 
      success: result.success,
      error: result.error || null
    };
  } catch (error) {
    console.error("Error deleting app:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete app" 
    };
  }
} 