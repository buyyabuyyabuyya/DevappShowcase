"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appTypes } from "@/lib/constants";

const sortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "likes", label: "Most Liked" },
  { value: "name", label: "Name (A-Z)" },
];

const filterOptions = [
  { value: "all", label: "All Types" },
  { value: "website", label: "Website" },
  { value: "mobile", label: "Mobile App" },
  { value: "desktop", label: "Desktop Application" },
  { value: "extension", label: "Browser Extension" },
  { value: "api", label: "API" },
  { value: "ai", label: "AI" }
];

export function AppFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onFilterChange(value: string, type: 'sort' | 'type') {
    if (type === 'type' && value.toLowerCase() === 'all') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('type');
      const queryString = params.toString();
      router.push(queryString ? `/apps?${queryString}` : '/apps');
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set(type, value.toLowerCase());
      router.push(`/apps?${params.toString()}`);
    }
  }

  return (
    <div className="flex gap-4 justify-end">
      <Select
        onValueChange={(value: string) => onFilterChange(value, 'type')}
        defaultValue={searchParams.get('type') || 'all'}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        onValueChange={(value: string) => onFilterChange(value, 'sort')}
        defaultValue={searchParams.get('sort') || 'recent'}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 