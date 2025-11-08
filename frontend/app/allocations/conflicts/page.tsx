'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Tag, Empty, App, Alert } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';

export default function Conflicts() {
  const { message } = App.useApp();
  const [conflicts, setConflicts] = useState([
    {
      id: 1,
      studentName: '张三',
      conflictType: 'companion_separated',
      description: '同伴 李四 没有分配到同一房间',
      status: 'unresolved',
    },
    {
      id: 2,
      studentName: '王五',
      conflictType: 'gender_mismatch',
      description: '女性学员分配到男众房间',
      status: 'unresolved',
    },
    {
      id: 3,
      studentName: '赵六',
      conflictType: 'type_mismatch',
      description: '法师分配到新生房间',
      status: 'unresolved',
    },
  ]);

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
          <h1>冲突管理</h1>
        </div>
        <Alert
          message="请先选择课程会期"
          description="从顶部菜单栏选择要操作的禅修中心和课程会期后，可查看和处理分配冲突"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Empty description="暂无数据" style={{ marginTop: 50 }} />
      </div>
    );
  }

  const handleResolve = (id: number) => {
    Modal.confirm({
      title: '标记为已解决',
      content: '确定要标记该冲突为已解决吗？',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        setConflicts(conflicts.map(c =>
          c.id === id ? { ...c, status: 'resolved' } : c
        ));
        message.success('冲突已标记为已解决');
      },
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '删除冲突',
      content: '删除冲突记录（这不会改变分配），确定吗？',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        setConflicts(conflicts.filter(c => c.id !== id));
        message.success('冲突已删除');
      },
    });
  };

  const columns = [
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
    },
    {
      title: '冲突类型',
      dataIndex: 'conflictType',
      key: 'conflictType',
      width: 150,
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          companion_separated: '同伴分离',
          overcapacity: '超额分配',
          type_mismatch: '类型不匹配',
          gender_mismatch: '性别不匹配',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'resolved' ? 'green' : 'red'}>
          {status === 'resolved' ? '已解决' : '未解决'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'unresolved' && (
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleResolve(record.id)}
            >
              标记已解决
            </Button>
          )}
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const unresolvedCount = conflicts.filter(c => c.status === 'unresolved').length;
  const resolvedCount = conflicts.filter(c => c.status === 'resolved').length;

  return (
    <div>
      <div className="page-header">
        <h1>冲突管理</h1>
        <p className="description">
          查看和处理分配中的冲突，例如同伴分离、性别不匹配等
        </p>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <span>
          未解决：
          <Tag color="red">{unresolvedCount}</Tag>
        </span>
        <span>
          已解决：
          <Tag color="green">{resolvedCount}</Tag>
        </span>
      </Space>

      <Table
        columns={columns}
        dataSource={conflicts}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showTotal: (total) => `共 ${total} 个冲突`,
        }}
        locale={{
          emptyText: '暂无冲突，分配已完美完成！',
        }}
      />

      {unresolvedCount > 0 && (
        <div style={{ marginTop: 24, padding: 16, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
          <strong>提示：</strong>还有 {unresolvedCount} 个未解决的冲突，建议逐一审查和处理
        </div>
      )}
    </div>
  );
}
