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
    console.log("Server action started with appId:", appId);
    
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
    
    // Sanitize the data to ensure it's serializable
    const sanitizedData = sanitizeData(data);
    console.log("Sanitized data:", JSON.stringify(sanitizedData));
    
    // Call Firestore function with userId explicitly
    const result = await firestoreUpdateApp(appId, sanitizedData, userId);
    
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