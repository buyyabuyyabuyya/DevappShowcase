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
  }
  
  return result;
}