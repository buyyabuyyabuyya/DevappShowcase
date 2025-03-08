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
    
    return { isPro: user?.isPro || false };
  } catch (error) {
    console.error("Error fetching user status:", error);
    return { isPro: false };
  }
}

export async function upgradeToProUser() {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");
    
    const userProfile = await getUserProfile();
    if (!userProfile.success) throw new Error("Failed to get user profile");
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      customer_email: userProfile.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "DevApp Showcase Pro Subscription",
              description: "Unlimited app postings and app promotion"
            },
            unit_amount: Math.round(PRO_SUBSCRIPTION.MONTHLY_PRICE * 100),
            recurring: {
              interval: "month"
            }
          },
          quantity: 1
        }
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      metadata: {
        userId: userId
      }
    });
    
    return { success: true, url: session.url };
  } catch (error) {
    console.error("Error upgrading to pro:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

export async function promoteApp(appId: string) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");
    
    await connectDB();
    
    // Check if user is pro
    const userProfile = await User.findOne({ clerkId: userId });
    if (!userProfile) throw new Error("User not found");
    
    if (!userProfile.isPro) {
      throw new Error("Only Pro users can promote apps");
    }
    
    // Find and update the app
    const app = await App?.findById(appId);
    if (!app) throw new Error("App not found");
    
    // Make sure the user owns the app
    if (app.userId !== userId) {
      throw new Error("You can only promote your own apps");
    }
    
    // Update promotion status
    app.isPromoted = true;
    app.promotedAt = new Date();
    await app.save();
    
    // Update user's lastPromotion date
    userProfile.lastPromotion = new Date();
    await userProfile.save();
    
    revalidatePath('/apps');
    revalidatePath('/');
    revalidatePath(`/apps/${appId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error promoting app:", error);
    return { success: false, error: error.message };
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