/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@educai/ui", "@educai/types", "@tremor/react"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
