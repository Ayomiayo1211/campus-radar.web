/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-d1",
  ],
};

export default nextConfig;

import("@opennextjs/cloudflare").then(
  (m) => m.initOpenNextCloudflareForDev()
);