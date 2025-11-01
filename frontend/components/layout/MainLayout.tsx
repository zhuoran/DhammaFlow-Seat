'use client';

import React, { useState, useEffect } from 'react';
import { Layout, App } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Center, Session } from '@/types';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<Center | undefined>(undefined);
  const [currentSession, setCurrentSession] = useState<Session | undefined>(undefined);
  const [isHydrated, setIsHydrated] = useState(false);

  // 只在客户端初始化时从 localStorage 读取
  useEffect(() => {
    const storedCenter = localStorage.getItem('currentCenter');
    const storedSession = localStorage.getItem('currentSession');

    if (storedCenter) {
      setCurrentCenter(JSON.parse(storedCenter));
    }
    if (storedSession) {
      setCurrentSession(JSON.parse(storedSession));
    }

    setIsHydrated(true);
  }, []);

  // 保存当前中心到本地存储
  useEffect(() => {
    if (isHydrated && currentCenter) {
      localStorage.setItem('currentCenter', JSON.stringify(currentCenter));
    }
  }, [currentCenter, isHydrated]);

  // 保存当前会期到本地存储
  useEffect(() => {
    if (isHydrated && currentSession) {
      localStorage.setItem('currentSession', JSON.stringify(currentSession));
    }
  }, [currentSession, isHydrated]);

  return (
    <App>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout>
          <Header
            currentCenter={currentCenter}
            currentSession={currentSession}
            onCenterChange={setCurrentCenter}
            onSessionChange={setCurrentSession}
          />
          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              background: '#fff',
              borderRadius: 8,
              minHeight: 'calc(100vh - 130px)',
              overflowY: 'auto',
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </App>
  );
};

export default MainLayout;
