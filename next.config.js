/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'], // Add any image domains you'll use
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb' // Increase to an appropriate size
    }
  },
  // Optimize performance by enabling features that help with caching and performance
  productionBrowserSourceMaps: true, // Enable source maps in production
  swcMinify: true, // Use SWC for minification instead of Terser
  // Configure headers for static files to improve caching
  async headers() {
    return [
      // Cache static assets with a long max-age
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache public images with a long max-age
      {
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Cache favicon
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 