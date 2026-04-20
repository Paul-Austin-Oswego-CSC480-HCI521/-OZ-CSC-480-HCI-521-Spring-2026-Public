import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  output: "standalone",
  async headers() {
    return [
      // Apply headers to all pages except API routes and Next.js internal assets
      {
        source: '/((?!api|_next/static|_next/image).*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // allows Google OAuth popup
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none', // disables COEP for popups
          },
        ],
      },
    ];
  },
};

export default nextConfig;
