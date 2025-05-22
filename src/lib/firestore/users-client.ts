// Client-side version of user-related functions
// This avoids server-only imports in client components

import { db } from '../firebase';
import { 
  doc, getDoc, updateDoc,
  serverTimestamp, Timestamp
} from 'firebase/firestore';

// Function to retrieve a user's pro status
export async function getUserProStatus(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { 
        success: true, 
        isPro: userData.isPro || false,
        subscriptionExpiresAt: userData.subscriptionExpiresAt || null
      };
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    console.error("Error fetching user pro status:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

// Client-safe version of upgradeToProUser
// Note: This should typically be done through a server action or API route
// This is provided as a fallback but the recommended approach is to use Stripe Checkout
export async function upgradeToProUser(userId: string) {
  try {
    // Get current user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return { success: false, error: "User not found" };
    }
    
    // Calculate expiration one month from now
    const today = new Date();
    const subscriptionExpiresAt = new Date(today.setMonth(today.getMonth() + 1));
    
    // Update user with Pro status
    await updateDoc(doc(db, 'users', userId), {
      isPro: true,
      subscriptionExpiresAt: Timestamp.fromDate(subscriptionExpiresAt),
      updatedAt: serverTimestamp()
    });
    
    return { 
      success: true, 
      user: { 
        id: userId, 
        ...userDoc.data(), 
        isPro: true, 
        subscriptionExpiresAt 
      }
    };
  } catch (error) {
    console.error("Error upgrading user to Pro:", error);
    return { success: false, error: "Failed to upgrade user" };
  }
}
