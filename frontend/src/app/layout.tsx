import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "班级积分管理系统",
  description: "让教学更轻松 | 智能化数据管理 · 可视化成长分析",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
