import { AppVerticalCard } from "@/components/apps/app-vertical-card";
import Link from "next/link";

interface AppGridProps {
  apps: any[];
}

export function AppGrid({ apps }: AppGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {apps.map(app => (
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