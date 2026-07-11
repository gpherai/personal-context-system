import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.51.63.101"],
  reactStrictMode: true,
  // Minimal, self-contained production bundle for Docker deployment (VPS).
  output: "standalone"
};

export default nextConfig;
