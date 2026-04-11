import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  // @ts-ignore
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
