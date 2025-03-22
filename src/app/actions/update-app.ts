'use server';

import { auth } from "@clerk/nextjs/server";
import { updateApp as firestoreUpdateApp } from "@/lib/firestore/apps";
import { revalidatePath } from "next/cache";

export async function updateApp(appId: string, formData: FormData | Record<string, any>) {
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
    revalidatePath(`/apps/${appId}`);
    revalidatePath('/dashboard');
  }
  
  return { 
    success: result.success,
    error: result.error || null,
    app: result.app || null
  };
} 