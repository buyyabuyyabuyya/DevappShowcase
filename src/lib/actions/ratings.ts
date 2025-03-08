"use server"

import { App } from '@/models/App';
import { auth } from "@clerk/nextjs/server";
import connectDB from '../db';
import { revalidatePath } from 'next/cache';
import { clerkClient } from "@clerk/nextjs";

interface RatingInput {
  appId: string;
  type: 'idea' | 'product';
  rating: number;
}

export async function rateApp({ appId, type, rating }: RatingInput) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    await connectDB();
    const app = await App?.findById(appId);
    if (!app) throw new Error("App not found");

    // Find existing user rating
    const existingRatingIndex = app.ratings.userRatings.findIndex(
      (r: { userId: string; [key: string]: any }) => r.userId === userId
    );

    if (existingRatingIndex !== -1) {
      const existingRating = app.ratings.userRatings[existingRatingIndex];
      
      // If trying to set the same rating value, reject
      if (existingRating[type] === rating) {
        throw new Error("Cannot select the same rating value again");
      }

      // Update totals: subtract old rating if it exists
      if (existingRating[type]) {
        app.ratings[type].total -= existingRating[type];
        app.ratings[type].count -= 1;
      }

      // Update the rating
      existingRating[type] = rating;
      app.ratings.userRatings[existingRatingIndex] = existingRating;
    } else {
      // Add new user rating
      const userRating = {
        userId,
        idea: undefined,
        product: undefined,
        feedback: undefined,
        [type]: rating
      };
      app.ratings.userRatings.push(userRating);
    }

    // Update totals with new rating
    app.ratings[type].total += rating;
    app.ratings[type].count += 1;

    await app.save();
    revalidatePath(`/apps/${appId}`);
    return { 
      success: true,
      newRating: {
        total: app.ratings[type].total,
        count: app.ratings[type].count,
        average: app.ratings[type].total / app.ratings[type].count
      }
    };
  } catch (error) {
    console.error("Error rating app:", error);
    return { success: false, error: 'Failed to update rating' };
  }
}

export async function provideFeedback({ 
  appId, 
  comment 
}: { 
  appId: string; 
  comment: string 
}) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    await connectDB();
    const app = await App?.findById(appId);
    if (!app) throw new Error("App not found");

    // Get user info for the comment
    const user = await clerkClient.users.getUser(userId);
    
    // Get email address and extract username
    let userName = "Anonymous";
    
    // Find primary email
    const primaryEmail = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    );
    
    if (primaryEmail) {
      // Extract username part (before the @ symbol)
      userName = primaryEmail.emailAddress.split('@')[0];
    }
    
    // Create feedback entry
    const feedbackEntry = {
      userId,
      userName,
      userImageUrl: user.imageUrl,
      comment,
      createdAt: new Date()
    };

    // Add to feedback array
    if (!app.feedback) {
      app.feedback = [];
    }
    
    app.feedback.push(feedbackEntry);
    
    // Increment feedback count
    if (!app.ratings.feedback) {
      app.ratings.feedback = { count: 0 };
    }
    app.ratings.feedback.count += 1;
    
    await app.save();
    revalidatePath(`/apps/${appId}`);
    
    return { 
      success: true,
      feedbackEntry
    };
  } catch (error) {
    console.error("Error providing feedback:", error);
    return { success: false, error: 'Failed to submit feedback' };
  }
}

export async function getFeedback(appId: string) {
  try {
    await connectDB();
    const app = await App?.findById(appId);
    if (!app) throw new Error("App not found");
    
    return {
      success: true,
      feedback: app.feedback || []
    };
  } catch (error) {
    console.error("Error getting feedback:", error);
    return { success: false, error: 'Failed to get feedback' };
  }
} 