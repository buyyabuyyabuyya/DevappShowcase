import { db } from '../firebase';
import { 
  collection, doc, addDoc, getDoc, getDocs, 
  updateDoc, deleteDoc, query, where, orderBy, 
  limit, startAfter, serverTimestamp, increment,
  DocumentData, Timestamp
} from 'firebase/firestore';
import { getUserByClerkId } from './users';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Constants for app limits
const APP_LIMITS = {
  FREE_USER: {
    MAX_APPS: 3,
    DESCRIPTION_MAX_LENGTH: 500
  },
  PRO_USER: {
    MAX_APPS: 20,
    DESCRIPTION_MAX_LENGTH: 2000
  }
};

export async function getApps(options = {}) {
  try {
    const appsRef = collection(db, 'apps');
    const q = query(appsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const apps = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, apps };
  } catch (error) {
    console.error("Error fetching apps:", error);
    return { success: false, error: "Failed to fetch apps" };
  }
}

export async function getAppById(id: string) {
  try {
    const appDoc = await getDoc(doc(db, 'apps', id));
    
    if (appDoc.exists()) {
      return { 
        success: true, 
        app: { id: appDoc.id, ...appDoc.data() } 
      };
    }
    return { success: false, error: "App not found" };
  } catch (error) {
    console.error("Error fetching app:", error);
    return { success: false, error: "Failed to fetch app" };
  }
}

export async function getUserApps(userId: string) {
  try {
    const appsRef = collection(db, 'apps');
    const q = query(appsRef, where("userId", "==", userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const apps = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, apps };
  } catch (error) {
    console.error("Error fetching user apps:", error);
    return { success: false, error: "Failed to fetch user apps" };
  }
}

export async function createApp(formData: any) {
  console.log('Server action createApp started', { formData });
  
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get user profile and check pro status
    const { success, user } = await getUserByClerkId(userId);
    if (!success || !user) {
      return { success: false, error: "Failed to get user profile" };
    }
    
    // Check app limit
    const userApps = await getUserApps(userId);
    const appCount = userApps.success && userApps.apps ? userApps.apps.length : 0;
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
        },
        product: {
          total: 0,
          count: 0,
        },
        feedback: {
          count: 0
        },
        userRatings: []
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create the app document
    const appRef = await addDoc(collection(db, 'apps'), appData);
    
    // Update user's app count
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      appCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    revalidatePath('/');
    revalidatePath('/dashboard');
    
    return { 
      success: true, 
      app: { id: appRef.id, ...appData } 
    };
  } catch (error) {
    console.error("Error creating app:", error);
    return { success: false, error: "Failed to create app" };
  }
}

export async function updateApp(id: string, formData: any) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Verify ownership
    const appDoc = await getDoc(doc(db, 'apps', id));
    if (!appDoc.exists()) {
      return { success: false, error: "App not found" };
    }
    
    const appData = appDoc.data();
    if (appData.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Update app
    const updateData = {
      ...formData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'apps', id), updateData);
    
    revalidatePath(`/apps/${id}`);
    revalidatePath('/dashboard');
    
    return { 
      success: true, 
      app: { id, ...appData, ...updateData } 
    };
  } catch (error) {
    console.error("Error updating app:", error);
    return { success: false, error: "Failed to update app" };
  }
}

export async function deleteApp(id: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Verify ownership
    const appDoc = await getDoc(doc(db, 'apps', id));
    if (!appDoc.exists()) {
      return { success: false, error: "App not found" };
    }
    
    const appData = appDoc.data();
    if (appData.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Delete app
    await deleteDoc(doc(db, 'apps', id));
    
    // Update user's app count
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      appCount: increment(-1),
      updatedAt: serverTimestamp()
    });
    
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting app:", error);
    return { success: false, error: "Failed to delete app" };
  }
}

export async function likeApp(id: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the app document
    const appRef = doc(db, 'apps', id);
    const appDoc = await getDoc(appRef);
    
    if (!appDoc.exists()) {
      return { success: false, error: "App not found" };
    }
    
    const appData = appDoc.data();
    const currentLikes = appData.likes?.users || [];
    const currentCount = appData.likes?.count || 0;
    
    // Check if user already liked this app
    const isLiked = currentLikes.includes(userId);
    
    // Update likes count and users array
    if (isLiked) {
      await updateDoc(appRef, {
        'likes.count': increment(-1),
        'likes.users': currentLikes.filter((id: string) => id !== userId)
      });
    } else {
      await updateDoc(appRef, {
        'likes.count': increment(1),
        'likes.users': [...currentLikes, userId]
      });
    }
    
    // Return the new state
    return { 
      success: true, 
      isLiked: !isLiked,
      count: isLiked ? currentCount - 1 : currentCount + 1
    };
  } catch (error) {
    console.error("Error liking app:", error);
    return { success: false, error: "Failed to like app" };
  }
}

export async function togglePromoteApp(id: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Get the app document
    const appRef = doc(db, 'apps', id);
    const appDoc = await getDoc(appRef);
    
    if (!appDoc.exists()) {
      return { success: false, error: "App not found" };
    }
    
    const appData = appDoc.data();
    
    // Verify ownership
    if (appData.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Get user profile to check if Pro
    const { success, user } = await getUserByClerkId(userId);
    if (!success || !user) {
      return { success: false, error: "Failed to get user profile" };
    }
    
    // Only Pro users can promote apps
    if (!user.isPro) {
      return { success: false, error: "Pro subscription required" };
    }
    
    // Toggle promotion status
    const isCurrentlyPromoted = appData.isPromoted || false;
    await updateDoc(appRef, {
      isPromoted: !isCurrentlyPromoted,
      updatedAt: serverTimestamp()
    });
    
    revalidatePath(`/apps/${id}`);
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error("Error toggling app promotion:", error);
    return { success: false, error: "Failed to update promotion status" };
  }
}

export async function searchApps(searchTerm: string) {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }
    
    // We need to perform a client-side filtering since Firestore doesn't support
    // partial text search natively without additional setup (like Algolia)
    const appsRef = collection(db, 'apps');
    const querySnapshot = await getDocs(appsRef);
    
    const results = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(app => {
        // Use type assertion and optional chaining for safer property access
        const appData = app as Record<string, any>;
        const name = (appData.name || '').toLowerCase();
        const description = (appData.description || '').toLowerCase();
        const term = searchTerm.toLowerCase();
        
        return name.includes(term) || description.includes(term);
      });
    
    return results;
  } catch (error) {
    console.error("Error searching apps:", error);
    return [];
  }
}