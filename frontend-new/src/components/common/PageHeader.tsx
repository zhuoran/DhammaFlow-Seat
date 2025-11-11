"use client";

import { Breadcrumb, Space, Typography } from "antd";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  trail?: { label: string; href?: string }[];
  extra?: ReactNode;
}

export function PageHeader({ title, description, trail, extra }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {trail && trail.length > 0 && (
        <Breadcrumb
          items={trail.map((item) => ({
            title: item.href ? <a href={item.href}>{item.label}</a> : item.label,
          }))}
          style={{ marginBottom: 8 }}
        />
      )}
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {description && (
            <Typography.Paragraph type="secondary" style={{ marginTop: 4 }}>
              {description}
            </Typography.Paragraph>
          )}
        </div>
        {extra}
      </Space>
    </div>
  );
}
