import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AppFilters } from "@/components/apps/app-filters";
import { getApps } from "@/lib/actions/apps";
import { AppCategorySection } from "@/components/apps/app-category-section";

export default async function Home() {
  const { userId } = auth();
  const result = await getApps();
  
  // Safely handle apps, ensuring it's always an array
  const apps = Array.isArray(result.apps) ? result.apps : [];
  
  // Organize apps by type and promotion status
  const appTypes = ['website', 'mobile', 'desktop', 'api', 'ai', 'extension'];
  const organizedApps = appTypes.reduce((acc, type) => {
    const typeApps = apps.filter((app: any) => app.appType === type);
    
    acc[type] = {
      promoted: typeApps.filter((app: any) => app.isPromoted),
      regular: typeApps.filter((app: any) => !app.isPromoted)
    };
    
    return acc;
  }, {} as Record<string, { promoted: any[], regular: any[] }>);

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
        
        {appTypes.map(type => (
          <div key={type} className="mb-12">
            <h2 className="text-2xl font-semibold capitalize mb-4">{type} Apps</h2>
            
            {organizedApps[type].promoted.length > 0 && (
              <AppCategorySection 
                title="Featured"
                apps={organizedApps[type].promoted}
                viewAllHref={`/apps?type=${type}&featured=true`}
                isPromoted
              />
            )}
            
            {organizedApps[type].regular.length > 0 && (
              <AppCategorySection 
                title="All"
                apps={organizedApps[type].regular}
                viewAllHref={`/apps?type=${type}`}
              />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}