"use client";

import { Card, Typography } from "antd";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  color?: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <Card>
      <Typography.Title level={4} style={{ marginBottom: 8, color: color ?? "inherit" }}>
        {value}
      </Typography.Title>
      <Typography.Text type="secondary">{label}</Typography.Text>
    </Card>
  );
}
