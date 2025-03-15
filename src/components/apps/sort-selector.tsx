"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SortSelector({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const handleSortChange = (value: string) => {
    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());
    
    // Set the sort parameter
    params.set("sort", value);
    
    // Replace the URL without scrolling to top
    router.replace(`${pathname}?${params.toString()}`, { 
      scroll: false 
    });
  };
  
  return (
    <Select value={currentSort} onValueChange={handleSortChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Most Recent" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">Most Recent</SelectItem>
        <SelectItem value="liked">Most Liked</SelectItem>
        <SelectItem value="name">Name (A-Z)</SelectItem>
      </SelectContent>
    </Select>
  );
} 