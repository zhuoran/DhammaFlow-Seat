'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Space, Tabs, Empty, Badge, Tooltip, App, Alert } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';

export default function MeditationSeats() {
  const { message } = App.useApp();
  const [seatRegion, setSeatRegion] = useState<'A' | 'B'>('A');
  const [generating, setGenerating] = useState(false);
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

  if (!isHydrated) {
    return null;
  }

  if (!currentSession) {
    return (
      <div>
        <div className="page-header">
          <h1>禅堂座位</h1>
        </div>
        <Alert
          message="请先选择课程会期"
          description="从顶部菜单栏选择要操作的禅修中心和课程会期后，可查看禅堂座位"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Empty description="暂无数据" style={{ marginTop: 50 }} />
      </div>
    );
  }

  const handleGenerateSeats = async () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      message.success('座位已生成！');
    }, 2000);
  };

  const seatColors = {
    monk: '#f759ab',      // 粉色 - 法师座
    student: '#1890ff',   // 蓝色 - 学员座
    dharma: '#fa8c16',    // 橙色 - 法工座
    empty: '#f0f0f0',     // 灰色 - 空座
  };

  // 示例座位布局 - 禅堂A区（女众）
  const seatsA = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    number: `A${i + 1}`,
    type: i < 3 ? 'monk' : i < 20 ? 'student' : 'empty',
    occupied: i < 20,
  }));

  // 示例座位布局 - 禅堂B区（男众）
  const seatsB = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    number: `B${i * 2 + 1}`,
    type: i < 5 ? 'monk' : i < 35 ? 'student' : 'empty',
    occupied: i < 35,
  }));

  const currentSeats = seatRegion === 'A' ? seatsA : seatsB;

  const SeatGrid = ({ seats }: { seats: typeof seatsA }) => {
    const columns = seatRegion === 'A' ? 4 : 10;
    const rows = Math.ceil(seats.length / columns);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '8px' }}>
        {seats.map((seat) => (
          <Tooltip
            key={seat.id}
            title={`${seat.number} - ${
              seat.type === 'monk'
                ? '法师座'
                : seat.type === 'dharma'
                ? '法工座'
                : seat.type === 'empty'
                ? '空座'
                : '学员座'
            }`}
          >
            <div
              style={{
                padding: '12px',
                borderRadius: '4px',
                backgroundColor: seatColors[seat.type as keyof typeof seatColors],
                color: '#fff',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '12px',
                border: seat.occupied ? '2px solid #1890ff' : '1px solid #d9d9d9',
              }}
            >
              {seat.number}
            </div>
          </Tooltip>
        ))}
      </div>
    );
  };

  const tabItems = [
    {
      key: 'A',
      label: '禅堂A区（女众）',
      children: <SeatGrid seats={seatsA} />,
    },
    {
      key: 'B',
      label: '禅堂B区（男众）',
      children: <SeatGrid seats={seatsB} />,
    },
  ];

  const stats = {
    'A': { occupied: seatsA.filter(s => s.occupied).length, total: seatsA.length },
    'B': { occupied: seatsB.filter(s => s.occupied).length, total: seatsB.length },
  };

  return (
    <div>
      <div className="page-header">
        <h1>禅堂座位</h1>
        <p className="description">
          管理禅堂座位分配，支持自动生成和手动调整
        </p>
      </div>

      <Space style={{ marginBottom: 24 }}>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={generating}
          onClick={handleGenerateSeats}
        >
          生成座位
        </Button>
        <Button icon={<DownloadOutlined />}>
          导出座位表
        </Button>
      </Space>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {stats.A.occupied} / {stats.A.total}
              </div>
              <div style={{ color: '#8c8c8c', marginTop: '8px' }}>
                禅堂A区（女众）座位占用
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {stats.B.occupied} / {stats.B.total}
              </div>
              <div style={{ color: '#8c8c8c', marginTop: '8px' }}>
                禅堂B区（男众）座位占用
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 座位图例 */}
      <Card title="座位图例" style={{ marginBottom: 24 }}>
        <Row gutter={[32, 16]}>
          <Col xs={12} sm={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: seatColors.monk,
                }}
              />
              <span>法师座</span>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: seatColors.student,
                }}
              />
              <span>学员座</span>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: seatColors.dharma,
                }}
              />
              <span>法工座</span>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: seatColors.empty,
                  border: '1px solid #d9d9d9',
                }}
              />
              <span>空座</span>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 座位网格 */}
      <Card>
        <Tabs
          items={tabItems}
          onChange={(key) => setSeatRegion(key as 'A' | 'B')}
        />
      </Card>
    </div>
  );
}
