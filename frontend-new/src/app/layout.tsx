import type { Metadata } from "next";
import zhCN from "antd/locale/zh_CN";
import { ConfigProvider, App as AntdApp } from "antd";
import "./globals.css";
import "antd/dist/reset.css";
import { AppContextProvider } from "@/state/app-context";
import { ReactQueryProvider } from "@/state/query-provider";

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
      <body className="antialiased">
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              fontFamily: '"Inter", "PingFang SC", "Helvetica Neue", system-ui, -apple-system, sans-serif',
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
