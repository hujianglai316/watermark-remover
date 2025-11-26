import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CleanPic AI - 智能去水印工具",
  description: "免费、高清、智能的图片水印去除工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

