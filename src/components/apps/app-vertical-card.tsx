"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AppVerticalCardProps {
  app: {
    _id: string;
    name: string;
    description: string;
    appType: string;
    category: string;
    iconUrl?: string;
    liveUrl?: string;
    pricingModel?: string;
    likes: {
      count: number;
      users: string[];
    };
  };
  isPromoted?: boolean;
}

export function AppVerticalCard({ app, isPromoted }: AppVerticalCardProps) {
  return (
    <Card 
      className={cn(
        "w-48 h-72 flex flex-col overflow-hidden",
        isPromoted && "border-primary/50 shadow-md"
      )}
    >
      <div className="relative h-24 bg-gradient-to-r from-primary/10 to-primary/5">
        {app.iconUrl ? (
          <Image
            src={app.iconUrl}
            alt={app.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary/20">
              {app.name.charAt(0)}
            </span>
          </div>
        )}
        
        {isPromoted && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
            Featured
          </div>
        )}
      </div>
      
      <CardContent className="flex-grow p-3">
        <h3 className="font-semibold line-clamp-1 mb-1">{app.name}</h3>
        
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            {app.appType}
          </span>
          
          {app.pricingModel && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
              {app.pricingModel}
            </span>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-3">
          {app.description}
        </p>
      </CardContent>
      
      <CardFooter className="p-3 pt-0 flex flex-col gap-2">
        <div className="flex items-center gap-1 self-start">
          <Heart className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {app.likes?.count || 0}
          </span>
        </div>
        
        <div className="flex gap-2 w-full">
          <Button size="sm" className="w-full text-xs" asChild>
            <Link href={`/apps/${app._id}`}>
              View
            </Link>
          </Button>
          
          {app.liveUrl && (
            <Button size="sm" variant="outline" className="px-2" asChild>
              <Link href={app.liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 