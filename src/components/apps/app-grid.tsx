import { AppVerticalCard } from "@/components/apps/app-vertical-card";

interface AppGridProps {
  apps: any[];
}

export function AppGrid({ apps }: AppGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {apps.map(app => (
        <AppVerticalCard key={app._id} app={app} isPromoted={app.isPromoted} />
      ))}
      
      {apps.length === 0 && (
        <div className="col-span-full text-center py-16 text-muted-foreground">
          No apps found with the current filters
        </div>
      )}
    </div>
  );
} 