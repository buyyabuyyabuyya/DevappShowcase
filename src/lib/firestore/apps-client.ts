import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, 
  query, where, orderBy, limit
} from 'firebase/firestore';

// Client-safe version of apps.ts - without server-only imports
// This only includes functions needed by client components

/**
 * Search for apps matching a search term
 * This is a client-safe version that doesn't use auth() or other server-only imports
 */
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

/**
 * Get a specific app by ID
 * This is a client-safe version that doesn't use auth() or other server-only imports
 */
export async function getAppById(id: string) {
  try {
    const appDoc = await getDoc(doc(db, 'apps', id));
    
    if (appDoc.exists()) {
      const appData = appDoc.data();
      
      // Format dates for serialization
      const formattedData = {
        ...appData,
        createdAt: appData.createdAt?.toDate?.() || null,
        updatedAt: appData.updatedAt?.toDate?.() || null
      };
      
      return { 
        success: true, 
        app: { id: appDoc.id, ...formattedData } 
      };
    }
    
    return { success: false, error: "App not found" };
  } catch (error) {
    console.error("Error fetching app:", error);
    return { success: false, error: "Failed to fetch app" };
  }
}
