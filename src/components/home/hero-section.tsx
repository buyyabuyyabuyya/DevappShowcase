import { auth } from "@clerk/nextjs/server";
import { getUserById } from "@/lib/firestore/users";
import { HeroSectionClient } from "./hero-section-client";

// Use the same Stripe URL defined elsewhere in your app
const STRIPE_URL = "https://buy.stripe.com/28o29Q2Zg1W19tmcMO";

export async function HeroSection() {
  // Get current user authentication status
  const session = await auth();
  const userId = session?.userId || null;
  
  // Initialize isPro as false
  let isPro = false;
  
  if (userId) {
    try {
      // Try to get user data from Firestore
      const userData = await getUserById(userId);
      // Update isPro if the user exists and has pro status
      if (userData.success && userData.user) {
        // Use optional chaining and type assertion to safely access isPro
        isPro = (userData.user as any)?.isPro || false;
      }
    } catch (error) {
      console.error("Error fetching user data for Hero section:", error);
    }
  }

  // Pass the server-fetched isPro status to the client component
  return <HeroSectionClient initialIsPro={isPro} />;
} 