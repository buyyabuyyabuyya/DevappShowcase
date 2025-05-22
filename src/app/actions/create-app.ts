'use server';

import { auth } from "@clerk/nextjs/server";
import { createApp as firestoreCreateApp } from "@/lib/firestore/apps";
import { revalidatePath } from "next/cache";

export async function createApp(formData: FormData | Record<string, any>) {
  const session = await auth();
  
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const userId = session.userId;
  
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
    
    // Return a clean serializable object with the app ID
    // This is critical for navigation to the app details page
    return { 
      success: true, 
      // Extract the ID from the app object but don't pass the non-serializable Firestore data
      appId: result.app?.id || null
    };
  }
  
  // For error cases, return as is (already serializable)
  return { 
    success: false, 
    error: typeof result.error === 'string' ? result.error : "An unexpected error occurred" 
  };
}