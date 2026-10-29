/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

import("@opennextjs/cloudflare").then(
  (m) => m.initOpenNextCloudflareForDev()
);

export default nextConfig;