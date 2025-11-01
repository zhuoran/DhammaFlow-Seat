'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Select, Button, Space, Dropdown, App } from 'antd';
import { LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { Center, Session } from '@/types';
import apiClient from '@/services/api';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  currentCenter?: Center;
  currentSession?: Session;
  onCenterChange?: (center: Center) => void;
  onSessionChange?: (session: Session) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCenter,
  currentSession,
  onCenterChange,
  onSessionChange,
}) => {
  const { message } = App.useApp();
  const [centers, setCenters] = useState<Center[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [centerLoading, setCenterLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  // 加载禅修中心列表
  useEffect(() => {
    const loadCenters = async () => {
      setCenterLoading(true);
      try {
        const response = await apiClient.get('/centers');
        if (response.data?.data) {
          // ListData 对象的 list 字段
          const centerList = response.data.data.list || response.data.data;
          setCenters(centerList);
        }
      } catch (error) {
        console.error('Failed to load centers:', error);
        message.error('无法加载禅修中心');
      } finally {
        setCenterLoading(false);
      }
    };

    loadCenters();
  }, []);

  // 当选择中心时，加载该中心的课程
  useEffect(() => {
    if (!currentCenter?.id) return;

    const loadSessions = async () => {
      setSessionLoading(true);
      try {
        const response = await apiClient.get(`/sessions?centerId=${currentCenter.id}`);
        if (response.data?.data) {
          // ListData 对象的 list 字段
          const sessionList = response.data.data.list || response.data.data;
          setSessions(sessionList);
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
        message.error('无法加载课程会期');
      } finally {
        setSessionLoading(false);
      }
    };

    loadSessions();
  }, [currentCenter?.id]);

  const handleCenterChange = (centerId: string) => {
    const selected = centers.find((c) => c.id === parseInt(centerId));
    if (selected && onCenterChange) {
      onCenterChange(selected);
      setSessions([]);
    }
  };

  const handleSessionChange = (sessionId: string) => {
    const selected = sessions.find((s) => s.id === parseInt(sessionId));
    if (selected && onSessionChange) {
      onSessionChange(selected);
    }
  };

  const userMenu = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          禅修排床系统
        </h1>
      </div>

      <Space size="large">
        <Select
          placeholder="请选择禅修中心"
          style={{ width: 200 }}
          value={currentCenter?.id ? currentCenter.id.toString() : undefined}
          onChange={handleCenterChange}
          loading={centerLoading}
          options={centers.map((c) => ({
            value: c.id.toString(),
            label: c.centerName,
          }))}
        />

        {currentCenter && (
          <Select
            placeholder="请选择课程会期"
            style={{ width: 200 }}
            value={currentSession?.id ? currentSession.id.toString() : undefined}
            onChange={handleSessionChange}
            loading={sessionLoading}
            options={sessions.map((s) => ({
              value: s.id.toString(),
              label: `${s.courseType} (${s.startDate})`,
            }))}
          />
        )}

        <Dropdown menu={{ items: userMenu }} trigger={['click']}>
          <Button type="text">用户菜单</Button>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
