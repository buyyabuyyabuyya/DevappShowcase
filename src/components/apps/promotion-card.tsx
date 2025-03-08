"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X } from "lucide-react";
import { PRO_SUBSCRIPTION } from "@/lib/constants";
import { upgradeToProUser, promoteApp } from "@/lib/actions/users";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Direct Stripe URL
const STRIPE_URL = "https://buy.stripe.com/8wMcOu43kcAFaxqcMN";

interface PromotionCardProps {
  appId: string;
  isProUser: boolean;
  isAppPromoted: boolean;
}

export function PromotionCard({ appId, isProUser, isAppPromoted }: PromotionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpgradeClick = async () => {
    setIsLoading(true);
    try {
      // This will redirect to Stripe
      const response = await upgradeToProUser();
      if (response.url) {
        router.push(response.url);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate upgrade process.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteClick = async () => {
    setIsLoading(true);
    try {
      const result = await promoteApp(appId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Your app is now promoted! It will appear at the top of search results.",
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to promote app",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {isProUser ? "Promote Your App" : "Upgrade to Pro"}
        </CardTitle>
        <CardDescription>
          {isProUser 
            ? "Make your app stand out from the crowd!" 
            : "Unlock premium features and promote your apps"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Free User</h3>
              <ul className="space-y-1">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Post up to 3 apps</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>500 character descriptions</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <X className="h-4 w-4 text-red-500 mt-0.5" />
                  <span>Standard listing position</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Pro User</h3>
              <ul className="space-y-1">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Unlimited app postings</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>2000 character descriptions</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Priority listing with badge</span>
                </li>
              </ul>
            </div>
          </div>
          
          {isProUser && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm mb-2">
                <strong>Promote this app</strong> to have it appear at the top of search results with a "Promoted" badge.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-2">
        {isProUser ? (
          isAppPromoted ? (
            <Button variant="outline" disabled>
              <Check className="h-4 w-4 mr-2" />
              Currently Promoted
            </Button>
          ) : (
            <Button onClick={handlePromoteClick} disabled={isLoading}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isLoading ? "Processing..." : "Promote This App"}
            </Button>
          )
        ) : (
          <Button asChild>
            <Link href={STRIPE_URL}>
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Pro - ${PRO_SUBSCRIPTION.MONTHLY_PRICE}/month
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 