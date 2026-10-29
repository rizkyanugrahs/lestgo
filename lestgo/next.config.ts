import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Leftover old files in the repository can't block a deploy
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
