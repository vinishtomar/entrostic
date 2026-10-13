import path from "node:path";
import type { NextConfig } from "next";

// Where the FastAPI backend lives, as seen from this server (not the browser).
// Locally: http://localhost:8000. On Railway: the backend's private address.
// Rewrites are compiled at build time, so this must be set when building.
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Pin the project root; otherwise a stray lockfile in a parent folder is picked up.
  turbopack: { root: path.join(__dirname) },
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  // The browser only ever talks to this site; /api/* is forwarded to the backend.
  // Same origin means the login cookie is first-party and no CORS is needed.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
