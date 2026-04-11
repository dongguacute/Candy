import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "export",
  // 多 lockfile 时固定 monorepo 根目录，避免误选家目录下的 pnpm-lock.yaml
  turbopack: {
    root: path.resolve(__dirname, "..", ".."),
  },
};

export default nextConfig;
