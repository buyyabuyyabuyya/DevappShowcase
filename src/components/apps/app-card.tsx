"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { pricingTypes } from "@/lib/constants";


// Stripe URL for Pro upgrade
const STRIPE_URL = "https://buy.stripe.com/8wMcOu43kcAFaxqcMN";

interface AppCardProps {
  app: {
    _id: string;
    name: string;
    description: string;
    appType: string;
    category: string;
    iconUrl?: string;
    pricingModel?: string;
    pricing?: string;
    likes: {
      count: number;
      users: string[];
    };
  };
}

export function AppCard({ app }: AppCardProps) {
  // Get pricing badge color based on model
  function getPricingColor(model?: string) {
    switch (model) {
      case 'free':
        return 'bg-green-500/10 text-green-500';
      case 'paid':
        return 'bg-blue-500/10 text-blue-500';
      case 'freemium':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center gap-4">
          {app.iconUrl && (
            <Image
              src={app.iconUrl}
              alt={app.name}
              width={48}
              height={48}
              className="rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{app.name}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{app.category}</Badge>
              <Badge variant="secondary">{app.appType}</Badge>
              {app.pricingModel && (
                <Badge className={getPricingColor(app.pricingModel.toLowerCase())}>
                  {pricingTypes.find(p => p.value === app.pricingModel)?.label || app.pricingModel}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2">{app.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm">
          <Heart className="w-4 h-4 mr-1" />
          {app.likes.count}
        </Button>
        <Button asChild>
          <Link href={`/apps/${app._id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 