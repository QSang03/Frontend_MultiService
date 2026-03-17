import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from '@/components/ui/Toast';
import NoTranslateCleanup from '@/components/NoTranslateCleanup';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MultiService - Dịch vụ IT nhanh chóng, không rào cản",
  description: "Nền tảng quản lý dịch vụ IT đa năng. Sửa máy in, máy tính, mạng và hơn thế nữa. Gửi yêu cầu chỉ với SĐT hoặc Email.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          <NoTranslateCleanup />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
