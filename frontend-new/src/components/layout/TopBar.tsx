"use client";

import { Button, Dropdown, Select, Skeleton, Space, Tag, Typography } from "antd";
import { LogoutOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { useCenters, useSessions } from "@/hooks/queries";
import { useAppContext } from "@/state/app-context";
import styles from "./top-bar.module.css";

export function TopBar() {
  const { currentCenter, setCenter, currentSession, setSession, hydrated } = useAppContext();
  const { data: centers, isLoading: centersLoading } = useCenters();
  const { data: sessions, isLoading: sessionsLoading } = useSessions(currentCenter?.id);

  const renderCenterSelector = hydrated ? (
    <Select
      placeholder="选择中心"
      className={styles.selector}
      loading={centersLoading}
      value={currentCenter?.id}
      options={centers?.map((center) => ({
        label: center.centerName,
        value: center.id,
      }))}
      onChange={(centerId) => {
        const next = centers?.find((c) => c.id === centerId) ?? null;
        setCenter(next);
        setSession(null);
      }}
      allowClear
    />
  ) : (
    <Skeleton.Input active style={{ width: 200 }} size="default" />
  );

  const renderSessionSelector = hydrated ? (
    <Select
      placeholder="选择课程会期"
      className={styles.selector}
      loading={sessionsLoading}
      value={currentSession?.id}
      disabled={!currentCenter}
      options={sessions?.map((session) => ({
        label: `${session.courseType}（${session.startDate ?? ""}）`,
        value: session.id,
      }))}
      onChange={(sessionId) => {
        const next = sessions?.find((s) => s.id === sessionId) ?? null;
        setSession(next ?? null);
      }}
      allowClear
    />
  ) : (
    <Skeleton.Input active style={{ width: 200 }} size="default" />
  );

  return (
    <header className={styles.topbar}>
      <Space direction="vertical" size={0}>
        <Typography.Text strong>禅修中心智能排床系统</Typography.Text>
        <Typography.Text type="secondary" className={styles.subline}>
          房间/床位/禅堂座位统一管理
        </Typography.Text>
      </Space>

      <Space size="large" align="center">
        {renderCenterSelector}

        {renderSessionSelector}

        {currentCenter && (
          <Tag color="blue" bordered={false}>
            {currentCenter.centerName}
          </Tag>
        )}
        {currentSession && (
          <Tag color="green" bordered={false}>
            {currentSession.courseType}
          </Tag>
        )}

        <Dropdown
          menu={{
            items: [
              { key: "settings", icon: <SettingOutlined />, label: "设置" },
              { key: "logout", icon: <LogoutOutlined />, danger: true, label: "退出登录" },
            ],
          }}
        >
          <Button icon={<UserOutlined />}>用户菜单</Button>
        </Dropdown>
      </Space>
    </header>
  );
}
