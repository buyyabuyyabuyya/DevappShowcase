"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { promoteApp } from "@/lib/actions/users";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Direct Stripe URL
const STRIPE_URL = "https://buy.stripe.com/8wMcOu43kcAFaxqcMN";

interface PromoteButtonProps {
  appId: string;
  isProUser: boolean;
  isPromoted: boolean;
}

export function PromoteButton({ appId, isProUser, isPromoted }: PromoteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePromoteToggle = async () => {
    if (!isProUser) {
      // Show upgrade toast for non-pro users
      toast({
        title: "Pro subscription required",
        description: "Upgrade to Pro to promote your applications",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await promoteApp(appId);
      if (result.success) {
        toast({
          title: "Success",
          description: isPromoted 
            ? "App promotion has been disabled" 
            : "Your app is now promoted! It will appear at the top of search results.",
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update promotion status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isProUser ? (
        <Button
          variant={isPromoted ? "default" : "outline"}
          size="sm"
          onClick={handlePromoteToggle}
          disabled={isLoading}
          className={isPromoted ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}
        >
          <Sparkles className="h-4 w-4 mr-1" />
          {isPromoted ? "Promoted" : "Promote"}
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link href={STRIPE_URL} target="_blank" rel="noopener noreferrer">
            <Sparkles className="h-4 w-4 mr-1" />
            Promote
          </Link>
        </Button>
      )}
    </>
  );
} 