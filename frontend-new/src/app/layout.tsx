import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import zhCN from "antd/locale/zh_CN";
import { ConfigProvider, App as AntdApp } from "antd";
import "./globals.css";
import "antd/dist/reset.css";
import { AppContextProvider } from "@/state/app-context";
import { ReactQueryProvider } from "@/state/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DhammaFlowSeat Console",
  description: "禅修中心智能排床系统前端（Next.js 重构版）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              fontFamily: "var(--font-geist-sans)",
              colorPrimary: "#1890ff",
              borderRadius: 6,
            },
          }}
        >
          <ReactQueryProvider>
            <AppContextProvider>
              <AntdApp>{children}</AntdApp>
            </AppContextProvider>
          </ReactQueryProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
