'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Row,
  Col,
  Statistic,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { roomApi, bedApi } from '@/services/api';

export default function RoomsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [bedForm] = Form.useForm();
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [currentCenter, setCurrentCenter] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [filterFloor, setFilterFloor] = useState<number | null>(null);
  const [filterGender, setFilterGender] = useState<string | null>(null);
  const [isBedModalVisible, setIsBedModalVisible] = useState(false);
  const [editingBed, setEditingBed] = useState<any>(null);
  const [selectedRoomForBed, setSelectedRoomForBed] = useState<any>(null);
  const [expandedRoomIds, setExpandedRoomIds] = useState<number[]>([]);

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

  // 加载床位列表
  const loadBeds = async () => {
    try {
      const response = await bedApi.getBeds();
      if (response.data?.data?.list) {
        setBeds(response.data.data.list);
      } else if (Array.isArray(response.data?.data)) {
        setBeds(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load beds:', error);
    }
  };

  // 加载特定房间的床位
  const loadBedsForRoom = async (roomId: number) => {
    try {
      // 展开房间时加载其床位
      await loadBeds();
      // 如果需要展开，添加到expandedRoomIds
      setExpandedRoomIds((prev) =>
        prev.includes(roomId) ? prev : [...prev, roomId]
      );
    } catch (error) {
      console.error('Failed to load beds for room:', error);
    }
  };

  // 获取特定房间的床位
  const getBedsForRoom = (roomId: number) => {
    return beds.filter((bed) => bed.roomId === roomId);
  };

  // 添加床位
  const handleAddBed = (room: any) => {
    bedForm.resetFields();
    setEditingBed(null);
    setSelectedRoomForBed(room);
    setIsBedModalVisible(true);
  };

  // 删除床位
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

  // 保存床位
  const handleSaveBed = async () => {
    try {
      const values = await bedForm.validateFields();
      values.roomId = selectedRoomForBed.id;

      if (editingBed) {
        await bedApi.updateBed(editingBed.id, values);
        message.success('床位更新成功');
      } else {
        await bedApi.createBed(values);
        message.success('床位创建成功');
      }

      setIsBedModalVisible(false);
      bedForm.resetFields();
      loadBeds();
    } catch (error) {
      console.error('Failed to save bed:', error);
      message.error(editingBed ? '床位更新失败' : '床位创建失败');
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

  // 计算房间统计数据
  const roomStats = useMemo(() => {
    const stats: any = {
      female: { single: 0, double: 0, total: 0 },
      male: { single: 0, double: 0, total: 0 },
      public: { count: 0, rooms: [] },
    };

    rooms.forEach((room: any) => {
      // 按性别和容量分类统计
      // genderArea 字段表示性别区域（男/女）
      // capacity 表示床位数量（1=单间，2=双人间）

      const genderArea = room.genderArea === '男' ? 'male' : 'female';
      const isSingle = room.capacity === 1;
      const isPublic = room.notes?.includes('公共') || room.notes?.includes('男女');

      if (isPublic) {
        stats.public.count++;
        stats.public.rooms.push(room.roomNumber);
      } else if (genderArea === 'female') {
        stats.female.total++;
        if (isSingle) {
          stats.female.single++;
        } else {
          stats.female.double++;
        }
      } else {
        stats.male.total++;
        if (isSingle) {
          stats.male.single++;
        } else {
          stats.male.double++;
        }
      }
    });

    return stats;
  }, [rooms]);

  // 获取所有楼层用于过滤选项
  const floorOptions = useMemo(() => {
    const floors = new Set<number>();
    rooms.forEach((room: any) => {
      if (room.floor) {
        floors.add(room.floor);
      }
    });
    return Array.from(floors)
      .sort((a, b) => a - b)
      .map((floor) => ({ label: `${floor}楼`, value: floor }));
  }, [rooms]);

  // 过滤房间列表
  const filteredRooms = useMemo(() => {
    return rooms.filter((room: any) => {
      // 楼层过滤
      if (filterFloor !== null && room.floor !== filterFloor) {
        return false;
      }

      // 性别区域过滤
      if (filterGender) {
        // 使用genderArea字段判断性别（男/女）
        const roomGender = room.genderArea === '男' ? 'male' : 'female';
        if (roomGender !== filterGender) {
          return false;
        }
      }

      return true;
    });
  }, [rooms, filterFloor, filterGender]);

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

      {/* 统计信息卡片 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="女众单间"
              value={roomStats.female.single}
              valueStyle={{ color: '#ff85c0' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="女众双人间"
              value={roomStats.female.double}
              valueStyle={{ color: '#ff85c0' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="女众合计"
              value={roomStats.female.total}
              valueStyle={{ color: '#ff85c0' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="男众单间"
              value={roomStats.male.single}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="男众双人间"
              value={roomStats.male.double}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="男众合计"
              value={roomStats.male.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="公共房间"
              value={roomStats.public.count}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>

        {/* 公共房间说明 */}
        {roomStats.public.count > 0 && (
          <>
            <Divider />
            <Alert
              message="公共房间（男女共用）"
              description={`包括: ${roomStats.public.rooms.join(', ')}。女众不足时可征用，默认放在男众区。`}
              type="warning"
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
          </>
        )}

        <Divider />

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
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div>
            <label style={{ marginRight: 8 }}>按楼层过滤：</label>
            <Select
              style={{ width: 150 }}
              placeholder="请选择楼层"
              allowClear
              value={filterFloor}
              onChange={setFilterFloor}
              options={[
                { label: '全部楼层', value: null },
                ...floorOptions,
              ]}
            />
          </div>
          <div>
            <label style={{ marginRight: 8 }}>按性别区域过滤：</label>
            <Select
              style={{ width: 150 }}
              placeholder="请选择性别区域"
              allowClear
              value={filterGender}
              onChange={setFilterGender}
              options={[
                { label: '全部区域', value: null },
                { label: '女众', value: 'female' },
                { label: '男众', value: 'male' },
              ]}
            />
          </div>
          <span style={{ color: '#666' }}>
            共 {filteredRooms.length} 个房间
          </span>
        </div>
        <Table
          columns={columns}
          dataSource={filteredRooms}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个房间`,
          }}
          expandable={{
            expandedRowKeys: expandedRoomIds,
            onExpand: (expanded, record) => {
              if (expanded) {
                loadBedsForRoom(record.id);
              } else {
                setExpandedRoomIds((prev) =>
                  prev.filter((id) => id !== record.id)
                );
              }
            },
            expandedRowRender: (room) => (
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: 16, fontWeight: 'bold' }}>
                  床位列表 (共 {getBedsForRoom(room.id).length} 个)
                </div>
                {getBedsForRoom(room.id).length > 0 ? (
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {getBedsForRoom(room.id).map((bed) => (
                        <div
                          key={bed.id}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span>床号: {bed.bedNumber}</span>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteBed(bed.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#999', marginBottom: 16 }}>
                    暂无床位
                  </div>
                )}
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddBed(room)}
                >
                  添加床位
                </Button>
              </div>
            ),
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
            name="genderArea"
            label="性别区域"
            rules={[{ required: true, message: '请选择性别区域' }]}
          >
            <Select
              placeholder="选择性别区域"
              options={[
                { label: '女众', value: '女' },
                { label: '男众', value: '男' },
              ]}
            />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea
              rows={3}
              placeholder="添加房间备注信息"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 床位管理Modal */}
      <Modal
        title={`添加床位 - 房间 ${selectedRoomForBed?.roomNumber}`}
        open={isBedModalVisible}
        onOk={handleSaveBed}
        onCancel={() => {
          setIsBedModalVisible(false);
          bedForm.resetFields();
          setSelectedRoomForBed(null);
        }}
        okText="保存"
        cancelText="取消"
      >
        <Form form={bedForm} layout="vertical">
          <Form.Item
            name="bedNumber"
            label="床号"
            rules={[{ required: true, message: '请输入床号' }]}
          >
            <InputNumber min={1} placeholder="床号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
