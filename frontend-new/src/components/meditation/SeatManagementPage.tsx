"use client";

import { useMemo, useState } from "react";
import { Button, Card, Empty, Space, Statistic, Row, Col, message as antdMessage } from "antd";
import { ReloadOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { meditationSeatApi } from "@/services/api";
import { useMeditationSeats, useSeatStatistics, useStudents } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import type { MeditationSeat } from "@/types/domain";
import { SeatMapCanvas } from "./SeatMapCanvas";
import { SeatDetailDrawer } from "./SeatDetailDrawer";

/**
 * 电影院风格座位管理页面
 * 独立于配置页面，专注于座位的可视化和分配
 */
export function SeatManagementPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const { currentSession } = useAppContext();
  const queryClient = useQueryClient();

  const seatsQuery = useMeditationSeats(currentSession?.id);
  const statsQuery = useSeatStatistics(currentSession?.id);
  const studentsQuery = useStudents(currentSession?.id);

  const [selectedSeat, setSelectedSeat] = useState<MeditationSeat | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const seats = useMemo(() => seatsQuery.data ?? [], [seatsQuery.data]);
  const stats = statsQuery.data;
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);

  const enrichedSeats = useMemo(() => {
    return seats.map((seat) => {
      const student = students.find((s) => s.id === seat.studentId);
      const totalCourseTimes =
        (student?.course10dayTimes ?? 0) +
        (student?.course4mindfulnessTimes ?? 0) +
        (student?.course20dayTimes ?? 0) +
        (student?.course30dayTimes ?? 0) +
        (student?.course45dayTimes ?? 0);
      return {
        ...seat,
        studentName: student?.name || seat.studentName,
        age: student?.age,
        studyTimes: student?.studyTimes,
        serviceTimes: student?.serviceTimes,
        totalCourseTimes,
      };
    });
  }, [seats, students]);

  if (!currentSession) {
    return (
      <Card>
        <PageHeader title="座位管理" description="请选择会期" />
        <Empty />
      </Card>
    );
  }

  const handleGenerateSeats = async () => {
    try {
      await meditationSeatApi.generateSeats(currentSession.id);
      messageApi.success('座位生成成功');
      await queryClient.invalidateQueries({ queryKey: ["meditation-seats", currentSession.id] });
      await queryClient.invalidateQueries({ queryKey: ["seat-statistics", currentSession.id] });
    } catch (error) {
      messageApi.error('座位生成失败');
      console.error('Generate seats error:', error);
    }
  };

  const handleDeleteSeats = async () => {
    try {
      await meditationSeatApi.deleteSessionSeats(currentSession.id);
      messageApi.success('座位已清空');
      await queryClient.invalidateQueries({ queryKey: ["meditation-seats", currentSession.id] });
      await queryClient.invalidateQueries({ queryKey: ["seat-statistics", currentSession.id] });
    } catch (error) {
      messageApi.error('清空座位失败');
      console.error('Delete seats error:', error);
    }
  };

  const handleSeatClick = (seat: MeditationSeat) => {
    setSelectedSeat(seat);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedSeat(null);
  };

  const handleSeatUpdate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["meditation-seats", currentSession.id] });
    await queryClient.invalidateQueries({ queryKey: ["seat-statistics", currentSession.id] });
    await queryClient.invalidateQueries({ queryKey: ["students", currentSession.id] });
  };

  return (
    <div>
      {contextHolder}
      <PageHeader
        title="座位管理"
        description="电影院风格座位可视化和分配管理"
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 顶部控制栏 */}
        <Card>
          <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleGenerateSeats}
                loading={seatsQuery.isLoading}
              >
                生成座位
              </Button>
              <Button
                danger
                onClick={handleDeleteSeats}
                disabled={seats.length === 0}
              >
                清空座位
              </Button>
            </Space>

            {/* 座位统计 */}
            {stats && (
              <Row gutter={16}>
                <Col>
                  <Statistic
                    title="总座位"
                    value={stats.totalSeats}
                    prefix={<TeamOutlined />}
                  />
                </Col>
                <Col>
                  <Statistic
                    title="已分配"
                    value={stats.occupiedSeats}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col>
                  <Statistic
                    title="可用"
                    value={stats.availableSeats}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>
            )}
          </Space>
        </Card>

        {/* 座位图画布 */}
        <SeatMapCanvas
          seats={enrichedSeats}
          loading={seatsQuery.isLoading}
          selectedSeatId={selectedSeat?.id}
          onSeatClick={handleSeatClick}
        />
      </Space>

      {/* 座位详情抽屉 */}
      <SeatDetailDrawer
        seat={selectedSeat}
        open={drawerOpen}
        students={students}
        onClose={handleDrawerClose}
        onUpdate={handleSeatUpdate}
      />
    </div>
  );
}
