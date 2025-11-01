'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Card,
  Alert,
  App,
  message as antMessage,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { roomApi } from '@/services/api';

export default function RoomsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [currentCenter, setCurrentCenter] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  // 初始化：从 localStorage 读取当前中心和会期
  useEffect(() => {
    const storedCenter = localStorage.getItem('currentCenter');
    const storedSession = localStorage.getItem('currentSession');

    if (storedCenter) {
      setCurrentCenter(JSON.parse(storedCenter));
    }
    if (storedSession) {
      setCurrentSession(JSON.parse(storedSession));
    }
    setIsHydrated(true);
  }, []);

  // 加载房间列表
  useEffect(() => {
    if (isHydrated && currentCenter?.id) {
      loadRooms();
    }
  }, [currentCenter?.id, isHydrated]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const response = await roomApi.getRooms(currentCenter.id);
      if (response.data?.data?.list) {
        setRooms(response.data.data.list);
      } else if (Array.isArray(response.data?.data)) {
        setRooms(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
      message.error('加载房间列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    form.resetFields();
    setEditingRoom(null);
    setIsModalVisible(true);
  };

  const handleEditRoom = (room: any) => {
    form.setFieldsValue(room);
    setEditingRoom(room);
    setIsModalVisible(true);
  };

  const handleDeleteRoom = (roomId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个房间吗？删除后将无法恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await roomApi.deleteRoom(roomId);
          message.success('房间删除成功');
          loadRooms();
        } catch (error) {
          console.error('Failed to delete room:', error);
          message.error('房间删除失败');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingRoom) {
        // 更新
        await roomApi.updateRoom(editingRoom.id, values);
        message.success('房间更新成功');
      } else {
        // 新增
        values.centerId = currentCenter.id;
        await roomApi.createRoom(values);
        message.success('房间创建成功');
      }

      setIsModalVisible(false);
      form.resetFields();
      loadRooms();
    } catch (error) {
      console.error('Failed to save room:', error);
      message.error(editingRoom ? '房间更新失败' : '房间创建失败');
    }
  };

  const columns = [
    {
      title: '房号',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      width: 100,
    },
    {
      title: '建筑',
      dataIndex: 'building',
      key: 'building',
      width: 80,
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 80,
    },
    {
      title: '房间类型',
      dataIndex: 'roomType',
      key: 'roomType',
      width: 120,
      render: (type: string) => {
        const typeMap: any = {
          monk: '法师房',
          old_student: '旧生房',
          new_student: '新生房',
          other: '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: any = {
          ENABLED: '启用',
          DISABLED: '禁用',
        };
        return statusMap[status] || status;
      },
    },
    {
      title: '是否预留',
      dataIndex: 'reserved',
      key: 'reserved',
      width: 80,
      render: (reserved: boolean) => (reserved ? '是' : '否'),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRoom(record)}
          >
            编辑
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRoom(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (!isHydrated) {
    return <div>加载中...</div>;
  }

  if (!currentCenter) {
    return (
      <div>
        <div className="page-header">
          <h1>房间管理</h1>
        </div>
        <Alert
          message="请先选择禅修中心"
          description="从顶部菜单栏选择禅修中心后，可查看和管理房间信息"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>房间管理</h1>
        <p className="description">{currentCenter.centerName}</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddRoom}
          size="large"
        >
          新增房间
        </Button>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={rooms}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个房间`,
          }}
        />
      </Card>

      <Modal
        title={editingRoom ? '编辑房间' : '新增房间'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="roomNumber"
            label="房号"
            rules={[{ required: true, message: '请输入房号' }]}
          >
            <Input placeholder="例如: 101, 202A" />
          </Form.Item>

          <Form.Item
            name="building"
            label="建筑"
            rules={[{ required: true, message: '请输入建筑号' }]}
          >
            <Input placeholder="例如: A, B, C" />
          </Form.Item>

          <Form.Item
            name="floor"
            label="楼层"
            rules={[{ required: true, message: '请输入楼层号' }]}
          >
            <InputNumber min={1} placeholder="楼层号" />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="容量（床数）"
            rules={[{ required: true, message: '请输入房间容量' }]}
          >
            <InputNumber min={1} max={10} placeholder="房间容量" />
          </Form.Item>

          <Form.Item
            name="roomType"
            label="房间类型"
            rules={[{ required: true, message: '请选择房间类型' }]}
          >
            <Select
              placeholder="选择房间类型"
              options={[
                { label: '法师房', value: 'monk' },
                { label: '旧生房', value: 'old_student' },
                { label: '新生房', value: 'new_student' },
                { label: '其他', value: 'other' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="选择状态"
              options={[
                { label: '启用', value: 'ENABLED' },
                { label: '禁用', value: 'DISABLED' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="reserved"
            label="是否预留"
            valuePropName="checked"
          >
            <Select
              placeholder="选择是否预留"
              options={[
                { label: '是', value: true },
                { label: '否', value: false },
              ]}
            />
          </Form.Item>

          <Form.Item name="reservedFor" label="预留给">
            <Input placeholder="预留给谁（如果预留）" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea
              rows={3}
              placeholder="添加房间备注信息"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
