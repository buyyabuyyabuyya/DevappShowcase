"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

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
    pricingModel?: string; // Added pricing model
    likes: {
      count: number;
      users: string[];
    };
  };
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-4">
          {app.iconUrl ? (
            <Image
              src={app.iconUrl}
              alt={app.name}
              width={40}
              height={40}
              className="rounded-lg object-contain"
            />
          ) : (
            <div className="w-10 h-10 bg-muted rounded-lg" />
          )}
          <CardTitle className="line-clamp-1">{app.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2">{app.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`text-xs px-2 py-1 rounded ${
            app.appType === 'api' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-primary/10 text-primary'
          }`}>
            {app.appType.toUpperCase()}
          </span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            {app.category}
          </span>
          {app.pricingModel && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded capitalize">
              {app.pricingModel}
            </span>
          )}
        </div>
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