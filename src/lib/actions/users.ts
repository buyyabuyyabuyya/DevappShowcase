"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { User } from "@/models/User";
import { App } from "@/models/App";
import connectDB from "../db";
import { PRO_SUBSCRIPTION } from "@/lib/constants";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export async function getUserProfile() {
  try {
    const { userId } = auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await connectDB();
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) return { success: false, error: "User not found" };
    
    // If the user has a subscription but it's expired, update isPro to false
    if (user.isPro && user.subscriptionExpiresAt && new Date() > user.subscriptionExpiresAt) {
      await User.updateOne({ clerkId: userId }, { isPro: false });
      user.isPro = false;
    }
    
    return { 
      success: true, 
      user: JSON.parse(JSON.stringify(user)) 
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: "Failed to fetch user profile" };
  }
}

export async function createUser(userData: any) {
  try {
    await connectDB();
    
    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: userData.clerkId });
    if (existingUser) {
      // User already exists, update instead
      return await updateUser(userData.clerkId, userData);
    }
    
    // Create new user
    const newUser = await User.create({
      clerkId: userData.clerkId,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      imageUrl: userData.image_url,
      isPro: false,
      appCount: 0
    });
    
    return { success: true, user: JSON.parse(JSON.stringify(newUser)) };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(clerkId: string, userData: any) {
  try {
    await connectDB();
    
    const user = await User.findOne({ clerkId });
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
    // Update user fields
    user.email = userData.email || user.email;
    user.firstName = userData.first_name || userData.firstName || user.firstName;
    user.lastName = userData.last_name || userData.lastName || user.lastName;
    user.imageUrl = userData.image_url || userData.imageUrl || user.imageUrl;
    user.updatedAt = new Date();
    
    await user.save();
    
    revalidatePath('/dashboard');
    revalidatePath('/settings');
    
    return { success: true, user: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUser(clerkId: string) {
  try {
    await connectDB();
    
    // Find and delete the user
    const result = await User.deleteOne({ clerkId });
    
    if (result.deletedCount === 0) {
      return { success: false, error: "User not found" };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function upgradeToProPlan(clerkId: string) {
  try {
    await connectDB();
    
    const user = await User.findOne({ clerkId });
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
    user.isPro = true;
    user.updatedAt = new Date();
    await user.save();
    
    revalidatePath('/dashboard');
    revalidatePath('/settings');
    
    return { success: true, user: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    console.error("Error upgrading user:", error);
    return { success: false, error: "Failed to upgrade user" };
  }
}

export async function getUserStatus() {
  try {
    const { userId } = auth();
    if (!userId) return { isPro: false };
    
    await connectDB();
    const user = await User.findOne({ clerkId: userId });
    
    return { 
      isPro: user?.isPro || false,
      success: true 
    };
  } catch (error) {
    console.error("Error checking pro status:", error);
    return { isPro: false, success: false };
  }
}

export async function upgradeToProUser() {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");
    
    const userProfile = await getUserProfile();
    if (!userProfile.success) throw new Error("Failed to get user profile");
    
    // Redirect to Stripe checkout for subscription
    return { 
      success: true, 
      url: PRO_SUBSCRIPTION.STRIPE_URL 
    };
  } catch (error) {
    console.error("Error upgrading to pro:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

export async function promoteApp(appId: string) {
  try {
    await connectDB();
    
    // Get the current user
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }
    
    // Get user data
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
    // Check if user is Pro
    if (!user.isPro) {
      return { success: false, error: "Pro subscription required" };
    }
    
    // Update the app to toggle promotion status
    const app = await App?.findById(appId);
    if (!app) {
      return { success: false, error: "App not found" };
    }
    
    if (app.userId.toString() !== user._id.toString()) {
      return { success: false, error: "You can only modify your own apps" };
    }
    
    // Toggle the promoted status
    app.isPromoted = !app.isPromoted;
    await app.save();
    
    return { success: true };
  } catch (error) {
    console.error("Error updating app promotion:", error);
    return { success: false, error: "Failed to update promotion status" };
  }
}

// New function to auto-promote all user apps when they become Pro
export async function promoteAllUserApps(userId: string) {
  try {
    await connectDB();
    
    // Update all apps belonging to the user
    await App?.updateMany(
      { userId },
      { $set: { isPromoted: true } }
    );
    
    return { success: true };
  } catch (error) {
    console.error("Error promoting all apps:", error);
    return { success: false, error: "Failed to promote apps" };
  }
}

// This would be called by the Stripe webhook
export async function handleProSubscription({ 
  userId, 
  status 
}: { 
  userId: string, 
  status: 'active' | 'canceled' 
}) {
  try {
    await connectDB();
    
    const userProfile = await User.findOne({ clerkId: userId });
    if (!userProfile) throw new Error("User not found");
    
    userProfile.isPro = status === 'active';
    await userProfile.save();
    
    return { success: true };
  } catch (error) {
    console.error("Error handling subscription:", error);
    return { success: false, error: "Failed to update subscription status" };
  }
}

export async function getUserById(clerkId: string) {
  try {
    await connectDB();
    
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return { user: null };
    }
    
    return { user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { user: null };
  }
}

export interface SubscriptionUpdateData {
  stripeCustomerId: string;
  isActive: boolean;
  subscriptionId: string | null;
  currentPeriodEnd: Date | null;
}

export async function updateUserSubscriptionStatus(data: SubscriptionUpdateData) {
  const { stripeCustomerId, isActive, subscriptionId, currentPeriodEnd } = data;
  
  try {
    await connectDB();
    
    // Update using Mongoose instead of Prisma
    const result = await User.updateOne(
      { stripeCustomerId },
      {
        $set: {
          isPro: isActive,
          subscriptionId,
          subscriptionExpiresAt: currentPeriodEnd,
        }
      }
    );
    
    return { 
      success: true, 
      updatedCount: result.modifiedCount 
    };
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return { success: false, error: 'Failed to update subscription status' };
  }
} 