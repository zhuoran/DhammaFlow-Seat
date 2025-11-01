'use client';

import React from 'react';
import { Layout, Menu } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardOutlined,
  UserOutlined,
  SwapOutlined,
  AlertOutlined,
  EnvironmentOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileOutlined,
  HomeOutlined,
  DribbbleOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const router = useRouter();
  const pathname = usePathname();

  // 菜单项配置
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => router.push('/'),
    },
    {
      key: '/students',
      icon: <UserOutlined />,
      label: '学员管理',
      onClick: () => router.push('/students'),
    },
    {
      key: '/rooms',
      icon: <HomeOutlined />,
      label: '房间管理',
      onClick: () => router.push('/rooms'),
    },
    {
      key: '/beds',
      icon: <DribbbleOutlined />,
      label: '床位管理',
      onClick: () => router.push('/beds'),
    },
    {
      key: '/allocations',
      icon: <SwapOutlined />,
      label: '房间分配',
      onClick: () => router.push('/allocations'),
    },
    {
      key: '/allocations/conflicts',
      icon: <AlertOutlined />,
      label: '冲突管理',
      onClick: () => router.push('/allocations/conflicts'),
    },
    {
      key: '/allocations/details',
      icon: <FileOutlined />,
      label: '分配详情',
      onClick: () => router.push('/allocations/details'),
    },
    {
      key: '/meditation-seats',
      icon: <EnvironmentOutlined />,
      label: '禅堂座位',
      onClick: () => router.push('/meditation-seats'),
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '报表导出',
      onClick: () => router.push('/reports'),
    },
  ];

  // 确定当前选中的菜单项
  const getSelectedKey = () => {
    if (pathname === '/') return '/';
    if (pathname.startsWith('/students')) return '/students';
    if (pathname.startsWith('/rooms')) return '/rooms';
    if (pathname.startsWith('/beds')) return '/beds';
    if (pathname === '/allocations') return '/allocations';
    if (pathname.startsWith('/allocations/conflicts')) return '/allocations/conflicts';
    if (pathname.startsWith('/allocations/details')) return '/allocations/details';
    if (pathname.startsWith('/meditation-seats')) return '/meditation-seats';
    if (pathname.startsWith('/reports')) return '/reports';
    return '/';
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={200}
      style={{ background: '#001529' }}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        style={{ height: '100vh', borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;
