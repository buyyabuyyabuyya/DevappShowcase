import { db } from '../firebase';
import { 
  doc, getDoc, collection, 
  query, where, orderBy, getDocs
} from 'firebase/firestore';

// Client-safe version of getAppFeedback (without server imports)
export async function getAppFeedback(appId: string) {
  try {
    // Check if appId is valid
    if (!appId) {
      return { success: false, error: "Invalid app ID" };
    }
    
    // Get the app document first to verify it exists
    const appDoc = await getDoc(doc(db, 'apps', appId));
    if (!appDoc.exists()) {
      return { success: false, error: "App not found" };
    }
    
    // Get all feedback for this app
    const feedbackQuery = query(
      collection(db, 'apps', appId, 'feedback'),
      orderBy('createdAt', 'desc')
    );
    
    const feedbackSnapshot = await getDocs(feedbackQuery);
    const feedback = feedbackSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        appId,
        userId: data.userId,
        userName: data.userName || "Anonymous User",
        userImageUrl: data.userImage || undefined,
        comment: data.text, // Map text to comment as required by interface
        text: data.text,    // Keep text too since some components might use it
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date()
      };
    });
    
    return { success: true, feedback };
  } catch (error) {
    console.error("Error getting app feedback:", error);
    return { success: false, error: "Failed to get feedback" };
  }
}
