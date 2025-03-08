"use client";

import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PromoFeature {
  feature: string;
  included: boolean;
}

// Use the direct Stripe URL
const STRIPE_URL = "https://buy.stripe.com/8wMcOu43kcAFaxqcMN";

const promoFeatures: PromoFeature[] = [
  { feature: "Featured placement on homepage", included: true },
  { feature: "Priority in search results", included: true },
  { feature: "Special promotion badge", included: true },
  { feature: "Analytics dashboard", included: true }
];

export function PromoteAppSection() {
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
        <Button className="w-full" asChild>
          <Link href={STRIPE_URL} target="_blank" rel="noopener noreferrer">
            Promote App
          </Link>
        </Button>
      </div>
    </Card>
  );
} 