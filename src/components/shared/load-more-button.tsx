"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface LoadMoreButtonProps {
  currentPage: number;
  nextPage: number;
  searchParams: Record<string, string | string[] | undefined>;
}

export function LoadMoreButton({ currentPage, nextPage, searchParams }: LoadMoreButtonProps) {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParamsHook.toString());
    params.set('page', nextPage.toString());
    
    // Preserve all existing search params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'page' && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
    });
    
    router.push(`/apps?${params.toString()}`);
  };

  return (
    <Button 
      onClick={handleLoadMore}
      variant="outline"
      size="lg"
      className="flex items-center gap-2"
    >
      Load More Apps
      <ChevronDown className="h-4 w-4" />
      <span className="text-sm text-muted-foreground ml-2">
        Page {nextPage}
      </span>
    </Button>
  );
} 