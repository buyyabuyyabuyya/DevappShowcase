import { db } from './firebase';
import { 
  collection, doc, setDoc, getDoc, 
  getDocs, updateDoc, deleteDoc, query, 
  where, limit, orderBy, DocumentData
} from 'firebase/firestore';

// User operations
export async function getUser(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, user: userSnap.data() };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function createUser(userId: string, userData: DocumentData) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPro: false,
      appCount: 0
    });
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}