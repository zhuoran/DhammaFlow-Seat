'use client';

import { useMemo, useState } from 'react';
import { Button, Card, Col, Empty, Input, Modal, Row, Space, Statistic, message as antdMessage } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { ReloadOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppContext } from '@/state/app-context';
import { meditationSeatApi } from '@/services/api';
import { useMeditationSeats, useSeatStatistics, useStudents } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import type { MeditationSeat } from '@/types/domain';
import { SeatMapCanvas } from './SeatMapCanvas';
import { SeatDetailDrawer } from './SeatDetailDrawer';

/**
 * 电影院风格座位管理页面
 * 独立于配置页面，专注于座位的可视化和分配
 */
export function SeatManagementPage() {
  const [messageApi, messageContextHolder] = antdMessage.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const { currentSession } = useAppContext();
  const queryClient = useQueryClient();

  const seatsQuery = useMeditationSeats(currentSession?.id);
  const statsQuery = useSeatStatistics(currentSession?.id);
  const studentsQuery = useStudents(currentSession?.id);

  const [selectedSeat, setSelectedSeat] = useState<MeditationSeat | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [highlightSeatId, setHighlightSeatId] = useState<number>();
  const [searchValue, setSearchValue] = useState('');

  const seats = useMemo(() => seatsQuery.data ?? [], [seatsQuery.data]);
  const stats = statsQuery.data;
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);

  const seatById = useMemo(() => {
    const map = new Map<number, MeditationSeat>();
    seats.forEach((seat) => map.set(seat.id, seat));
    return map;
  }, [seats]);

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

  const resolvedHighlightSeatId = useMemo(() => {
    if (!highlightSeatId) {
      return undefined;
    }
    return enrichedSeats.some((seat) => seat.id === highlightSeatId) ? highlightSeatId : undefined;
  }, [enrichedSeats, highlightSeatId]);

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = async () => {
    if (!currentSession) return;
    try {
      const res = await fetch(`/api/reports/export?sessionId=${currentSession.id}`);
      if (!res.ok) {
        messageApi.error('导出失败');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '禅堂座位报表.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export report error', e);
      messageApi.error('导出失败');
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

  const handleSeatDrop = async (sourceSeatId: number, targetSeatId: number) => {
    if (sourceSeatId === targetSeatId) return;

    const sourceSeat = seatById.get(sourceSeatId);
    const targetSeat = seatById.get(targetSeatId);

    if (!sourceSeat || !targetSeat) {
      messageApi.warning('座位信息未加载完成');
      return;
    }

    if (!sourceSeat.studentId && !targetSeat.studentId) {
      messageApi.info('两个空位无需调整');
      return;
    }

    // 目标空位：视为移动
    if (!targetSeat.studentId) {
      if (!sourceSeat.studentId) {
        messageApi.info('该座位没有学员可移动');
        return;
      }
      try {
        await meditationSeatApi.assignSeat(targetSeatId, sourceSeat.studentId);
        messageApi.success('已移动到空位');
        await handleSeatUpdate();
      } catch (error) {
        console.error('Assign seat error:', error);
        messageApi.error('移动失败，请检查座位条件');
      }
      return;
    }

    const swap = async () => {
      try {
        await meditationSeatApi.swapSeats(sourceSeatId, targetSeatId);
        messageApi.success('已调整座位');
        await handleSeatUpdate();
      } catch (error) {
        console.error('Swap seats error:', error);
        messageApi.error('调整失败，请检查座位条件');
      }
    };

    if (targetSeat.studentId) {
      const sourceName = enrichedSeats.find((s) => s.id === sourceSeatId)?.studentName || sourceSeat.seatNumber;
      const targetName = enrichedSeats.find((s) => s.id === targetSeatId)?.studentName || targetSeat.seatNumber;
      modal.confirm({
        title: '确认交换座位？',
        content: `${sourceName ?? '座位'} ↔ ${targetName ?? '座位'}`,
        onOk: swap,
      });
      return;
    }

    await swap();
  };

  const handleSearch = (value: string) => {
    const keyword = value.trim().toLowerCase();
    setSearchValue(value);
    if (!keyword) {
      setHighlightSeatId(undefined);
      messageApi.info('请输入姓名、座号或房间床位');
      return;
    }

    const match = enrichedSeats.find((seat) => {
      const seatNumber = seat.seatNumber?.toLowerCase() ?? '';
      const studentName = seat.studentName?.toLowerCase() ?? '';
      const bed = seat.bedCode?.toLowerCase() ?? '';
      return seatNumber.includes(keyword) || studentName.includes(keyword) || bed.includes(keyword);
    });

    if (match) {
      setHighlightSeatId(match.id);
      setSelectedSeat(match);
    } else {
      messageApi.warning('未找到匹配的座位');
    }
  };

  return (
    <div className="print-container">
      {messageContextHolder}
      {modalContextHolder}
      <div className="no-print">
        <PageHeader
          title="座位管理"
          description="电影院风格座位可视化和分配管理"
        />
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 顶部控制栏 */}
        <Card className="no-print">
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
              <Button icon={<DownloadOutlined />} onClick={handleDownloadReport}>
                下载报表
              </Button>
              <Button onClick={handlePrint}>打印</Button>
            </Space>

            <Space size="large" align="center">
              <Space.Compact>
                <Input
                  placeholder="按姓名/座号/房间床位查找"
                  allowClear
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onPressEnter={() => handleSearch(searchValue)}
                  style={{ width: 220 }}
                />
                <Button type="primary" onClick={() => handleSearch(searchValue)}>
                  定位
                </Button>
              </Space.Compact>
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
          </Space>
        </Card>

        {/* 座位图画布 */}
        <SeatMapCanvas
          seats={enrichedSeats}
          loading={seatsQuery.isLoading}
          selectedSeatId={selectedSeat?.id}
          highlightSeatId={resolvedHighlightSeatId}
          onSeatClick={handleSeatClick}
          onSeatDrop={handleSeatDrop}
          onDropBlocked={(reason) => messageApi.warning(reason)}
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
