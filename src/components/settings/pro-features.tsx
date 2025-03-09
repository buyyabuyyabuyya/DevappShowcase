"use client";

import { APP_LIMITS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CheckIcon, Sparkles } from "lucide-react";
import { useProStatus } from "@/context/pro-status-provider";
import { UpgradeButton } from "@/components/shared/upgrade-button";

export function ProFeatures() {
  const { isPro } = useProStatus();

  return (
    <div className="rounded-lg border p-6 mt-6">
      <h3 className="text-lg font-medium mb-2">
        {isPro ? "Pro Plan Active" : "Upgrade to Pro"}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {isPro
          ? "You currently have access to all premium features."
          : "Unlock premium features to showcase your apps better."}
      </p>
      <ul className="space-y-2 mb-6">
        <li className="flex items-center text-sm">
          <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
          Unlimited app submissions
        </li>
        <li className="flex items-center text-sm">
          <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
          Featured placement in showcase
        </li>
        <li className="flex items-center text-sm">
          <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
          Priority support
        </li>
        <li className="flex items-center text-sm">
          <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
          Advanced analytics
        </li>
      </ul>
      {!isPro && (
        <UpgradeButton className="w-full">
          Upgrade to Pro <Sparkles className="ml-2 h-4 w-4" />
        </UpgradeButton>
      )}
    </div>
  );
} 