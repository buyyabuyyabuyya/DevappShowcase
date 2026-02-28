import { AppFilters } from "@/components/apps/app-filters";
import { getApps } from "@/lib/firestore/apps";
import { AppCategorySection } from "@/components/apps/app-category-section";
import { cn } from "@/lib/utils";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedApps } from "@/components/home/featured-apps";
import { Suspense } from "react";

export const revalidate = 300;

// App type colors for visual distinction
const appTypeColors: Record<string, string> = {
  website: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  mobile: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
  desktop: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
  api: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  ai: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
  extension: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800"
};

export default async function HomePage() {
  const appTypes = ['website', 'mobile', 'desktop', 'api', 'ai', 'extension'];
  const sectionLimit = 12;
  const promotedPoolLimit = 24;

  // Keep homepage reads small to avoid slow origin responses and Firestore overfetch.
  const [promotedResult, ...typeResults] = await Promise.all([
    getApps({ isPromoted: true, limitCount: promotedPoolLimit }),
    ...appTypes.map(type => getApps({ appType: type, limitCount: sectionLimit }))
  ]);

  const allPromotedApps = (promotedResult.success && Array.isArray(promotedResult.apps)) ? promotedResult.apps : [];
  const featuredApps = allPromotedApps.slice(0, 6);

  // Organize per-type results and ensure promoted apps are only shown in Featured section
  const organizedApps = appTypes.reduce((acc, type, idx) => {
    const res = typeResults[idx];
    const list = (res && res.success && Array.isArray(res.apps)) ? res.apps : [];
    
    // Get promoted apps for this specific type (for Featured section only)
    const typePromoted = allPromotedApps
      .filter((app: any) => app.appType === type)
      .slice(0, 6);
    
    // Regular apps only (exclude promoted ones to avoid duplication)
    const regularApps = list.filter((app: any) => !app.isPromoted);
    
    acc[type] = {
      promoted: typePromoted,
      regular: regularApps,
      all: regularApps.slice(0, sectionLimit) // Only show regular apps in "All" section
    };
    return acc;
  }, {} as Record<string, { promoted: any[], regular: any[], all: any[] }>);

  return (
    <main>
      <HeroSection />
      <FeaturedApps initialApps={featuredApps} />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-6">DevApp Showcase</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover amazing developer projects and applications
            </p>
          </div>

          <Suspense fallback={null}>
            <AppFilters />
          </Suspense>

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

              {organizedApps[type].all.length > 0 ? (
                <AppCategorySection
                  title="All"
                  apps={organizedApps[type].all}
                  viewAllHref={`/apps?type=${type}`}
                />
              ) : (
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
