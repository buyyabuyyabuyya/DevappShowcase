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
};

module.exports = nextConfig; 