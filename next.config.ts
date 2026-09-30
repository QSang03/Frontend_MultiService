import type { NextConfig } from "next";
import os from "os";

// Tự động nhận diện tất cả IP máy host (LAN, Wi-Fi, Localhost) cho phép truy cập và chạy Server Actions
function getLocalDevOrigins(): string[] {
  const origins = new Set<string>([
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
    '192.168.117.217:3000',
  ]);

  try {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          origins.add(alias.address);
          origins.add(`${alias.address}:3000`);
        }
      }
    }
    // Hỗ trợ thêm IP hoặc domain tùy biến qua biến môi trường (cho Production / Docker)
    if (process.env.ALLOWED_ORIGINS) {
      process.env.ALLOWED_ORIGINS.split(',').forEach((item) => {
        const trimmed = item.trim();
        if (trimmed) {
          origins.add(trimmed);
          if (!trimmed.includes(':')) {
            origins.add(`${trimmed}:3000`);
          }
        }
      });
    }
  } catch (err) {
    console.warn('[next.config] Could not scan network interfaces:', err);
  }

  return Array.from(origins);
}

const localOrigins = getLocalDevOrigins();

const nextConfig: NextConfig = {
  // Cho phép hot reload / dev tools từ IP LAN
  allowedDevOrigins: localOrigins,
  // Cho phép Server Actions (Form submit, Đăng nhập) từ IP LAN chống lỗi CSRF
  experimental: {
    serverActions: {
      allowedOrigins: localOrigins,
    },
  },
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
