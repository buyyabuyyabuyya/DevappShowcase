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
//push 
export async function getApps(options: { sort?: string } = {}) {
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
//push
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

export async function createApp(formData: any, userId?: string) {
  console.log('Server action createApp started', { formData });
  
  // Allow userId to be passed as parameter for server-side calls
  let currentUserId = userId;
  
  if (!currentUserId) {
    const session = await auth();
    currentUserId = session?.userId || undefined;
  }
  
  if (!currentUserId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get user profile and check pro status
    const { success, user } = await getUserByClerkId(currentUserId);
    if (!success || !user) {
      return { success: false, error: "Failed to get user profile" };
    }
    
    // Check app limit
    const userApps = await getUserApps(currentUserId);
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
      userId: currentUserId,
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
    
    // Add the appId field to match the document ID
    await updateDoc(appRef, {
      appId: appRef.id
    });
    
    // Update the returned appData to include the appId
    const returnedAppData = {
      ...appData,
      appId: appRef.id
    };
    
    // Update user's app count
    const userRef = doc(db, 'users', currentUserId);
    await updateDoc(userRef, {
      appCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    revalidatePath('/');
    revalidatePath('/dashboard');
    
    return { 
      success: true, 
      app: { id: appRef.id, ...returnedAppData } 
    };
  } catch (error) {
    console.error("Error creating app:", error);
    return { success: false, error: "Failed to create app" };
  }
}

export async function updateApp(id: string, formData: any, userId?: string) {
  try {
    // Allow userId to be passed as parameter for client-side calls
    let currentUserId = userId;
    
    if (!currentUserId) {
      const session = await auth();
      currentUserId = session?.userId || undefined;
    }
    
    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Verify ownership
    const appRef = doc(db, 'apps', id);
    const appDoc = await getDoc(appRef);
    if (!appDoc.exists()) {
      return { success: false, error: "App not found" };
    }
    
    const appData = appDoc.data();
    if (appData.userId !== currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    // List of fields that can be updated
    const allowedFields = [
      'name', 'description', 'appType', 'category', 'iconUrl', 
      'liveUrl', 'repoUrl', 'pricingModel', 'imageUrls', 'youtubeUrl',
      'apiEndpoint', 'apiDocs', 'apiType', 'isPromoted'
    ];

    // Filter and sanitize the update data
    const sanitizedUpdates = Object.entries(formData)
      .filter(([key]) => allowedFields.includes(key))
      .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});

    // Create the update object that preserves existing data
    const updateData: DocumentData = {
      ...appData,           // Keep all existing data
      ...sanitizedUpdates,  // Apply new updates
      appId: id,           // Ensure appId is always set
      updatedAt: serverTimestamp()
    };

    // Protect sensitive fields from being modified
    updateData.userId = appData.userId;
    updateData.createdAt = appData.createdAt;
    updateData.likes = appData.likes || { count: 0, users: [] };
    updateData.ratings = appData.ratings || {
      idea: { total: 0, count: 0 },
      product: { total: 0, count: 0 },
      feedback: { count: 0 },
      userRatings: []
    };

    // Update the document
    await updateDoc(appRef, updateData);

    // Prepare a serializable response
    const serializedAppData = Object.entries(updateData).reduce<Record<string, any>>((obj, [key, value]) => {
      if (value instanceof Timestamp) {
        return {...obj, [key]: value.toDate().toISOString()};
      }
      return {...obj, [key]: value};
    }, {});

    return { 
      success: true, 
      app: {
        id,
        ...serializedAppData,
        createdAt: appData.createdAt instanceof Timestamp 
          ? appData.createdAt.toDate().toISOString() 
          : appData.createdAt,
        updatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Error updating app:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update app" 
    };
  }
}

export async function deleteApp(id: string) {
  try {
    const session = await auth();
    
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" };
    }
    
    const userId = session.userId;
    
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

export async function likeApp(id: string, userId?: string) {
  try {
    // Use passed userId or get from auth()
    let currentUserId = userId;
    
    if (!currentUserId) {
      const session = await auth();
      currentUserId = session?.userId || undefined;
    }
    
    if (!currentUserId) {
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
    const isLiked = currentLikes.includes(currentUserId);
    
    // Update likes count and users array
    if (isLiked) {
      await updateDoc(appRef, {
        'likes.count': increment(-1),
        'likes.users': currentLikes.filter((id: string) => id !== currentUserId)
      });
    } else {
      await updateDoc(appRef, {
        'likes.count': increment(1),
        'likes.users': [...currentLikes, currentUserId]
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
    const session = await auth();
  
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const userId = session.userId;
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