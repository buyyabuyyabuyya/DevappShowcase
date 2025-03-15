import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determines if a route should be cacheable based on the pathname
 * @param pathname The current route path
 * @returns Boolean indicating if the route is cacheable
 */
export function isCacheableRoute(pathname: string): boolean {
  // Public routes that benefit from caching
  const cacheableRoutes = [
    '/',
    '/apps',
    '/about',
    '/terms',
    '/privacy',
  ];
  
  // Check for exact match or if it's a static app details page
  return cacheableRoutes.includes(pathname) || 
    (pathname.startsWith('/apps/') && pathname.split('/').length === 3);
}

/**
 * Gets appropriate cache control headers based on route and authentication status
 * @param pathname The current route path
 * @param isAuthenticated Whether user is authenticated
 * @returns Cache-Control header value
 */
export function getCacheControlHeaders(pathname: string, isAuthenticated: boolean): string {
  // API routes generally shouldn't be cached except in specific cases
  if (pathname.startsWith('/api')) {
    if (pathname === '/api/apps') {
      // Public data API can be cached briefly
      return 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400';
    }
    return 'no-store, must-revalidate';
  }
  
  // For public cacheable routes
  if (isCacheableRoute(pathname) && !isAuthenticated) {
    return 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400';
  }
  
  // For authenticated users on public routes, use private cache
  if (isCacheableRoute(pathname) && isAuthenticated) {
    return 'private, max-age=30, must-revalidate';
  }
  
  // User-specific pages should be private but can still use bfcache
  if (isAuthenticated) {
    return 'private, max-age=0, must-revalidate';
  }
  
  // Default case
  return 'public, max-age=0, must-revalidate';
} 