import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(staticExport && {
    output: "export" as const,
    images: { unoptimized: true },
  }),
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
