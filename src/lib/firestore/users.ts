import { db } from '../firebase';
import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, 
  collection, query, where, getDocs, DocumentData,
  serverTimestamp, Timestamp, increment
} from 'firebase/firestore';
import { auth } from '@clerk/nextjs/server';

// User CRUD operations
export async function getUserByClerkId(clerkId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', clerkId));
    
    if (userDoc.exists()) {
      return { success: true, user: userDoc.data() };
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { 
        success: true, 
        user: { id: userDoc.id, ...userDoc.data() } 
      };
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function createUser(userData: any) {
  try {
    // Check if user already exists
    const { success } = await getUserByClerkId(userData.clerkId);
    
    if (success) {
      // User exists, update instead
      return updateUser(userData.clerkId, userData);
    }
    
    // Create new user
    const userDoc = {
      clerkId: userData.clerkId,
      email: userData.email || null,
      firstName: (userData.first_name || userData.firstName || null),
      lastName: (userData.last_name || userData.lastName || null),
      imageUrl: (userData.image_url || userData.imageUrl || null),
      isPro: false,
      appCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stripeCustomerId: null,
      subscriptionExpiresAt: null,
      subscriptionId: null
    };
    
    await setDoc(doc(db, 'users', userData.clerkId), userDoc);
    
    return { 
      success: true, 
      user: { id: userData.clerkId, ...userDoc } 
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(clerkId: string, userData: any) {
  try {
    const userRef = doc(db, 'users', clerkId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: "User not found" };
    }
    
    const updatedData = {
      email: userData.email || userDoc.data().email,
      firstName: userData.first_name || userData.firstName || userDoc.data().firstName,
      lastName: userData.last_name || userData.lastName || userDoc.data().lastName,
      imageUrl: userData.image_url || userData.imageUrl || userDoc.data().imageUrl,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(userRef, updatedData);
    
    return { 
      success: true, 
      user: { id: clerkId, ...updatedData } 
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUser(clerkId: string) {
  try {
    await deleteDoc(doc(db, 'users', clerkId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function getUserStatus() {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isPro: false };
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const isSubscriptionActive = userData.isPro && 
        userData.subscriptionExpiresAt && 
        userData.subscriptionExpiresAt.toDate() > new Date();
      
      return { 
        isPro: isSubscriptionActive, 
        subscriptionExpiresAt: userData.subscriptionExpiresAt?.toDate() 
      };
    }
    
    return { isPro: false };
  } catch (error) {
    console.error("Error fetching user status:", error);
    return { isPro: false };
  }
}

export async function getUserById(id: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', id));
    
    if (userDoc.exists()) {
      return { 
        success: true, 
        user: { id: userDoc.id, ...userDoc.data() } 
      };
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

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

export async function getUserProfile() {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }
    
    return await getUserByClerkId(userId);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: "Failed to fetch user profile" };
  }
}

export async function updateUserSubscriptionStatus({
  stripeCustomerId,
  isActive,
  subscriptionId,
  currentPeriodEnd
}: {
  stripeCustomerId: string;
  isActive: boolean;
  subscriptionId: string;
  currentPeriodEnd: Date;
}) {
  try {
    console.log(`Looking for user with Stripe ID: ${stripeCustomerId}`);
    
    // 1. First try to find the user by Stripe customer ID
    const userSnapshot = await getDocs(
      query(collection(db, 'users'), where('stripeCustomerId', '==', stripeCustomerId))
    );
    
    if (userSnapshot.empty) {
      console.error(`No user found with Stripe customer ID: ${stripeCustomerId}`);
      
      // 2. If no user found by Stripe ID, you could try to find by Clerk ID
      // This is a fallback if the Stripe customer ID wasn't properly stored
      const clerkUserResponse = await fetch(
        `https://api.clerk.dev/v1/customers/${stripeCustomerId}/metadata`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      );
      
      if (!clerkUserResponse.ok) {
        return { success: false, error: 'No user found with this Stripe customer ID' };
      }
      
      const clerkUserData = await clerkUserResponse.json();
      const clerkId = clerkUserData.metadata.clerkId;
      
      if (!clerkId) {
        return { success: false, error: 'No Clerk user ID found in Stripe metadata' };
      }
      
      // Now try to find the user by Clerk ID
      const clerkUserSnapshot = await getDocs(
        query(collection(db, 'users'), where('clerkId', '==', clerkId))
      );
      
      if (clerkUserSnapshot.empty) {
        return { success: false, error: 'No user found for the associated Clerk ID' };
      }
      
      // Update the user with their Stripe customer ID for future use
      const userDoc = clerkUserSnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        stripeCustomerId,
        isPro: isActive,
        subscriptionId,
        subscriptionExpiresAt: currentPeriodEnd,
        updatedAt: serverTimestamp()
      });
      
      console.log(`User subscription updated with Clerk ID fallback: ${userDoc.id}`);
      return { success: true };
    }
    
    // Normal path - user found by Stripe customer ID
    const userDoc = userSnapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), {
      isPro: isActive,
      subscriptionId,
      subscriptionExpiresAt: currentPeriodEnd,
      updatedAt: serverTimestamp()
    });
    
    console.log(`User subscription updated: ${userDoc.id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating subscription status:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}