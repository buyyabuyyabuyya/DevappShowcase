"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { upgradeToProUser } from "@/lib/firestore/users-client";
import { useProStatus } from "@/context/pro-status-provider";
import { useRouter } from "next/navigation";

// Direct Stripe URL as fallback
const STRIPE_URL = "https://buy.stripe.com/28o29Q2Zg1W19tmcMO";

interface UpgradeButtonProps {
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}
//test for push the stipe endporiont 
export function UpgradeButton({ 
  variant = "default", 
  size = "default",
  className = "",
  children,
  onClick
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { isPro } = useProStatus();
  const router = useRouter();

  // Don't render if user is already Pro
  if (isPro) return null;

  async function handleUpgrade() {
    if (onClick) {
      // If a custom onClick handler is provided, use it
      onClick();
      return;
    }

    setIsLoading(true);
    try {
      // Call our checkout API endpoint instead of using a direct URL
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      // Fallback to direct URL if API fails
      window.location.href = STRIPE_URL;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleUpgrade}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : children || (
        <>
          Upgrade to Pro {variant !== "outline" && <Sparkles className="ml-2 h-4 w-4" />}
        </>
      )}
    </Button>
  );
} 