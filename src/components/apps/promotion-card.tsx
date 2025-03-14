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
import { UpgradeButton } from "@/components/shared/upgrade-button";
import { useProStatus } from "@/context/pro-status-provider";

// Direct Stripe URL
const STRIPE_URL = "https://buy.stripe.com/28o29Q2Zg1W19tmcMO";

interface PromotionCardProps {
  appId: string;
  isProUser?: boolean;
  isAppPromoted?: boolean;
}

export function PromotionCard({ appId, isProUser = false, isAppPromoted = false }: PromotionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isPro } = useProStatus();
  
  // Use isPro from context, falling back to isProUser prop
  const userIsPro = isPro || isProUser;

  // If user is Pro, all apps are automatically promoted
  if (userIsPro) return null;
  
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
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          App Promotion
        </CardTitle>
        <CardDescription>
          Get more visibility for your application
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            {userIsPro ? (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg flex items-center gap-3 border border-blue-100 dark:border-blue-900 w-full">
                <div className="bg-blue-500 rounded-full p-2 text-white">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Pro Subscription Active</h3>
                  <p className="text-sm text-muted-foreground">
                    All your apps are automatically promoted in search results.
                  </p>
                </div>
              </div>
            ) : (
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
            )}
            
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
          
          {userIsPro && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm mb-2">
                <strong>Pro benefit:</strong> All your apps are automatically promoted to the top of search results with a "Promoted" badge.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-2">
        {userIsPro ? (
          <Button variant="outline" disabled>
            <Check className="h-4 w-4 mr-2" />
            Auto-Promoted with Pro
          </Button>
        ) : (
          <UpgradeButton>
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Pro - ${PRO_SUBSCRIPTION.PRICE}
          </UpgradeButton>
        )}
      </CardFooter>
    </Card>
  );
} 