import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
