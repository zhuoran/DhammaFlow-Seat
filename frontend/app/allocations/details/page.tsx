'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Empty, Modal, message, Alert, Spin } from 'antd';
import { SwapOutlined, EditOutlined } from '@ant-design/icons';
import { allocationApi, studentApi } from '@/services/api';

export default function AllocationDetails() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
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

  // 加载分配详情
  useEffect(() => {
    if (isHydrated && currentSession?.id) {
      loadAllocationDetails();
    }
  }, [currentSession?.id, isHydrated]);

  const loadAllocationDetails = async () => {
    setLoading(true);
    try {
      const response = await allocationApi.getAllocationsBySession(currentSession.id);
      if (response.data?.code === 200 || response.data?.code === 0) {
        const allocationList = response.data.data?.list || [];

        // 合并分配信息和学员信息
        const enrichedAllocations = await Promise.all(
          allocationList.map(async (alloc: any) => {
            try {
              const studentRes = await studentApi.getStudent(alloc.studentId);
              const student = (studentRes.data?.data || {}) as any;
              const bedRes = await fetch(`http://192.168.2.250:8080/api/beds/${alloc.bedId}`).then(r => r.json());
              const bed = (bedRes.data || {}) as any;
              const roomRes = await fetch(`http://192.168.2.250:8080/api/rooms/${bed.roomId}`).then(r => r.json());
              const room = (roomRes.data || {}) as any;

              return {
                id: alloc.id,
                allocationId: alloc.id,
                roomNumber: room.roomNumber || `房间 ${bed.roomId}`,
                bedNumber: bed.bedNumber || 1,
                studentId: student.id,
                studentName: student.name || '未知',
                studentNumber: student.studentNumber || '',
                studentType: student.studentType === 'old' ? 'old_student' : student.studentType === 'new' ? 'new_student' : 'monk',
                gender: student.gender === 'M' ? 'M' : 'F',
                age: student.age || 0,
                idCard: student.idCard || '',
              };
            } catch (error) {
              console.error('Error enriching allocation:', error);
              return {
                id: alloc.id,
                allocationId: alloc.id,
                roomNumber: '未知',
                bedNumber: 1,
                studentId: alloc.studentId,
                studentName: '未知',
                studentNumber: '',
                studentType: 'new_student',
                gender: 'M',
                age: 0,
              };
            }
          })
        );

        setAllocations(enrichedAllocations);
      }
    } catch (error) {
      console.error('Failed to load allocation details:', error);
      message.error('加载分配详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated) {
    return null;
  }

  if (!currentSession) {
    return (
      <div>
        <div className="page-header">
          <h1>房间分配详情</h1>
        </div>
        <Alert
          message="请先选择课程会期"
          description="从顶部菜单栏选择要操作的禅修中心和课程会期后，可查看分配详情"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Empty description="暂无数据" style={{ marginTop: 50 }} />
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

      <Spin spinning={loading}>
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
      </Spin>
    </div>
  );
}
