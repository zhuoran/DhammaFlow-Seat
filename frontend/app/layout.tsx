import type { Metadata } from "next";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "@/styles/globals.css";
import { MainLayout } from "@/components/layout/MainLayout";

export const metadata: Metadata = {
  title: "禅修排床系统 - DhammaFlowSeat",
  description: "禅修中心智能排床系统，支持房间分配和禅堂座位管理",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ant Design 主题配置
  const theme = {
    token: {
      colorPrimary: "#1890ff",
      borderRadius: 4,
      fontSize: 14,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
  };

  return (
    <html lang="zh">
      <body>
        <ConfigProvider theme={theme} locale={zhCN}>
          <MainLayout>{children}</MainLayout>
        </ConfigProvider>
      </body>
    </html>
  );
}
