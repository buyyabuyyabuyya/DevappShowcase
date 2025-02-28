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
    if (!userId) throw new Error("Unauthorized");

    await connectDB();
    
    // Find or create user
    let userProfile = await User.findOne({ clerkId: userId });
    
    if (!userProfile) {
      const clerkUser = await currentUser();
      
      if (!clerkUser) throw new Error("User not found");
      
      userProfile = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        isPro: false,
        appCount: 0
      });
    }
    
    return { success: true, user: userProfile };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: "Failed to fetch user profile" };
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