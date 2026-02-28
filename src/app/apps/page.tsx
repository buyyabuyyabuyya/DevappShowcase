import { getApps, getAppsCount } from "@/lib/firestore/apps";
import { AppGrid } from "@/components/shared/app-grid";
import { AppFilters } from "@/components/apps/app-filters";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 300;

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
  const appsPerPage = 8;

  // Build constraints for server-side query to avoid fetching entire collection
  const isPromoted = featured === 'true' ? true : undefined;
  const [initialResult, countResult] = await Promise.all([
    getApps({
      appType: type,
      isPromoted,
      limitCount: currentPage * appsPerPage, // Fetch enough apps for current page
    }),
    getAppsCount({
      appType: type,
      isPromoted,
    }),
  ]);

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
  const totalApps =
    category || search
      ? filteredApps.length
      : (countResult.success ? countResult.count : filteredApps.length);
  const totalPages = Math.max(1, Math.ceil(totalApps / appsPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (featured) params.set('featured', featured);
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (sort && sort !== 'recent') params.set('sort', sort);
    if (targetPage > 1) params.set('page', String(targetPage));
    const queryString = params.toString();
    return queryString ? `/apps?${queryString}` : '/apps';
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, idx) => idx + 1).filter((pageNumber) => (
    pageNumber === 1 ||
    pageNumber === totalPages ||
    Math.abs(pageNumber - safeCurrentPage) <= 2
  ));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {featured === 'true' ? 'Featured Apps' : 'All Apps'}
        {type && ` - ${type.charAt(0).toUpperCase() + type.slice(1)}`}
      </h1>

      <Suspense fallback={null}>
        <AppFilters />
      </Suspense>

      <AppGrid 
        apps={filteredApps} 
        sort={sort} 
        page={safeCurrentPage}
        appsPerPage={appsPerPage}
      />

      {totalPages > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {safeCurrentPage <= 1 ? (
            <Button variant="outline" size="sm" disabled>Previous</Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPageHref(safeCurrentPage - 1)}>Previous</Link>
            </Button>
          )}

          {pageNumbers.map((pageNumber, idx) => {
            const previous = pageNumbers[idx - 1];
            const showEllipsis = previous && pageNumber - previous > 1;

            return (
              <div key={pageNumber} className="flex items-center gap-2">
                {showEllipsis && <span className="text-muted-foreground">...</span>}
                <Button
                  size="sm"
                  variant={pageNumber === safeCurrentPage ? "default" : "outline"}
                  asChild
                >
                  <Link href={buildPageHref(pageNumber)}>{pageNumber}</Link>
                </Button>
              </div>
            );
          })}

          {safeCurrentPage >= totalPages ? (
            <Button variant="outline" size="sm" disabled>Next</Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPageHref(safeCurrentPage + 1)}>Next</Link>
            </Button>
          )}
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
