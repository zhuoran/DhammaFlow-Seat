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
  Row,
  Col,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { bedApi, roomApi } from '@/services/api';

export default function BedsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [beds, setBeds] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [editingBed, setEditingBed] = useState<any>(null);
  const [generateCount, setGenerateCount] = useState(2);

  // 初始化
  useEffect(() => {
    const storedCenter = localStorage.getItem('currentCenter');
    if (storedCenter) {
      setCurrentCenter(JSON.parse(storedCenter));
    }
    setIsHydrated(true);
  }, []);

  // 加载房间和床位列表
  useEffect(() => {
    if (isHydrated && currentCenter?.id) {
      loadRooms();
      loadBeds();
    }
  }, [currentCenter?.id, isHydrated]);

  const loadRooms = async () => {
    try {
      const response = await roomApi.getRooms(currentCenter.id);
      if (response.data?.data?.list) {
        setRooms(response.data.data.list);
      } else if (Array.isArray(response.data?.data)) {
        setRooms(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const loadBeds = async () => {
    setLoading(true);
    try {
      const response = await bedApi.getBeds();
      if (response.data?.data?.list) {
        setBeds(response.data.data.list);
      } else if (Array.isArray(response.data?.data)) {
        setBeds(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load beds:', error);
      message.error('加载床位列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 根据房间筛选床位
  const filteredBeds = selectedRoom
    ? beds.filter((b) => b.roomId === selectedRoom.id)
    : beds;

  const handleAddBed = () => {
    if (!selectedRoom) {
      message.warning('请先选择房间');
      return;
    }
    form.resetFields();
    setEditingBed(null);
    setIsModalVisible(true);
  };

  const handleGenerateBeds = async () => {
    if (!selectedRoom) {
      message.warning('请先选择房间');
      return;
    }

    Modal.confirm({
      title: '自动生成床位',
      content: `是否为房间 "${selectedRoom.roomNumber}" 生成 ${generateCount} 个床位？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const bedsToCreate = Array.from({ length: generateCount }, (_, i) => ({
            roomId: selectedRoom.id,
            bedNumber: i + 1,
            position: i % 2 === 0 ? '下铺' : '上铺',
            status: 'AVAILABLE',
          }));

          await bedApi.createBedsBatch(bedsToCreate);
          message.success('床位生成成功');
          loadBeds();
        } catch (error) {
          console.error('Failed to generate beds:', error);
          message.error('床位生成失败');
        }
      },
    });
  };

  const handleEditBed = (bed: any) => {
    form.setFieldsValue(bed);
    setEditingBed(bed);
    setIsModalVisible(true);
  };

  const handleDeleteBed = (bedId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个床位吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await bedApi.deleteBed(bedId);
          message.success('床位删除成功');
          loadBeds();
        } catch (error) {
          console.error('Failed to delete bed:', error);
          message.error('床位删除失败');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingBed) {
        await bedApi.updateBed(editingBed.id, values);
        message.success('床位更新成功');
      } else {
        values.roomId = selectedRoom.id;
        await bedApi.createBed(values);
        message.success('床位创建成功');
      }

      setIsModalVisible(false);
      form.resetFields();
      loadBeds();
    } catch (error) {
      console.error('Failed to save bed:', error);
      message.error(editingBed ? '床位更新失败' : '床位创建失败');
    }
  };

  const columns = [
    {
      title: '房号',
      dataIndex: ['roomId'],
      key: 'roomId',
      width: 100,
      render: (roomId: number) => {
        const room = rooms.find((r) => r.id === roomId);
        return room?.roomNumber || '-';
      },
    },
    {
      title: '床号',
      dataIndex: 'bedNumber',
      key: 'bedNumber',
      width: 80,
    },
    {
      title: '位置',
      dataIndex: 'position',
      key: 'position',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: any = {
          AVAILABLE: '可用',
          OCCUPIED: '已占用',
          RESERVED: '已预留',
        };
        return statusMap[status] || status;
      },
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
            onClick={() => handleEditBed(record)}
          >
            编辑
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBed(record.id)}
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
          <h1>床位管理</h1>
        </div>
        <Alert
          message="请先选择禅修中心"
          description="从顶部菜单栏选择禅修中心后，可查看和管理床位信息"
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
        <h1>床位管理</h1>
        <p className="description">{currentCenter.centerName}</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Form.Item label="选择房间" style={{ marginBottom: 0 }}>
              <Select
                placeholder="选择房间"
                value={selectedRoom?.id}
                onChange={(roomId) => {
                  const room = rooms.find((r) => r.id === roomId);
                  setSelectedRoom(room);
                }}
                options={rooms.map((r) => ({
                  value: r.id,
                  label: `${r.building}栋 ${r.floor}层 ${r.roomNumber}号 (容量: ${r.capacity})`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddBed}
                disabled={!selectedRoom}
              >
                新增床位
              </Button>
            </Space>
          </Col>
          <Col span={12}>
            {selectedRoom && (
              <Space>
                <span>快速生成：</span>
                <InputNumber
                  min={1}
                  max={10}
                  value={generateCount}
                  onChange={(val) => setGenerateCount(val || 2)}
                  style={{ width: 60 }}
                />
                <span>个床位</span>
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleGenerateBeds}
                >
                  生成
                </Button>
              </Space>
            )}
          </Col>
        </Row>
      </Card>

      {selectedRoom && (
        <Card
          title={`房间 ${selectedRoom.building}栋 ${selectedRoom.floor}层 ${selectedRoom.roomNumber}号 - 床位列表 (共 ${filteredBeds.length} 个)`}
        >
          <Table
            columns={columns}
            dataSource={filteredBeds}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个床位`,
            }}
          />
        </Card>
      )}

      <Modal
        title={editingBed ? '编辑床位' : '新增床位'}
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
            name="bedNumber"
            label="床号"
            rules={[{ required: true, message: '请输入床号' }]}
          >
            <InputNumber min={1} placeholder="床号" />
          </Form.Item>

          <Form.Item
            name="position"
            label="位置"
            rules={[{ required: true, message: '请选择位置' }]}
          >
            <Select
              placeholder="选择位置"
              options={[
                { label: '下铺', value: '下铺' },
                { label: '上铺', value: '上铺' },
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
                { label: '可用', value: 'AVAILABLE' },
                { label: '已占用', value: 'OCCUPIED' },
                { label: '已预留', value: 'RESERVED' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
