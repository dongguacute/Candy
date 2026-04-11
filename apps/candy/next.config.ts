import withPWAInit from "next-pwa";
import type { NextConfig } from "next";
import path from "node:path";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** Monorepo 根（含 pnpm-workspace.yaml）。Turbopack 的 `root` 应对齐 repo root，否则会报找不到 next/package.json。 */
const monorepoRoot = path.resolve(__dirname, "..", "..");

const nextConfig: NextConfig = {
  output: "export",
  turbopack: {
    root: monorepoRoot,
  },
};

export default withPWA(nextConfig);
