import { App } from "@/types/app";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppGridProps {
  apps: App[];
  sort?: string;
}

export function AppGrid({ apps, sort = 'recent' }: AppGridProps) {
  // Sort apps to show promoted ones first, then by specified sort method
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
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {sortedApps.map((app) => (
        <div 
          key={app._id} 
          className={`w-full bg-card rounded-lg border hover:shadow-lg transition-shadow ${
            app.isPromoted ? "border-primary/30 bg-primary/5" : ""
          }`}
        >
          <div className="flex items-center justify-between p-6">
            {/* Left: Icon and Title/Description */}
            <div className="flex items-start gap-4 flex-grow">
              {app.iconUrl && (
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={app.iconUrl}
                    alt={app.name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-grow max-w-xl">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xl leading-none tracking-tight">
                    {app.name}
                  </h3>
                  {app.isPromoted && (
                    <span className="inline-flex items-center rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Promoted
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground line-clamp-2 mt-2">
                  {app.description}
                </p>
              </div>
            </div>

            {/* Middle: Categories */}
            <div className="flex items-center gap-2 mx-6">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                {app.appType}
              </span>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                {app.category}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{app.likes?.count || 0}</span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/apps/${app.appId || app.id || app._id}`}>
                  View Details
                </Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <a href={app.liveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visit
                </a>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 