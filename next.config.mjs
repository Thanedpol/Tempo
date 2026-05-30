/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Don't bundle these for server (they're loaded at runtime via require).
  // Next.js 15+ renamed this from experimental.serverComponentsExternalPackages.
  serverExternalPackages: ['playwright', 'playwright-core'],

  // Don't fail the build on lint/type errors so Vercel deploys can ship
  // small fixes without re-running the whole CI dance. Enforce in CI instead.
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors:  true },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': new URL('./src',         import.meta.url).pathname,
    };
    return config;
  },
};

export default nextConfig;
