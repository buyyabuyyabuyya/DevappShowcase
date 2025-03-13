"use server"

import { App } from '@/models/App';
import connectDB from '../db';
import { revalidatePath } from 'next/cache';
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { User } from "@/models/User";
import { APP_LIMITS } from "@/lib/constants";
import { getUserProfile } from "./users";



export async function getApps(params?: { type?: string; sort?: string }) {
  try {
    await connectDB();
    
    const query = params?.type && params.type !== 'all' 
      ? { appType: params.type }
      : {};
    
    const sortOption = params?.sort === 'likes' 
      ? { 'likes.count': -1 }
      : params?.sort === 'name'
      ? { name: 1 }
      : { createdAt: -1 };

    const apps = await App?.find(query).sort(sortOption as any).limit(50);
    
    // Ensure we always return an array, even if the DB query fails
    return { 
      apps: apps ? JSON.parse(JSON.stringify(apps)) : [],
      success: true
    };
  } catch (error) {
    console.error('Error fetching apps:', error);
    return { apps: [], success: false, error: String(error) };
  }
}

export async function createApp(formData: any) {
  console.log('Server action createApp started', { formData });
  
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await connectDB();
    
    // Get user profile and check pro status
    const { success, user } = await getUserProfile();
    if (!success || !user) {
      return { success: false, error: "Failed to get user profile" };
    }
    
    // Check app limit
    const appCount = await App?.countDocuments({ userId }) ?? 0;
    const maxApps = user.isPro ? APP_LIMITS.PRO_USER.MAX_APPS : APP_LIMITS.FREE_USER.MAX_APPS;

    if (appCount >= maxApps) {
      return { success: false, error: 'MAX_APPS_REACHED' };
    }
    
    // Check description length
    const maxLength = user.isPro 
      ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH 
      : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH;
      
    if (formData.description && formData.description.length > maxLength) {
      return { 
        success: false, 
        error: `Description exceeds the maximum length of ${maxLength} characters for your account type.`
      };
    }
    
    const appData = {
      ...formData,
      userId,
      likes: {
        count: 0,
        users: []
      },
      ratings: {
        idea: {
          total: 0,
          count: 0,
          average: 0
        },
        product: {
          total: 0,
          count: 0,
          average: 0
        },
        feedback: {
          count: 0
        },
        userRatings: []
      }
    };

    // Create the app document
    const app = await App?.create(appData);
    
    // Update user's app count directly using findOneAndUpdate
    await User.findOneAndUpdate(
      { clerkId: userId },
      { $inc: { appCount: 1 } },
      { new: true }
    );
    
    revalidatePath('/');
    revalidatePath('/dashboard');
    
    return { 
      success: true, 
      app: JSON.parse(JSON.stringify(app))
    };
  } catch (error) {
    if (error instanceof Error && 
        error.message.includes('Body exceeded 1MB limit')) {
      throw new Error(
        "Images are too large. Please reduce image sizes or upload fewer images. Maximum total size is 1MB."
      );
    }
    console.error("Error creating app:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error creating app" 
    };
  }
}

export async function updateApp(id: string, values: any) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    await connectDB();
    
    // Get user profile and check pro status
    const { success, user } = await getUserProfile();
    if (!success || !user) throw new Error("Failed to get user profile");
    
    const app = await App?.findById(id);
    if (!app) throw new Error("App not found");
    if (app.userId !== userId) throw new Error("Unauthorized");
    
    // Check description length
    const maxLength = user.isPro 
      ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH 
      : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH;
      
    if (values.description.length > maxLength) {
      return { 
        success: false, 
        error: `Description exceeds the maximum length of ${maxLength} characters for your account type.`
      };
    }

    const updated = await App?.findByIdAndUpdate(
      id,
      {
        name: values.name,
        description: values.description,
        appType: values.appType,
        category: values.category,
        pricing: values.pricing,
        repoUrl: values.repoUrl,
        liveUrl: values.liveUrl,
        iconUrl: values.iconUrl,
        imageUrls: values.imageUrls,
        youtubeUrl: values.youtubeUrl,
        apiType: values.apiType,
        apiEndpoint: values.apiEndpoint,
        apiDocs: values.apiDocs,
      },
      { new: true }
    );
    //revalidate the page
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath(`/apps/${id}`);
    
    return { 
      success: true, 
      app: JSON.parse(JSON.stringify(updated))
    };
  } catch (error) {
    console.error("Error updating app:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteApp(id: string) {
  const session = await auth();
  const userId = session?.userId;
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await connectDB();
    
    const app = await App?.findById(id);
    if (!app) throw new Error("App not found");
    if (app.userId !== userId) throw new Error("Unauthorized");
    
    await App?.findByIdAndDelete(id);
    
    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Error deleting app:", error);
    throw error;
  }
}

export async function likeApp(appId: string) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    await connectDB();
    const app = await App?.findById(appId);
    if (!app) throw new Error("App not found");

    // Check if user has already liked
    const hasLiked = app.likes.users.includes(userId);

    if (hasLiked) {
      // Unlike: Remove user and decrease count
      app.likes.users = app.likes.users.filter((id: string) => id !== userId);
      app.likes.count -= 1;
    } else {
      // Like: Add user and increase count
      app.likes.users.push(userId);
      app.likes.count += 1;
    }

    await app.save();
    
    return { 
      success: true, 
      isLiked: !hasLiked,
      count: app.likes.count 
    };
  } catch (error) {
    console.error("Error liking app:", error);
    throw error;
  }
}

export async function togglePromoteApp(id: string) {
  const session = await auth();
  const userId = session?.userId;
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await connectDB();
    
    const app = await App?.findById(id);
    if (!app) throw new Error("App not found");
    if (app.userId !== userId) throw new Error("Unauthorized");
    
    const updated = await App?.findByIdAndUpdate(
      id, 
      { isPromoted: !app.isPromoted },
      { new: true }
    );
    
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath(`/apps/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error toggling promotion:", error);
    throw error;
  }
}

export async function getPromotedApps() {
  try {
    await connectDB();
    const apps = await App?.find({ isPromoted: true }).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(apps));
  } catch (error) {
    console.error("Error fetching promoted apps:", error);
    throw error;
  }
}

export async function getAppById(id: string) {
  try {
    await connectDB();
    const app = await App?.findById(id);
    
    if (!app) return null;

    // Ensure ratings are properly initialized
    const safeApp = {
      ...app.toObject(),
      ratings: {
        idea: {
          total: app.ratings?.idea?.total || 0,
          count: app.ratings?.idea?.count || 0,
          average: app.ratings?.idea?.count ? 
            (app.ratings.idea.total / app.ratings.idea.count) : 0
        },
        product: {
          total: app.ratings?.product?.total || 0,
          count: app.ratings?.product?.count || 0,
          average: app.ratings?.product?.count ? 
            (app.ratings.product.total / app.ratings.product.count) : 0
        },
        feedback: {
          count: app.ratings?.feedback?.count || 0
        },
        userRatings: app.ratings?.userRatings || []
      }
    };

    return JSON.parse(JSON.stringify(safeApp));
  } catch (error) {
    console.error('Error fetching app:', error);
    return null;
  }
}

export async function searchApps(searchTerm: string) {
  try {
    await connectDB();
    
    const apps = await App?.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } }
      ]
    }).sort({ isPromoted: -1, createdAt: -1 }).limit(20);
    
    return JSON.parse(JSON.stringify(apps));
  } catch (error) {
    console.error("Error searching apps:", error);
    return [];
  }
} 