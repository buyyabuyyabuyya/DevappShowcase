"use client";

import { Check, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useProStatus } from "@/context/pro-status-provider";
import { UpgradeButton } from "@/components/shared/upgrade-button";

interface PromoFeature {
  feature: string;
  included: boolean;
}

// Use the direct Stripe URL
const STRIPE_URL = "https://buy.stripe.com/test_8wMdRDeo88p6f4scMM";

const promoFeatures: PromoFeature[] = [
  { feature: "Featured placement on homepage", included: true },
  { feature: "Priority in search results", included: true },
  { feature: "Special promotion badge", included: true },
  { feature: "Analytics dashboard", included: true }
];

export function PromoteAppSection() {
  const { isPro } = useProStatus();
  
  // Don't render the promotion section if user is already Pro
  if (isPro) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center py-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-md flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">PRO ACTIVE</span>
          </div>
          <p className="text-muted-foreground">
            Your apps are automatically promoted across the platform
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Promote Your App</h3>
        <p className="text-muted-foreground">
          Increase visibility and reach more users
        </p>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">$14.99</span>
        <span className="text-muted-foreground line-through">$20.00</span>
        <span className="text-sm text-green-600 font-medium">25% OFF</span>
        <span className="text-xs text-muted-foreground">(one-time purchase)</span>
      </div>

      <ul className="space-y-3">
        {promoFeatures.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.included ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
            <span>{item.feature}</span>
          </li>
        ))}
      </ul>

      <div className="pt-4">
        <UpgradeButton className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          Promote All Your Apps
        </UpgradeButton>
      </div>
    </Card>
  );
} 