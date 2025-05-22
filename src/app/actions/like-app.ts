'use server';

import { auth } from "@clerk/nextjs/server";
import { likeApp as firestoreLikeApp } from "@/lib/firestore/apps";
import { revalidatePath } from "next/cache";

export async function likeApp(appId: string) {
  const session = await auth();
  
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const userId = session.userId;
  
  // Call Firestore function with userId explicitly
  const result = await firestoreLikeApp(appId, userId);
  
  if (result.success) {
    // Revalidate the app detail page and dashboard
    revalidatePath(`/apps/${appId}`);
    revalidatePath('/dashboard');
  }
  
  // Return a serializable result
  return { 
    success: result.success,
    isLiked: result.isLiked || false,
    count: result.count || 0,
    error: result.error
  };
} 