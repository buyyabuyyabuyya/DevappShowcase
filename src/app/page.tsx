import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AppGrid } from "@/components/shared/app-grid";
import { AppFilters } from "@/components/apps/app-filters";
import { getApps } from "@/lib/actions/apps";

export default async function HomePage({ searchParams }: { 
  searchParams?: { type?: string; sort?: string; } 
}) {
  const { userId } = auth();
  const apps = await getApps(searchParams);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6">DevApp Showcase</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discover amazing developer projects and applications
          </p>
          
          {!userId && (
            <div className="flex gap-4 justify-center mb-8">
              <Button asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
        
        <AppFilters />
        
        <Suspense fallback={<div>Loading apps...</div>}>
          <AppGrid apps={apps} />
        </Suspense>
      </div>
    </main>
  );
}