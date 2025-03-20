import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { getUserById } from "@/lib/firestore/users";

// Use the same Stripe URL defined elsewhere in your app
const STRIPE_URL = "https://buy.stripe.com/28o29Q2Zg1W19tmcMO";

export async function HeroSection() {
  // Get current user authentication status
  const { userId } = auth();
  
  // Initialize isPro as false
  let isPro = false;
  
  // If user is authenticated, check their Pro status
  if (userId) {
    const { user } = await getUserById(userId);
    isPro = (user as any)?.isPro || false;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/30 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            DevApp Showcase
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground">
            Discover amazing developer projects and applications
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/dashboard/list-app">
                Showcase Your App
              </Link>
            </Button>
            
            {!isPro && (
              <Button size="lg" variant="outline" asChild>
                <Link href={STRIPE_URL} target="_blank" rel="noopener noreferrer">
                  Upgrade to Pro <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
          
          <div className="pt-8 flex justify-center gap-8 sm:gap-16">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">50+</span>
              <span className="text-sm text-muted-foreground">Projects</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">2k+</span>
              <span className="text-sm text-muted-foreground">Visitors</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">40+</span>
              <span className="text-sm text-muted-foreground">Pro Developers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 