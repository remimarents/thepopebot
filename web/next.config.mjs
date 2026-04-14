import path from "path";

/** @type {import("next").NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  serverExternalPackages: ["better-sqlite3", "drizzle-orm"],
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "better-sqlite3": "commonjs better-sqlite3",
        "drizzle-orm": "commonjs drizzle-orm",
      });
    }
    return config;
  },
};

export default nextConfig;
