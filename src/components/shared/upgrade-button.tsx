"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { upgradeToProUser } from "@/lib/firestore/users";
import { useProStatus } from "@/context/pro-status-provider";

// Direct Stripe URL as fallback
const STRIPE_URL = "https://buy.stripe.com/28o29Q2Zg1W19tmcMO";

interface UpgradeButtonProps {
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function UpgradeButton({ 
  variant = "default", 
  size = "default",
  className = "",
  children,
  onClick
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { isPro } = useProStatus();

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
      // Just use the direct Stripe URL instead of the upgradeToProUser function
      // which requires a userId and doesn't return a URL
      window.location.href = STRIPE_URL;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      window.location.href = STRIPE_URL;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={() => window.open(STRIPE_URL, '_blank')}
      disabled={isLoading}
      className={className}
    >
      {children || (
        <>
          Upgrade to Pro {variant !== "outline" && <Sparkles className="ml-2 h-4 w-4" />}
        </>
      )}
    </Button>
  );
} 