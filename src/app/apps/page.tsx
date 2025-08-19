import { getApps } from "@/lib/firestore/apps";
import { AppGrid } from "@/components/shared/app-grid";
import { AppFilters } from "@/components/apps/app-filters";
import { LoadMoreButton } from "@/components/shared/load-more-button";

interface AppsPageProps {
  searchParams: {
    type?: string;
    featured?: string;
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  };
}

export default async function AppsPage({ searchParams }: AppsPageProps) {
  const { type, featured, category, search, sort = 'recent', page = '1' } = searchParams;
  const currentPage = parseInt(page) || 1;
  const appsPerPage = 10;

  // Build constraints for server-side query to avoid fetching entire collection
  const isPromoted = featured === 'true' ? true : undefined;
  const initialResult = await getApps({
    appType: type,
    isPromoted,
    limitCount: currentPage * appsPerPage, // Fetch enough apps for current page
  });

  const apps = initialResult.success ? initialResult.apps || [] : [];

  // Additional filters that are not indexed can be applied client-side
  let filteredApps = [...apps] as any[];

  if (category) {
    filteredApps = filteredApps.filter(app => app.category === category);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredApps = filteredApps.filter(app =>
      (app.name || '').toLowerCase().includes(searchLower) ||
      (app.description || '').toLowerCase().includes(searchLower)
    );
  }

  // Calculate pagination info
  const totalApps = filteredApps.length;
  const hasMore = totalApps > currentPage * appsPerPage;
  const nextPage = currentPage + 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {featured === 'true' ? 'Featured Apps' : 'All Apps'}
        {type && ` - ${type.charAt(0).toUpperCase() + type.slice(1)}`}
      </h1>

      <AppFilters />

      <AppGrid 
        apps={filteredApps} 
        sort={sort} 
        page={currentPage}
        appsPerPage={appsPerPage}
      />

      {hasMore && (
        <div className="mt-8 text-center">
          <LoadMoreButton 
            currentPage={currentPage}
            nextPage={nextPage}
            searchParams={searchParams}
          />
        </div>
      )}

      {filteredApps.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No apps found</p>
          <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
} 