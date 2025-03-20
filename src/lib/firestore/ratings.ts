import { db } from '../firebase';
import { 
  doc, getDoc, updateDoc, arrayUnion, 
  increment, serverTimestamp, collection, 
  addDoc, Timestamp, query, where, orderBy, getDocs
} from 'firebase/firestore';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from './users';
import { revalidatePath } from 'next/cache';

export async function rateApp({
  appId,
  ideaRating,
  productRating,
  provideFeedback
}: {
  appId: string;
  ideaRating: number;
  productRating: number;
  provideFeedback: boolean;
}) {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get the app document
    const appRef = doc(db, 'apps', appId);
    const appDoc = await getDoc(appRef);
    
    if (!appDoc.exists()) {
      return { success: false, error: "App not found" };
    }
    
    const appData = appDoc.data();
    
    // Check if user already rated this app
    const userRatings = appData.ratings?.userRatings || [];
    const existingRating = userRatings.find((r: any) => r.userId === userId);
    
    if (existingRating) {
      return { success: false, error: "You have already rated this app" };
    }
    
    // Create user rating object
    const userRating = {
      userId,
      idea: ideaRating,
      product: productRating,
      feedback: provideFeedback,
      createdAt: serverTimestamp()
    };
    
    // Update ratings in app document
    await updateDoc(appRef, {
      "ratings.idea.total": increment(ideaRating),
      "ratings.idea.count": increment(1),
      "ratings.product.total": increment(productRating),
      "ratings.product.count": increment(1),
      "ratings.userRatings": arrayUnion(userRating),
      ...(provideFeedback ? { "ratings.feedback.count": increment(1) } : {})
    });
    
    revalidatePath(`/apps/${appId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error rating app:", error);
    return { success: false, error: "Failed to rate app" };
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
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get the app document
    const appRef = doc(db, 'apps', appId);
    const appDoc = await getDoc(appRef);
    
    if (!appDoc.exists()) {
      return { success: false, error: "App not found" };
    }
    
    // Get user info for the comment
    const userResponse = await getUserByClerkId(userId);
    if (!userResponse.success || !userResponse.user) {
      return { success: false, error: "Failed to get user info" };
    }
    
    const user = userResponse.user;
    
    // Create feedback entry
    const feedbackEntry = {
      userId,
      appId,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      userImage: user.imageUrl || '',
      comment,
      createdAt: serverTimestamp()
    };
    
    // Add to feedback collection
    const feedbackRef = await addDoc(collection(db, 'feedback'), feedbackEntry);
    
    // Update app document to increment feedback count
    await updateDoc(appRef, {
      "ratings.feedback.count": increment(1)
    });
    
    revalidatePath(`/apps/${appId}`);
    
    return { 
      success: true,
      feedbackEntry: { id: feedbackRef.id, ...feedbackEntry }
    };
  } catch (error) {
    console.error("Error providing feedback:", error);
    return { success: false, error: "Failed to submit feedback" };
  }
}

export async function getAppFeedback(appId: string) {
  try {
    // Get feedback from the feedback collection
    const feedbackRef = collection(db, 'feedback');
    const q = query(feedbackRef, where("appId", "==", appId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const feedback = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, feedback };
  } catch (error) {
    console.error("Error fetching app feedback:", error);
    return { success: false, error: "Failed to fetch feedback" };
  }
} 