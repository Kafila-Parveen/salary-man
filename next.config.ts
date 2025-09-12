import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {ignoreBuildErrors: true},
  eslint:{ignoreDuringBuilds: true},
  // Ensure environment variables are available at build time
  env: {
    // This makes the environment type available at build time
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  },

 
  serverRuntimeConfig: {
    // This will be available on the server only
    databaseUrl: process.env.DATABASE_URL,
  },
  // Enable server actions for data mutations
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
