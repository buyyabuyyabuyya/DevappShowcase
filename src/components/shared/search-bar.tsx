"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchSuggestions } from "@/components/shared/search-suggestions";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  placeholder = "Search apps, libraries, tools...", 
  className = "" 
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Handle clicking outside to collapse search on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchTerm.trim()) {
      router.push(`/apps?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  }
  
  function clearSearch() {
    setSearchTerm("");
    inputRef.current?.focus();
  }
  
  return (
    <div 
      ref={searchRef}
      className={`relative ${className}`}
    >
      {/* Mobile search icon */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Search bar - always visible on desktop, conditionally on mobile */}
      <div className={`
        absolute md:relative right-0 top-full md:top-auto z-50
        w-[calc(100vw-2rem)] md:w-auto
        mt-2 md:mt-0
        transition-all duration-200
        ${isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none md:opacity-100 md:scale-100 md:pointer-events-auto"}
      `}>
        <form 
          onSubmit={handleSubmit}
          className="relative"
        >
          <div className="flex items-center h-10 w-full md:w-[400px] lg:w-[600px] max-w-full rounded-md border border-input bg-background ring-offset-background">
            <div className="px-3 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder={placeholder}
              className="flex-1 h-full bg-transparent outline-none text-sm"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={clearSearch}
                className="pr-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <SearchSuggestions 
            searchTerm={searchTerm}
            isVisible={showSuggestions && !!searchTerm}
            onSelect={() => setShowSuggestions(false)}
          />
        </form>
      </div>
    </div>
  );
} 