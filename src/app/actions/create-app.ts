'use server';

import { auth } from "@clerk/nextjs/server";
import { createApp as firestoreCreateApp } from "@/lib/firestore/apps";
import { revalidatePath } from "next/cache";

export async function createApp(formData: FormData | Record<string, any>) {
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
  const result = await firestoreCreateApp(data, userId);
  
  if (result.success) {
    revalidatePath('/dashboard');
    
    // Return a clean serializable object using the correct structure
    // Extract only what we need from the app object
    return { 
      success: true,
      // Don't return the actual app object which might contain non-serializable data
      // Just indicate success
    };
  }
  
  // For error cases, return as is (already serializable)
  return { 
    success: false, 
    error: typeof result.error === 'string' ? result.error : "An unexpected error occurred" 
  };
}