'use client';

import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Select,
  Space,
  Alert,
  App,
  Tabs,
  Empty,
  Divider,
  Tag,
  Spin,
} from 'antd';
import {
  DeleteOutlined,
} from '@ant-design/icons';
import { studentApi, roomApi, bedApi, allocationApi } from '@/services/api';

interface AllocationDetail extends any {
  student?: any;
  bed?: any;
  room?: any;
}

export default function ManualAllocationPage() {
  const { message } = App.useApp();
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [currentCenter, setCurrentCenter] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<AllocationDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [roomBeds, setRoomBeds] = useState<any[]>([]);

  // 初始化
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

  // 加载数据
  useEffect(() => {
    if (isHydrated && currentSession?.id && currentCenter?.id) {
      loadData();
    }
  }, [currentSession?.id, currentCenter?.id, isHydrated]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载学员
      const studentsRes = await studentApi.getStudents(
        currentSession.id,
        currentCenter.id
      );
      if (studentsRes.data?.data) {
        setStudents(studentsRes.data.data);
      }

      // 加载房间
      const roomsRes = await roomApi.getRooms(currentCenter.id);
      if (roomsRes.data?.data?.list) {
        setRooms(roomsRes.data.data.list);
      } else if (Array.isArray(roomsRes.data?.data)) {
        setRooms(roomsRes.data.data);
      }

      // 加载分配记录
      const allocationsRes = await allocationApi.getAllocationsBySession(
        currentSession.id
      );
      if (allocationsRes.data?.data?.list) {
        const allocsList = allocationsRes.data.data.list;
        // 增强分配数据，添加学员、房间、床位信息
        const enhanced = allocsList.map((alloc: any) => ({
          ...alloc,
          student: students.find((s) => s.id === alloc.studentId),
        }));
        setAllocations(enhanced);
      } else if (Array.isArray(allocationsRes.data?.data)) {
        const allocsList = allocationsRes.data.data;
        const enhanced = allocsList.map((alloc: any) => ({
          ...alloc,
          student: students.find((s) => s.id === alloc.studentId),
        }));
        setAllocations(enhanced);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBed = (student: any) => {
    setSelectedStudent(student);
    setSelectedRoom(null);
    setSelectedBed(null);
    setRoomBeds([]);
    setIsModalVisible(true);
  };

  const handleRoomChange = async (roomId: number) => {
    const room = rooms.find((r) => r.id === roomId);
    setSelectedRoom(room);
    setSelectedBed(null);

    // 加载该房间的床位
    try {
      const bedsRes = await bedApi.getBeds();
      const allBeds = bedsRes.data?.data?.list || (Array.isArray(bedsRes.data?.data) ? bedsRes.data.data : []);
      // 过滤出该房间的可用床位
      const availableBeds = allBeds.filter(
        (b: any) =>
          b.roomId === roomId &&
          b.status === 'AVAILABLE'
      );
      setRoomBeds(availableBeds);
    } catch (error) {
      console.error('Failed to load beds:', error);
      message.error('加载床位失败');
    }
  };

  const handleModalOk = async () => {
    if (!selectedBed) {
      message.warning('请选择床位');
      return;
    }

    try {
      const allocationData = {
        sessionId: currentSession.id,
        studentId: selectedStudent.id,
        bedId: selectedBed.id,
        allocationType: 'MANUAL',
        allocationReason: '手动分配',
        isTemporary: false,
        conflictFlag: false,
      };

      // 检查是否已有分配记录
      const existingAllocation = allocations.find(
        (a) => a.studentId === selectedStudent.id
      );

      if (existingAllocation) {
        // 更新
        await allocationApi.updateAllocation(
          existingAllocation.id,
          allocationData
        );
        message.success('分配更新成功');
      } else {
        // 新增
        await allocationApi.createAllocation(allocationData);
        message.success('分配成功');
      }

      setIsModalVisible(false);
      setSelectedStudent(null);
      setSelectedBed(null);
      setSelectedRoom(null);
      loadData();
    } catch (error) {
      console.error('Failed to assign bed:', error);
      message.error('分配失败');
    }
  };

  const handleUnassign = (allocationId: number) => {
    Modal.confirm({
      title: '确认移除分配',
      content: '确定要移除这个学员的分配吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await allocationApi.deleteAllocation(allocationId);
          message.success('分配移除成功');
          loadData();
        } catch (error) {
          console.error('Failed to remove allocation:', error);
          message.error('移除失败');
        }
      },
    });
  };

  // 获取未分配的学员
  const unallocatedStudents = students.filter(
    (s) => !allocations.find((a) => a.studentId === s.id)
  );

  // 按房间分组的分配
  const allocationsByRoom = (roomId: number) => {
    return allocations.filter((a) => {
      const bed = rooms.find((r) => r.id === roomId);
      return a.bedId && bed;
    });
  };

  if (!isHydrated) {
    return <div>加载中...</div>;
  }

  if (!currentSession || !currentCenter) {
    return (
      <div>
        <div className="page-header">
          <h1>手动分配</h1>
        </div>
        <Alert
          message="请先选择禅修中心和课程会期"
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
        <h1>手动分配</h1>
        <p className="description">
          {currentCenter.centerName} - {currentSession.courseType} (
          {currentSession.startDate})
        </p>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
                  {students.length}
                </div>
                <div style={{ color: '#8c8c8c', marginTop: 8 }}>总学员数</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                  {allocations.length}
                </div>
                <div style={{ color: '#8c8c8c', marginTop: 8 }}>已分配</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}
                >
                  {unallocatedStudents.length}
                </div>
                <div style={{ color: '#8c8c8c', marginTop: 8 }}>待分配</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
                  {rooms.length}
                </div>
                <div style={{ color: '#8c8c8c', marginTop: 8 }}>房间数</div>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 未分配学员列表 */}
        <Card title="待分配学员" style={{ marginBottom: 24 }}>
          {unallocatedStudents.length === 0 ? (
            <Empty description="所有学员已分配" />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {unallocatedStudents.map((student) => (
                <Card
                  key={student.id}
                  size="small"
                  style={{ width: 200, cursor: 'pointer' }}
                  onClick={() => handleAssignBed(student)}
                >
                  <div style={{ marginBottom: 8 }}>
                    <strong>{student.name}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                    <div>
                      <Tag
                        color={
                          student.totalPractices > 0 ? 'green' : 'orange'
                        }
                      >
                        {student.totalPractices > 0 ? '旧生' : '新生'}
                      </Tag>
                      <Tag>{student.gender === 'M' ? '男' : '女'}</Tag>
                    </div>
                  </div>
                  <Button type="primary" size="small" block>
                    分配房间
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* 房间分配情况 */}
        <Card title="房间分配情况">
          {rooms.length === 0 ? (
            <Empty description="还没有创建房间" />
          ) : (
            <Tabs
              items={rooms.map((room) => {
                const roomAllocations = allocations.filter(
                  (a) =>
                    a.bedId &&
                    a.student
                );
                return {
                  key: String(room.id),
                  label: `${room.building}栋 ${room.floor}层 ${room.roomNumber}号 (${roomAllocations.length}/${room.capacity})`,
                  children: (
                    <div>
                      {roomAllocations.length === 0 ? (
                        <Empty description="房间暂无分配" />
                      ) : (
                        <Table
                          dataSource={roomAllocations}
                          columns={[
                            {
                              title: '学员姓名',
                              dataIndex: ['student', 'name'],
                              key: 'name',
                            },
                            {
                              title: '学员类型',
                              key: 'studentType',
                              render: (_: any, record: any) => {
                                const isOldStudent = record.student?.totalPractices > 0;
                                return isOldStudent ? '旧生' : '新生';
                              },
                            },
                            {
                              title: '性别',
                              dataIndex: ['student', 'gender'],
                              key: 'gender',
                              render: (gender: string) =>
                                gender === 'M' ? '男' : '女',
                            },
                            {
                              title: '操作',
                              key: 'action',
                              width: 120,
                              render: (_: any, record: any) => (
                                <Button
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() =>
                                    handleUnassign(record.id)
                                  }
                                >
                                  移除
                                </Button>
                              ),
                            },
                          ]}
                          rowKey="id"
                          pagination={false}
                        />
                      )}
                    </div>
                  ),
                };
              })}
            />
          )}
        </Card>
      </Spin>

      {/* 分配学员到床位的Modal */}
      <Modal
        title={`为 ${selectedStudent?.name} 分配床位`}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedStudent(null);
          setSelectedBed(null);
          setSelectedRoom(null);
          setRoomBeds([]);
        }}
        okText="确认分配"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            选择房间：
          </label>
          <Select
            placeholder="选择房间"
            value={selectedRoom?.id || undefined}
            onChange={(roomId) => handleRoomChange(roomId)}
            options={rooms.map((r) => ({
              value: r.id,
              label: `${r.building}栋 ${r.floor}层 ${r.roomNumber}号 (容量: ${r.capacity})`,
            }))}
          />
        </div>

        {selectedRoom && roomBeds.length > 0 && (
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              选择床位：
            </label>
            <Select
              placeholder="选择床位"
              value={selectedBed?.id || undefined}
              onChange={(bedId) => {
                const bed = roomBeds.find((b) => b.id === bedId);
                setSelectedBed(bed);
              }}
              options={roomBeds.map((b) => ({
                value: b.id,
                label: `${b.position} - ${b.bedNumber}号`,
              }))}
            />
          </div>
        )}

        {selectedRoom && roomBeds.length === 0 && (
          <Alert
            message="该房间没有可用床位"
            type="warning"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
      </Modal>
    </div>
  );
}
