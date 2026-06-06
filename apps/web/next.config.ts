import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@propagate/contracts", "@propagate/crossref"],
};

export default nextConfig;
