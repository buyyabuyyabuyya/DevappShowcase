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

/**
 * Compresses an image file to a target size by reducing quality or dimensions
 * @param file The image file to compress
 * @param maxSizeInBytes Maximum size in bytes for the compressed image
 * @param quality Initial quality setting (0-1)
 * @returns Promise that resolves to a compressed File object
 */
export async function compressImage(
  file: File, 
  maxSizeInBytes: number = 700 * 1024, // Default to 700KB
  quality: number = 0.7
): Promise<File> {
  // If file is already smaller than max size, return it as is
  if (file.size <= maxSizeInBytes) {
    return file;
  }

  // Create an image element
  const img = document.createElement('img');
  
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Create object URL to display image in memory
  const url = URL.createObjectURL(file);
  
  // Load the image
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
  
  // Release the object URL
  URL.revokeObjectURL(url);
  
  // Initial dimensions
  let width = img.width;
  let height = img.height;
  
  // If image is very large, scale it down
  const MAX_DIMENSION = 1920; // Maximum width/height
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }
  
  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;
  
  // Draw image to canvas
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  
  // Try compressing the image with decreasing quality until it's small enough
  let compressedBlob: Blob | null = null;
  let currentQuality = quality;
  
  const mimeType = file.type || 'image/jpeg';
  
  while (currentQuality > 0.1) {
    // Convert canvas to blob
    compressedBlob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, mimeType, currentQuality);
    });
    
    // If blob is null or still too large, reduce quality and try again
    if (!compressedBlob || compressedBlob.size > maxSizeInBytes) {
      currentQuality -= 0.1;
    } else {
      break;
    }
  }
  
  // If we couldn't compress enough with quality, try reducing dimensions
  if (!compressedBlob || compressedBlob.size > maxSizeInBytes) {
    let scaleFactor = 0.9;
    
    while (scaleFactor > 0.3) {
      // Reduce dimensions
      width = Math.floor(width * scaleFactor);
      height = Math.floor(height * scaleFactor);
      
      // Update canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Redraw image at new size
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try to get a blob
      compressedBlob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, mimeType, 0.7); // Use decent quality
      });
      
      // If small enough, break the loop
      if (compressedBlob && compressedBlob.size <= maxSizeInBytes) {
        break;
      }
      
      // Otherwise reduce scale more
      scaleFactor -= 0.1;
    }
  }
  
  // If we still couldn't compress enough, throw an error
  if (!compressedBlob || compressedBlob.size > maxSizeInBytes) {
    throw new Error('Could not compress image to target size');
  }
  
  // Create a new file from the blob
  return new File([compressedBlob], file.name, {
    type: mimeType,
    lastModified: Date.now()
  });
} 