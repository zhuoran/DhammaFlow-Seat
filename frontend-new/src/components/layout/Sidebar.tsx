"use client";

import { Layout, Menu, type MenuProps } from "antd";
import {
  AppstoreOutlined,
  HomeOutlined,
  UserOutlined,
  ApartmentOutlined,
  CloudUploadOutlined,
  ClusterOutlined,
  FileTextOutlined,
  RadarChartOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import styles from "./sidebar.module.css";

const menuItems: MenuProps["items"] = [
  { key: "/", icon: <AppstoreOutlined />, label: "仪表盘" },
  { key: "/students", icon: <UserOutlined />, label: "学员管理" },
  { key: "/course-config", icon: <RadarChartOutlined />, label: "课程设置" },
  { key: "/rooms", icon: <HomeOutlined />, label: "房间管理" },
  { key: "/import", icon: <CloudUploadOutlined />, label: "数据导入" },
  { key: "/allocations", icon: <ClusterOutlined />, label: "房间控制台" },
  { key: "/allocations/manual", icon: <ApartmentOutlined />, label: "房间工作台" },
  { key: "/meditation-seats", icon: <ApartmentOutlined />, label: "禅堂座位" },
  { key: "/reports", icon: <FileTextOutlined />, label: "报表导出" },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const selectedKey = menuItems?.reduce<string | undefined>((match, item) => {
    const key = typeof item?.key === "string" ? item.key : undefined;
    if (!key) return match;
    if (key === "/") {
      return pathname === "/" ? "/" : match;
    }
    if (pathname.startsWith(key)) {
      if (!match || key.length > match.length) {
        return key;
      }
    }
    return match;
  }, undefined);

  return (
    <Layout.Sider breakpoint="lg" collapsedWidth={64} className={styles.sider}>
      <div className={styles.brand}>DhammaFlowSeat</div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : undefined}
        items={menuItems}
        onClick={({ key }) => {
          if (typeof key === "string") {
            router.push(key);
          }
        }}
      />
    </Layout.Sider>
  );
}
