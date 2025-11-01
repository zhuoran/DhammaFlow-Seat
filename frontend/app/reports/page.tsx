'use client';

import React, { useState } from 'react';
import { Card, Button, Space, Table, Row, Col, Statistic, Empty, Select, App } from 'antd';
import { DownloadOutlined, PrinterOutlined, FileExcelOutlined } from '@ant-design/icons';

export default function Reports() {
  const { message } = App.useApp();
  const [reportType, setReportType] = useState<'bed' | 'meditation'>('bed');
  const [exporting, setExporting] = useState(false);

  const currentSession = typeof window !== 'undefined'
    ? (() => {
        const stored = localStorage.getItem('currentSession');
        return stored ? JSON.parse(stored) : null;
      })()
    : null;

  if (!currentSession) {
    return (
      <div>
        <div className="page-header">
          <h1>报表导出</h1>
        </div>
        <Empty description="请先选择课程会期" style={{ marginTop: 50 }} />
      </div>
    );
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      message.success(`已导出 ${format.toUpperCase()} 文件`);
    }, 1500);
  };

  const bedAllocationColumns = [
    {
      title: '房间号',
      dataIndex: 'room',
      key: 'room',
      width: 100,
    },
    {
      title: '床位号',
      dataIndex: 'bed',
      key: 'bed',
      width: 80,
    },
    {
      title: '学员姓名',
      dataIndex: 'student',
      key: 'student',
      width: 120,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
      render: (gender: string) => (gender === 'M' ? '男' : '女'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          monk: '法师',
          old_student: '旧生',
          new_student: '新生',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
    },
  ];

  const bedAllocationData = [
    {
      key: 1,
      room: 'B101',
      bed: 1,
      student: '张三',
      gender: 'F',
      type: 'monk',
      priority: 1,
    },
    {
      key: 2,
      room: 'B101',
      bed: 2,
      student: '李四',
      gender: 'F',
      type: 'old_student',
      priority: 2,
    },
    {
      key: 3,
      room: 'B102',
      bed: 1,
      student: '王五',
      gender: 'F',
      type: 'new_student',
      priority: 3,
    },
  ];

  const meditationSeatColumns = [
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
      width: 80,
    },
    {
      title: '座位号',
      dataIndex: 'seat',
      key: 'seat',
      width: 100,
    },
    {
      title: '学员姓名',
      dataIndex: 'student',
      key: 'student',
      width: 120,
    },
    {
      title: '年龄段',
      dataIndex: 'ageGroup',
      key: 'ageGroup',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
      render: (gender: string) => (gender === 'M' ? '男' : '女'),
    },
    {
      title: '座位类型',
      dataIndex: 'seatType',
      key: 'seatType',
      width: 100,
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          student: '学员座',
          monk: '法师座',
          dharma_worker: '法工座',
        };
        return typeMap[type] || type;
      },
    },
  ];

  const meditationSeatData = [
    {
      key: 1,
      region: 'A',
      seat: 'A1',
      student: '张三',
      ageGroup: '18-30',
      gender: 'F',
      seatType: 'monk',
    },
    {
      key: 2,
      region: 'A',
      seat: 'A2',
      student: '李四',
      ageGroup: '30-40',
      gender: 'F',
      seatType: 'student',
    },
    {
      key: 3,
      region: 'B',
      seat: 'B1',
      student: '王五',
      ageGroup: '40-55',
      gender: 'M',
      seatType: 'student',
    },
  ];

  const stats = {
    totalStudents: 180,
    allocatedBeds: 165,
    allocatedSeats: 165,
    conflicts: 3,
  };

  return (
    <div>
      <div className="page-header">
        <h1>报表导出</h1>
        <p className="description">
          生成和导出房间分配、禅堂座位等报表
        </p>
      </div>

      {/* 快速导出按钮 */}
      <Card title="快速导出" style={{ marginBottom: 24 }}>
        <Space>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            loading={exporting}
            onClick={() => handleExport('excel')}
          >
            导出 Excel
          </Button>
          <Button
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={() => handleExport('pdf')}
          >
            导出 PDF
          </Button>
          <Button icon={<PrinterOutlined />}>
            打印
          </Button>
        </Space>
      </Card>

      {/* 统计摘要 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总学员数"
              value={stats.totalStudents}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已分配床位"
              value={stats.allocatedBeds}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已分配座位"
              value={stats.allocatedSeats}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理冲突"
              value={stats.conflicts}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 报表选择和预览 */}
      <Card title="报表预览">
        <Space style={{ marginBottom: 16 }}>
          <span>选择报表类型：</span>
          <Select
            style={{ width: 200 }}
            value={reportType}
            onChange={setReportType}
            options={[
              { value: 'bed', label: '房间分配报表' },
              { value: 'meditation', label: '禅堂座位报表' },
            ]}
          />
        </Space>

        {reportType === 'bed' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>房间分配报表</h3>
            <Table
              columns={bedAllocationColumns}
              dataSource={bedAllocationData}
              pagination={{
                pageSize: 20,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              size="small"
            />
          </div>
        )}

        {reportType === 'meditation' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>禅堂座位报表</h3>
            <Table
              columns={meditationSeatColumns}
              dataSource={meditationSeatData}
              pagination={{
                pageSize: 20,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              size="small"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
