"use client";

import { useMemo, useState } from "react";
import { App, Button, Card, Col, Result, Row, Space, Typography } from "antd";
import { ThunderboltOutlined, RedoOutlined, CheckCircleOutlined, ExclamationCircleOutlined, PrinterOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { useAppContext } from "@/state/app-context";
import { useAllocations, useAllocationConflicts, useRooms, useStudents } from "@/hooks/queries";
import { allocationApi } from "@/services/api";

export function AllocationConsolePage() {
  const { currentSession, currentCenter } = useAppContext();
  const { message } = App.useApp();
  const studentsQuery = useStudents(currentSession?.id);
  const allocationsQuery = useAllocations(currentSession?.id);
  const roomsQuery = useRooms(currentCenter?.id);
  const conflictsQuery = useAllocationConflicts(currentSession?.id);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalStudents = studentsQuery.data?.length ?? 0;
    const allocated = allocationsQuery.data?.length ?? 0;
    const pending = Math.max(totalStudents - allocated, 0);
    const rooms = roomsQuery.data?.length ?? 0;
    const conflicts = conflictsQuery.data?.length ?? 0;
    return { totalStudents, allocated, pending, rooms, conflicts };
  }, [studentsQuery.data, allocationsQuery.data, roomsQuery.data, conflictsQuery.data]);

  const runAuto = async () => {
    if (!currentSession) return;
    setRunning(true);
    try {
      const res = await allocationApi.triggerAutoAllocation(currentSession.id);
      setLastResult(`已分配 ${res.statistics?.allocatedStudents ?? stats.allocated} 人`);
      message.success("自动分配完成");
      await Promise.all([allocationsQuery.refetch(), conflictsQuery.refetch()]);
    } catch (error) {
      console.error(error);
      message.error("自动分配失败");
    } finally {
      setRunning(false);
    }
  };

  const clearAllocations = async () => {
    if (!currentSession) return;
    setRunning(true);
    try {
      await allocationApi.clearAllocations(currentSession.id);
      message.success("已清除分配");
      setLastResult(null);
      await Promise.all([allocationsQuery.refetch(), conflictsQuery.refetch()]);
    } catch (error) {
      console.error(error);
      message.error("清除失败");
    } finally {
      setRunning(false);
    }
  };

  if (!currentSession) {
    return (
      <Card>
        <PageHeader title="房间分配" description="请选择课程会期后再执行自动分配" />
        <Result status="info" title="请在顶部选择中心与会期" />
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="房间分配控制台"
        description={`${currentCenter?.centerName ?? ""} · ${currentSession.courseType}`}
        extra={
          <Space>
            <Button loading={running} icon={<ThunderboltOutlined />} type="primary" onClick={runAuto}>
              开始自动分配
            </Button>
            <Button loading={running} icon={<RedoOutlined />} onClick={clearAllocations}>
              重新分配
            </Button>
            <Button icon={<PrinterOutlined />} href="/allocations/print" target="_blank">
              打印房间表
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="学员总数" value={stats.totalStudents} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="已分配" value={stats.allocated} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="待分配" value={stats.pending} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="房间数" value={stats.rooms} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              <Typography.Text strong>分配状态</Typography.Text>
              <Typography.Paragraph type="secondary">
                自动分配会根据性别、房型和优先级规则，为学员寻找最合适的床位。如遇冲突，请前往“手动调整”完成确认。
              </Typography.Paragraph>
              {lastResult ? (
                <Result status="success" title={lastResult} icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />} />
              ) : (
                <Result status="info" title="尚未执行自动分配" />
              )}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              <Space>
                <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                <Typography.Text strong>冲突 / 待处理</Typography.Text>
              </Space>
              <Typography.Title level={2} style={{ margin: 0 }}>
                {stats.conflicts}
              </Typography.Title>
              <Typography.Paragraph type="secondary">
                冲突来自同伴、性别或房间容量限制。点击下方按钮进入手动调整。
              </Typography.Paragraph>
              <Space>
                <Button type="primary" href="/allocations/manual">
                  前往手动调整
                </Button>
                <Button href="/allocations/result">查看分配结果</Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
