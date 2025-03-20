"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { searchApps } from "@/lib/firestore/apps";

interface SearchSuggestionsProps {
  searchTerm: string;
  isVisible: boolean;
  onSelect: () => void;
}

export function SearchSuggestions({ 
  searchTerm, 
  isVisible, 
  onSelect 
}: SearchSuggestionsProps) {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    async function fetchResults() {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const data = await searchApps(debouncedSearchTerm);
        setResults(data.slice(0, 5)); // Limit to 5 suggestions
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchResults();
  }, [debouncedSearchTerm]);
  
  if (!isVisible || (!isLoading && results.length === 0)) {
    return null;
  }
  
  return (
    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg overflow-hidden">
      {isLoading ? (
        <div className="p-4 text-sm text-muted-foreground">Searching...</div>
      ) : (
        <>
          <ul className="max-h-[400px] overflow-y-auto">
            {results.map((app) => (
              <li key={app.id}>
                <Link 
                  href={`/apps/${app.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                  onClick={onSelect}
                >
                  {app.iconUrl ? (
                    <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                      <Image 
                        src={app.iconUrl} 
                        alt={app.name} 
                        width={40} 
                        height={40}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">
                        {app.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-sm">{app.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {app.description}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="p-2 border-t bg-muted/30">
            <Link
              href={`/apps?search=${encodeURIComponent(searchTerm)}`}
              className="block w-full text-center text-sm text-primary hover:underline py-1"
              onClick={onSelect}
            >
              View all results
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 