const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    // Fallback page when offline and page not cached
    document: '/~offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    // Pre-cache important pages for offline access
    additionalManifestEntries: [
      { url: '/budget', revision: null },
      { url: '/dashboard', revision: null },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable experimental features that may cause file locking issues
  experimental: {
    workerThreads: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
    NEXT_PUBLIC_USER_POOL_CLIENT_ID:
      process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
  },
  images: {
    unoptimized: true, // Disable image optimization for simpler deployment
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '263tube-creator-images.s3.af-south-1.amazonaws.com',
        pathname: '/creators/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com', // YouTube profile pictures
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com', // YouTube banners
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
