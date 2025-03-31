import { AppVerticalCard } from "@/components/apps/app-vertical-card";
import Link from "next/link";

interface AppGridProps {
  apps: any[];
  sort?: string;
}

export function AppGrid({ apps, sort = 'recent' }: AppGridProps) {
  // Sort apps based on criteria
  const sortedApps = [...apps].sort((a, b) => {
    // Promoted apps come first
    if (a.isPromoted && !b.isPromoted) return -1;
    if (!a.isPromoted && b.isPromoted) return 1;
    
    // Then sort by specified method
    if (sort === 'likes') {
      // Sort by likes count (highest first)
      return (b.likes?.count || 0) - (a.likes?.count || 0);
    } else if (sort === 'name') {
      // Sort by name (A-Z)
      return (a.name || '').localeCompare(b.name || '');
    } else {
      // Default: sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {sortedApps.map(app => (
        <AppVerticalCard key={app._id} app={app} isPromoted={app.isPromoted}>
          <div className="card-actions justify-end mt-2">
            <Link 
              href={`/apps/${app.appId || app.id || app._id}`} 
              className="btn btn-primary btn-sm rounded-full"
            >
              View Details
            </Link>
          </div>
        </AppVerticalCard>
      ))}
      
      {apps.length === 0 && (
        <div className="col-span-full text-center py-16 text-muted-foreground">
          No apps found with the current filters
        </div>
      )}
    </div>
  );
} 