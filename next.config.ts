import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project to avoid picking up a stray
  // lockfile in a parent directory.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
