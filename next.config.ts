import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure environment variables are available at build time
  env: {
    // This makes the environment type available at build time
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  },
  // Environment variables that should be available to the client
  // Note: Never expose DATABASE_URL to the client
  publicRuntimeConfig: {
    // Add any public config here
  },
  // Environment variables that are only available on the server
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
