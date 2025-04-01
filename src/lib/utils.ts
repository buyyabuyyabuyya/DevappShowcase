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
  console.log(`[ImageCompression] Starting compression for ${file.name}, size: ${(file.size / 1024).toFixed(1)}KB, target: ${(maxSizeInBytes / 1024).toFixed(1)}KB`);
  
  // If file is already smaller than max size, return it as is
  if (file.size <= maxSizeInBytes) {
    console.log(`[ImageCompression] Image already small enough, skipping compression`);
    return file;
  }

  // Create an image element
  const img = document.createElement('img');
  
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('[ImageCompression] Could not get canvas context');
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
  
  console.log(`[ImageCompression] Original dimensions: ${width}x${height}`);
  
  // Start with a scale down if image is large
  let scaleFactor = 1.0;
  const MAX_DIMENSION = 1600; // Maximum width/height (reduced from 1920)
  
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      scaleFactor = MAX_DIMENSION / width;
    } else {
      scaleFactor = MAX_DIMENSION / height;
    }
    
    width = Math.round(width * scaleFactor);
    height = Math.round(height * scaleFactor);
    console.log(`[ImageCompression] Scaled initial dimensions to: ${width}x${height}, scaleFactor: ${scaleFactor.toFixed(2)}`);
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
  console.log(`[ImageCompression] Using mime type: ${mimeType}`);
  
  // First compression attempt
  compressedBlob = await new Promise<Blob | null>(resolve => {
    canvas.toBlob(resolve, mimeType, currentQuality);
  });
  
  if (compressedBlob) {
    console.log(`[ImageCompression] Initial compression at quality ${currentQuality.toFixed(1)}: ${(compressedBlob.size / 1024).toFixed(1)}KB`);
  }
  
  // Try quality reduction loop
  while (currentQuality > 0.1 && (!compressedBlob || compressedBlob.size > maxSizeInBytes)) {
    currentQuality -= 0.1;
    console.log(`[ImageCompression] Trying quality: ${currentQuality.toFixed(1)}`);
    
    // Convert canvas to blob
    compressedBlob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, mimeType, currentQuality);
    });
    
    if (compressedBlob) {
      console.log(`[ImageCompression] Compressed size at quality ${currentQuality.toFixed(1)}: ${(compressedBlob.size / 1024).toFixed(1)}KB`);
    }
  }
  
  // If we couldn't compress enough with quality, try reducing dimensions
  if (!compressedBlob || compressedBlob.size > maxSizeInBytes) {
    console.log(`[ImageCompression] Quality reduction wasn't enough, trying dimension reduction`);
    scaleFactor = 0.8; // Start with more aggressive scaling
    
    while (scaleFactor > 0.1) {
      // Reduce dimensions
      width = Math.floor(width * scaleFactor);
      height = Math.floor(height * scaleFactor);
      
      console.log(`[ImageCompression] Trying dimensions: ${width}x${height}, scaleFactor: ${scaleFactor.toFixed(2)}`);
      
      // Update canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Redraw image at new size
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try to get a blob with medium quality
      compressedBlob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, mimeType, 0.5); // Use lower quality (0.5 instead of 0.7)
      });
      
      if (compressedBlob) {
        console.log(`[ImageCompression] Size after dimension reduction: ${(compressedBlob.size / 1024).toFixed(1)}KB`);
      }
      
      // If small enough, break the loop
      if (compressedBlob && compressedBlob.size <= maxSizeInBytes) {
        break;
      }
      
      // Otherwise reduce scale more aggressively
      scaleFactor -= 0.2; // More aggressive reduction (0.2 instead of 0.1)
    }
  }
  
  // If we still couldn't compress enough, try converting to JPEG if it's not already
  if ((!compressedBlob || compressedBlob.size > maxSizeInBytes) && mimeType !== 'image/jpeg') {
    console.log(`[ImageCompression] Trying format conversion to JPEG`);
    
    compressedBlob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.4); // Use low quality JPEG
    });
    
    if (compressedBlob) {
      console.log(`[ImageCompression] Size after JPEG conversion: ${(compressedBlob.size / 1024).toFixed(1)}KB`);
    }
  }
  
  // Final aggressive reduction if still not small enough
  if (!compressedBlob || compressedBlob.size > maxSizeInBytes) {
    console.log(`[ImageCompression] Final aggressive reduction`);
    
    // Drastically reduce dimensions
    width = Math.floor(width * 0.5);
    height = Math.floor(height * 0.5);
    
    console.log(`[ImageCompression] Final dimensions: ${width}x${height}`);
    
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    compressedBlob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.3); // Very low quality JPEG
    });
    
    if (compressedBlob) {
      console.log(`[ImageCompression] Final size: ${(compressedBlob.size / 1024).toFixed(1)}KB`);
    }
  }
  
  // If we still couldn't compress enough, throw an error
  if (!compressedBlob || compressedBlob.size > maxSizeInBytes) {
    console.error(`[ImageCompression] Failed to compress image below target size`);
    throw new Error('Could not compress image to target size');
  }
  
  console.log(`[ImageCompression] Successfully compressed from ${(file.size / 1024).toFixed(1)}KB to ${(compressedBlob.size / 1024).toFixed(1)}KB`);
  
  // Create a new file from the blob
  const compressedFile = new File([compressedBlob], file.name, {
    type: compressedBlob.type,
    lastModified: Date.now()
  });
  
  return compressedFile;
} 