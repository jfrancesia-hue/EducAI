/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@educai/ui", "@educai/types", "@educai/i18n"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
