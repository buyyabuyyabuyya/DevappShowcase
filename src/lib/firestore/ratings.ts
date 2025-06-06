import { db } from '../firebase';
import { 
  doc, getDoc, updateDoc, arrayUnion, 
  increment, serverTimestamp, collection, 
  addDoc, Timestamp, query, where, orderBy, getDocs, deleteDoc
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
  ideaRating: number | null;
  productRating: number | null;
  provideFeedback: boolean;
}) {
  const session = await auth();
  
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const userId = session.userId;
  
  try {
    // Get the app document
    const appRef = doc(db, 'apps', appId);
    const appDoc = await getDoc(appRef);
    
    if (!appDoc.exists()) {
      return { success: false, error: "App not found" };
    }
    
    const appData = appDoc.data();
    
    // Get user information for the rating
    const { success: userSuccess, user } = await getUserByClerkId(userId);
    if (!userSuccess || !user) {
      return { success: false, error: "User not found" };
    }
    
    // Initialize ratings data structure if not exists
    const ratings = appData.ratings || {
      idea: { total: 0, count: 0 },
      product: { total: 0, count: 0 },
      feedback: { count: 0 },
      userRatings: []
    };
    
    // Find user's existing rating if any
    const userRatingIndex = ratings.userRatings.findIndex(
      (rating: any) => rating.userId === userId
    );
    
    const userHasExistingRating = userRatingIndex !== -1;
    const existingRating = userHasExistingRating ? ratings.userRatings[userRatingIndex] : null;
    
    // Calculate new rating totals
    let newIdeaTotal = ratings.idea.total;
    let newIdeaCount = ratings.idea.count;
    let newProductTotal = ratings.product.total;
    let newProductCount = ratings.product.count;
    
    // Handle idea rating if provided
    if (ideaRating !== null) {
      if (userHasExistingRating && existingRating.ideaRating) {
        // Update existing idea rating
        newIdeaTotal = newIdeaTotal - existingRating.ideaRating + ideaRating;
      } else {
        // Add new idea rating
        newIdeaTotal += ideaRating;
        newIdeaCount += 1;
      }
    }
    
    // Handle product rating if provided
    if (productRating !== null) {
      if (userHasExistingRating && existingRating.productRating) {
        // Update existing product rating
        newProductTotal = newProductTotal - existingRating.productRating + productRating;
      } else {
        // Add new product rating
        newProductTotal += productRating;
        newProductCount += 1;
      }
    }
    
    // Create/update user rating entry
    const userRating = {
      userId,
      userName: user.firstName || "Anonymous",
      userImage: user.imageUrl || "",
      ideaRating: ideaRating !== null ? ideaRating : (existingRating?.ideaRating || null),
      productRating: productRating !== null ? productRating : (existingRating?.productRating || null),
      provideFeedback,
      createdAt: existingRating?.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    // Update ratings array
    if (userHasExistingRating) {
      ratings.userRatings[userRatingIndex] = userRating;
    } else {
      ratings.userRatings.push(userRating);
    }
    
    // Update app document
    await updateDoc(appRef, {
      ratings: {
        idea: { total: newIdeaTotal, count: newIdeaCount },
        product: { total: newProductTotal, count: newProductCount },
        feedback: ratings.feedback,
        userRatings: ratings.userRatings
      },
      updatedAt: serverTimestamp()
    });
    
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
  comment: string;
}) {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const userId = session.userId;

  try {
    // Enforce character limit on the server side
    const MAX_FEEDBACK_LENGTH = 200;
    const trimmedComment = comment.substring(0, MAX_FEEDBACK_LENGTH);
    
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
    
    // Extract username from email if available
    let userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (!userName && user.email) {
      // Extract username part from email (before the @)
      userName = user.email.split('@')[0];
    }
    
    // Create feedback entry
    const feedbackEntry = {
      userId,
      appId,
      userName: userName || 'Anonymous',
      userImage: user.imageUrl || '',
      comment: trimmedComment,
      createdAt: Timestamp.now()
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
    // Get feedback from the feedback collection - without ordering
    const feedbackRef = collection(db, 'feedback');
    const q = query(feedbackRef, where("appId", "==", appId));
    const querySnapshot = await getDocs(q);
    
    const feedback = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort on client side
    feedback.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime(); // Descending order
    });
    
    return { success: true, feedback };
  } catch (error) {
    console.error("Error fetching app feedback:", error);
    return { success: false, error: "Failed to fetch feedback" };
  }
}

export async function editFeedback({
  appId,
  feedbackId,
  userId,
  text
}: {
  appId: string;
  feedbackId: string;
  userId: string;
  text: string;
}) {
  try {
    console.log(`Editing feedback: appId=${appId}, feedbackId=${feedbackId}, userId=${userId}`);
    
    // Get the feedback document first to verify ownership
    const feedbackRef = doc(db, 'feedback', feedbackId);
    const feedbackDoc = await getDoc(feedbackRef);
    
    if (!feedbackDoc.exists()) {
      console.error(`Feedback not found: ${feedbackId}`);
      return { success: false, error: 'Feedback not found' };
    }
    
    const feedbackData = feedbackDoc.data();
    
    // Ensure the user owns this feedback
    if (feedbackData.userId !== userId) {
      console.error(`User ${userId} attempted to edit feedback they don't own`);
      return { success: false, error: 'You can only edit your own feedback' };
    }
    
    // Verify the feedback belongs to the right app
    if (feedbackData.appId !== appId) {
      console.error(`Feedback ${feedbackId} does not belong to app ${appId}`);
      return { success: false, error: 'Feedback does not belong to this app' };
    }
    
    // Update the feedback text
    await updateDoc(feedbackRef, {
      comment: text, // Update the comment field that's used in the collection
      updatedAt: serverTimestamp()
    });
    
    console.log(`Feedback edited successfully: ${feedbackId}`);
    revalidatePath(`/apps/${appId}`);
    return { success: true };
  } catch (error) {
    console.error("Error editing feedback:", error);
    return { success: false, error: "Failed to edit feedback" };
  }
}
//pusg test

export async function deleteFeedback({
  appId,
  feedbackId,
  userId
}: {
  appId: string;
  feedbackId: string;
  userId: string;
}) {
  try {
    console.log(`Deleting feedback: appId=${appId}, feedbackId=${feedbackId}, userId=${userId}`);
    
    // Get the feedback document first to verify ownership
    const feedbackRef = doc(db, 'feedback', feedbackId);
    const feedbackDoc = await getDoc(feedbackRef);
    
    if (!feedbackDoc.exists()) {
      console.error(`Feedback not found: ${feedbackId}`);
      return { success: false, error: 'Feedback not found' };
    }
    
    const feedbackData = feedbackDoc.data();
    
    // Ensure the user owns this feedback
    if (feedbackData.userId !== userId) {
      console.error(`User ${userId} attempted to delete feedback they don't own`);
      return { success: false, error: 'You can only delete your own feedback' };
    }
    
    // Verify the feedback belongs to the right app
    if (feedbackData.appId !== appId) {
      console.error(`Feedback ${feedbackId} does not belong to app ${appId}`);
      return { success: false, error: 'Feedback does not belong to this app' };
    }
    
    // Delete the feedback
    await deleteDoc(feedbackRef);
    
    // Update app document to decrement feedback count
    const appRef = doc(db, 'apps', appId);
    await updateDoc(appRef, {
      "ratings.feedback.count": increment(-1)
    });
    
    console.log(`Feedback deleted successfully: ${feedbackId}`);
    revalidatePath(`/apps/${appId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return { success: false, error: "Failed to delete feedback" };
  }
} 