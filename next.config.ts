import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN access from 192.168.117.* without dev server blocking
  allowedDevOrigins: ['192.168.117.16:3000', 'localhost:3000', '127.0.0.1:3000'],
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.117.217',
        port: '9000',
        pathname: '/saas-storage/**',
      },
    ],
  },
};

export default nextConfig;
