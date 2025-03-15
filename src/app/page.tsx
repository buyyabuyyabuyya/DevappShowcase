import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AppFilters } from "@/components/apps/app-filters";
import { getApps } from "@/lib/actions/apps";
import { AppCategorySection } from "@/components/apps/app-category-section";
import { cn } from "@/lib/utils";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedApps } from "@/components/home/featured-apps";

// App type colors for visual distinction
const appTypeColors: Record<string, string> = {
  website: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  mobile: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
  desktop: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
  api: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  ai: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
  extension: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800"
};

export default async function HomePage({ searchParams }: { searchParams: { sort?: string } }) {
  const { userId } = auth();
  const { sort = "recent" } = searchParams;
  const result = await getApps({ sort });
  
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
    <main>
      <HeroSection />
      <FeaturedApps />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-12">
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
            <div 
              key={type} 
              className={cn(
                "mb-16 pt-6 pb-8 px-6 rounded-lg border", 
                appTypeColors[type]
              )}
            >
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold capitalize">
                  {type} 
                  <span className="text-muted-foreground ml-2 text-lg font-normal">
                    Apps
                  </span>
                </h2>
                <div className="ml-3 h-1 w-full rounded-full bg-muted"></div>
              </div>
              
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
              
              {organizedApps[type].promoted.length === 0 && 
               organizedApps[type].regular.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  No {type} apps available yet
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </main>
  );
}