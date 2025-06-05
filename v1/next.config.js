import { withBundleAnalyzer } from "@next/bundle-analyzer";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const nextConfig = {
  distDir: "build",
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
