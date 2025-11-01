'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, Space, Alert, Empty } from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  DownloadOutlined,
  UserAddOutlined,
  SwapOutlined,
} from '@ant-design/icons';

export default function Dashboard() {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 初始化：从 localStorage 读取当前会期
  useEffect(() => {
    const stored = localStorage.getItem('currentSession');
    if (stored) {
      setCurrentSession(JSON.parse(stored));
    }
    setIsHydrated(true);
  }, []);

  if (!isHydrated || !currentSession) {
    return (
      <div>
        <div className="page-header">
          <h1>仪表盘</h1>
          <p className="description">查看分配和座位安排的实时进度</p>
        </div>
        <Alert
          message="请先选择禅修中心和课程会期"
          description="从顶部菜单栏选择要操作的禅修中心和课程会期后，可查看仪表盘统计信息"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Empty description="暂无数据" style={{ marginTop: 50 }} />
      </div>
    );
  }

  // 示例统计数据（后续将从 API 获取）
  const stats = {
    totalStudents: 180,
    allocatedStudents: 165,
    pendingStudents: 15,
    conflictCount: 3,
  };

  const allocationRate = Math.round(
    (stats.allocatedStudents / stats.totalStudents) * 100
  );

  const seatAllocationRate = 92; // 示例数据

  return (
    <div>
      <div className="page-header">
        <h1>仪表盘</h1>
        <p className="description">
          {currentSession.courseType} ({currentSession.startDate})
        </p>
      </div>

      {/* 关键指标卡片 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总学员数"
              value={stats.totalStudents}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已分配房间"
              value={stats.allocatedStudents}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待分配"
              value={stats.pendingStudents}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="冲突数量"
              value={stats.conflictCount}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 分配进度 */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="房间分配进度" variant="borderless">
            <Statistic
              value={allocationRate}
              precision={0}
              suffix="%"
              valueStyle={{ color: '#1890ff', fontSize: 32 }}
            />
            <div style={{ marginTop: 16, fontSize: 12, color: '#8c8c8c' }}>
              {stats.allocatedStudents} / {stats.totalStudents} 学员已分配
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="禅堂座位分配" variant="borderless">
            <Statistic
              value={seatAllocationRate}
              precision={0}
              suffix="%"
              valueStyle={{ color: '#1890ff', fontSize: 32 }}
            />
            <div style={{ marginTop: 16, fontSize: 12, color: '#8c8c8c' }}>
              座位生成和分配完成度
            </div>
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作" style={{ marginTop: 24 }} variant="borderless">
        <Space wrap>
          <Button
            type="primary"
            size="large"
            icon={<UserAddOutlined />}
            onClick={() => (window.location.href = '/students')}
          >
            导入学员
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SwapOutlined />}
            onClick={() => (window.location.href = '/allocations')}
          >
            一键分配
          </Button>
          <Button
            size="large"
            icon={<AlertOutlined />}
            onClick={() => (window.location.href = '/allocations/conflicts')}
          >
            处理冲突
          </Button>
          <Button
            size="large"
            icon={<DownloadOutlined />}
            onClick={() => (window.location.href = '/reports')}
          >
            导出报表
          </Button>
        </Space>
      </Card>

      {/* 最近操作提示 */}
      {stats.conflictCount > 0 && (
        <Alert
          message="存在未处理的冲突"
          description={`有 ${stats.conflictCount} 个分配冲突需要处理，请前往冲突管理页面进行调整`}
          type="warning"
          showIcon
          closable
          style={{ marginTop: 24 }}
          action={
            <Button
              size="small"
              type="text"
              onClick={() => (window.location.href = '/allocations/conflicts')}
            >
              前往处理
            </Button>
          }
        />
      )}
    </div>
  );
}
