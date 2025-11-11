"use client";

import { useMemo } from "react";
import { Button, Card, Col, Empty, Row, Space, Spin } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { useAppContext } from "@/state/app-context";
import { useAllocations, useRooms, useStudents } from "@/hooks/queries";
import { useRouter } from "next/navigation";

const quickActions = [
  { label: "导入学员", href: "/students", type: "primary" as const },
  { label: "房间管理", href: "/rooms" },
  { label: "手动分配", href: "/allocations/manual" },
  { label: "导出报表", href: "/reports" },
];

export function DashboardView() {
  const { currentCenter, currentSession } = useAppContext();
  const router = useRouter();
  const roomsQuery = useRooms(currentCenter?.id);
  const studentsQuery = useStudents(currentSession?.id);
  const allocationsQuery = useAllocations(currentSession?.id);

  const stats = useMemo(() => {
    const totalStudents = studentsQuery.data?.length ?? 0;
    const totalRooms = roomsQuery.data?.length ?? 0;
    const totalAllocations = allocationsQuery.data?.length ?? 0;
    const pending = Math.max(totalStudents - totalAllocations, 0);

    return {
      totalStudents,
      totalRooms,
      totalAllocations,
      pending,
    };
  }, [roomsQuery.data, studentsQuery.data, allocationsQuery.data]);

  const loading = roomsQuery.isLoading || studentsQuery.isLoading || allocationsQuery.isLoading;

  if (!currentCenter || !currentSession) {
    return (
      <Card>
        <PageHeader title="仪表盘" description="请选择禅修中心与课程会期后查看统计" />
        <Empty description="请先在右上角选择禅修中心与会期" />
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${currentCenter.centerName} - ${currentSession.courseType}`}
        description="掌握房间、床位与学员分配的总体进度"
      />

      {loading ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard label="总学员数" value={stats.totalStudents} color="#1890ff" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard label="已分配" value={stats.totalAllocations} color="#52c41a" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard label="待分配" value={stats.pending} color="#faad14" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard label="房间数量" value={stats.totalRooms} color="#9254de" />
          </Col>
        </Row>
      )}

      <Card title="快速操作" style={{ marginTop: 24 }}>
        <Space wrap>
          {quickActions.map((action) => (
            <Button key={action.href} type={action.type} onClick={() => router.push(action.href)}>
              {action.label}
            </Button>
          ))}
        </Space>
      </Card>
    </div>
  );
}
