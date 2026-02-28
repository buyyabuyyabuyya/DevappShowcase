import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppVerticalCard } from "@/components/apps/app-vertical-card";
import { ChevronRight } from "lucide-react";

interface AppCategorySectionProps {
  title: string;
  apps: any[];
  viewAllHref: string;
  isPromoted?: boolean;
  totalCount?: number;
}

export function AppCategorySection({ 
  title, 
  apps, 
  viewAllHref,
  isPromoted,
  totalCount
}: AppCategorySectionProps) {
  const displayApps = apps.slice(0, 8);
  const shownCount = typeof totalCount === "number" ? totalCount : apps.length;
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-medium flex items-center">
          {title}
          <span className="text-muted-foreground ml-2 text-sm">
            ({shownCount})
          </span>
        </h3>
        
        <Button variant="ghost" size="sm" asChild>
          <Link href={viewAllHref} className="flex items-center">
            See All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-flow-col auto-cols-max gap-4 overflow-x-auto pb-4 snap-x scrollbar-thin">
        {displayApps.map(app => (
          <div key={app.id} className="snap-start">
            <AppVerticalCard app={app} isPromoted={isPromoted} />
          </div>
        ))}
        
        {apps.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No apps found in this category
          </div>
        )}
      </div>
    </div>
  );
} 
