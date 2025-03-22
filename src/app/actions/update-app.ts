'use server';

import { auth } from "@clerk/nextjs/server";
import { updateApp as firestoreUpdateApp } from "@/lib/firestore/apps";
import { revalidatePath } from "next/cache";

export async function updateApp(appId: string, formData: FormData | Record<string, any>) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    
    let data: Record<string, any>;
    
    // Handle both FormData and regular objects
    if (formData instanceof FormData) {
      data = Object.fromEntries(formData.entries());
    } else {
      data = formData;
    }
    
    // Call Firestore function with userId explicitly
    const result = await firestoreUpdateApp(appId, data, userId);
    
    if (result.success) {
      // Only revalidate paths if the update was successful
      revalidatePath(`/apps/${appId}`);
      revalidatePath('/dashboard');
    }
    
    return { 
      success: result.success,
      error: result.error || null,
      app: result.app || null
    };
  } catch (error) {
    console.error("Server action error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An error occurred while updating the app",
      app: null
    };
  }
} 