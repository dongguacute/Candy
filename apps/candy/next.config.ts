import type { NextConfig } from "next";
import path from "node:path";

/** Monorepo 根（含 pnpm-workspace.yaml）。Turbopack 的 `root` 应对齐 repo root，否则会报找不到 next/package.json。 */
const monorepoRoot = path.resolve(__dirname, "..", "..");

const nextConfig: NextConfig = {
  output: "export",
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
