'use server';

import { auth } from "@clerk/nextjs/server";
import { updateApp as firestoreUpdateApp } from "@/lib/firestore/apps";
import { revalidatePath } from "next/cache";

// Helper function to sanitize data for serialization
function sanitizeData(data: Record<string, any>): Record<string, any> {
  return Object.entries(data).reduce((acc, [key, value]) => {
    // Keep only primitive values, arrays of primitives, and objects with primitive values
    if (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      (Array.isArray(value) && value.every(v => typeof v === 'string' || typeof v === 'number'))
    ) {
      acc[key] = value;
    } else if (typeof value === 'object') {
      // Handle simple objects (not Date, RegExp, etc)
      if (value.constructor === Object) {
        acc[key] = sanitizeData(value);
      } else if (value instanceof Date) {
        // Convert Date objects to ISO strings
        acc[key] = value.toISOString();
      } else {
        // Skip other complex objects
        console.warn(`Skipping non-serializable property: ${key}`);
      }
    }
    return acc;
  }, {} as Record<string, any>);
}

export async function updateApp(appId: string, formData: FormData | Record<string, any>) {
  try {
    console.log("[ServerAction] Starting update for appId:", appId);
    
    const { userId } = auth();
    console.log("[ServerAction] User ID:", userId);
    
    if (!userId) {
      console.log("[ServerAction] No user ID found");
      return { success: false, error: "Unauthorized" };
    }
    
    let data: Record<string, any>;
    
    // Handle both FormData and regular objects
    if (formData instanceof FormData) {
      console.log("[ServerAction] Converting FormData to object");
      data = Object.fromEntries(formData.entries());
    } else {
      console.log("[ServerAction] Using provided data object");
      data = formData;
    }
    
    console.log("[ServerAction] Calling Firestore with data:", JSON.stringify(data, null, 2));
    
    // Call Firestore function with userId explicitly
    const result = await firestoreUpdateApp(appId, data, userId);
    console.log("[ServerAction] Firestore result:", result);
    
    if (result.success) {
      console.log("[ServerAction] Update successful, revalidating paths");
      revalidatePath(`/apps/${appId}`);
      revalidatePath('/dashboard');
    }
    
    return { 
      success: result.success,
      error: result.error || null,
      app: result.app || null
    };
  } catch (error) {
    console.error("[ServerAction] Error:", error);
    console.error("[ServerAction] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An error occurred while updating the app",
      app: null
    };
  }
} 