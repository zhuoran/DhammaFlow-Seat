'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Input, Select, Empty, Modal, message } from 'antd';
import { SwapOutlined, EditOutlined } from '@ant-design/icons';

export default function AllocationDetails() {
  const [allocations, setAllocations] = useState([
    { id: 1, roomNumber: 'B101', studentName: '张三', studentType: '法师', gender: '女' },
    { id: 2, roomNumber: 'B102', studentName: '李四', studentType: '旧生', gender: '女' },
    { id: 3, roomNumber: 'B103', studentName: '王五', studentType: '新生', gender: '女' },
  ]);

  const [searchText, setSearchText] = useState('');

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
          <h1>房间分配详情</h1>
        </div>
        <Empty description="请先选择课程会期" style={{ marginTop: 50 }} />
      </div>
    );
  }

  const handleSwap = () => {
    Modal.info({
      title: '房间交换',
      content: '此功能用于在已分配的学员之间快速交换房间。选择两个学员后可执行交换操作。',
      okText: '确定',
    });
  };

  const columns = [
    {
      title: '房间号',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      width: 100,
      sorter: (a: any, b: any) => a.roomNumber.localeCompare(b.roomNumber),
    },
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索学员"
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 8 }}
          />
        </div>
      ),
    },
    {
      title: '学员类型',
      dataIndex: 'studentType',
      key: 'studentType',
      width: 100,
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          monk: '法师',
          old_student: '旧生',
          new_student: '新生',
        };
        return typeMap[type] || type;
      },
      filters: [
        { text: '法师', value: 'monk' },
        { text: '旧生', value: 'old_student' },
        { text: '新生', value: 'new_student' },
      ],
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => (gender === 'M' ? '男' : '女'),
      filters: [
        { text: '男', value: 'M' },
        { text: '女', value: 'F' },
      ],
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: () => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<SwapOutlined />}
            onClick={handleSwap}
          >
            交换
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const filteredData = allocations.filter((item) =>
    item.studentName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>房间分配详情</h1>
        <p className="description">
          查看所有学员的房间分配，支持搜索、筛选和快速交换操作
        </p>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索房间号或学员名"
          style={{ width: 200 }}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button onClick={handleSwap} icon={<SwapOutlined />}>
          快速交换
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条分配记录`,
        }}
        locale={{
          emptyText: '暂无分配记录',
        }}
      />
    </div>
  );
}
