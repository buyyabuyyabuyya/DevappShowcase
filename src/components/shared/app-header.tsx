"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { SearchBar } from "@/components/shared/search-bar";

export function AppHeader() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Display loading state until Clerk is fully initialized
  if (!mounted || !isLoaded) {
    return (
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold text-xl">
            DevApp Showcase
          </Link>
          <div className="w-20 h-10 animate-pulse bg-muted rounded"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-xl">
            DevApp Showcase
          </Link>
          <Suspense fallback={null}>
            <SearchBar className="hidden md:block" />
          </Suspense>
        </div>
        
        <div className="flex gap-4 items-center">
          <Suspense fallback={null}>
            <SearchBar className="md:hidden" />
          </Suspense>
          
          {!userId ? (
            <>
              <Button variant="outline" asChild>
                <Link href="https://accounts.devappshowcase.com/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="https://accounts.devappshowcase.com/sign-up">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </>
          )}
        </div>
      </div>
    </header>
  );
} 
