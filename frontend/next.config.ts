import type { NextConfig } from "next";
import path from "path";

const isCapacitorBuild = process.env.NEXT_PUBLIC_CAPACITOR === "true";

const nextConfig: any = {
  devIndicators: false,
  transpilePackages: ["@clerk/clerk-react"],
  webpack: (config: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@clerk/clerk-react": path.resolve(__dirname, "./contexts/AuthContext.tsx"),
    };
    return config;
  },
  experimental: {
    turbo: {
      resolveAlias: {
        "@clerk/clerk-react": "./contexts/AuthContext.tsx",
      },
    },
  },
  ...(isCapacitorBuild ? { 
    output: "export",
    typedRoutes: false,
    typescript: {
      ignoreBuildErrors: true,
    }
  } : {}),
};

export default nextConfig;
