import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "张宇航的被窝",
  description: "张宇航的被窝 · 新粗野主义风格的灵感与公告墙",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {/* 全站背景照片 + 纸感叠层,保证贴子可读 */}
        <div className="bg-photo" aria-hidden />
        <div className="app-root">{children}</div>
      </body>
    </html>
  );
}
