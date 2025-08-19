"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppVerticalCardProps {
  app: {
    id: string;
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
    isPromoted?: boolean;
  };
  isPromoted?: boolean;
  children?: React.ReactNode;
}

export function AppVerticalCard({ app, isPromoted, children }: AppVerticalCardProps) {
  // Use client-side state instead of directly accessing app properties
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted before rendering dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className={cn(
      "w-[220px] h-[380px] shadow-md transition-all overflow-hidden flex flex-col",
      isPromoted && "border-amber-400 bg-amber-50/30 dark:bg-amber-950/10"
    )}>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <div className="w-full h-[120px] relative bg-muted flex items-center justify-center p-2">
          {mounted && app.iconUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={app.iconUrl}
                alt={app.name}
                className="object-contain max-h-full max-w-full"
                width={100}
                height={100}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {app.name.charAt(0)}
            </div>
          )}
          
          {isPromoted && (
            <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 text-xs font-semibold px-2 py-0.5 rounded-full">
              Featured
            </div>
          )}
        </div>
        
        <div className="p-4 space-y-2 overflow-hidden">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-sm line-clamp-2">{app.name}</h3>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted whitespace-nowrap">
              {app.appType}
            </span>
          </div>
          
          {app.pricingModel && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {app.pricingModel}
              </span>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground line-clamp-4">
            {app.description}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-col gap-2 mt-auto">
        <div className="flex items-center text-muted-foreground">
          <Heart className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">
            {mounted ? app.likes?.count || 0 : '...'}
          </span>
        </div>
        
        <div className="flex gap-2 w-full">
          {!children && (
            <Button size="sm" className="w-full text-xs" asChild>
              <Link href={`/apps/${app.id}`}>
                View Details
              </Link>
            </Button>
          )}
          
          {children}
          
          {mounted && app.liveUrl && (
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