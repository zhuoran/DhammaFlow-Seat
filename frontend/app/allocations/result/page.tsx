'use client';

import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Empty,
  Spin,
  Tag,
  Button,
  Space,
  Modal,
  Statistic,
  Alert,
  Divider,
  message,
  Tabs,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  HomeOutlined,
  SwapOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { roomApi, bedApi, allocationApi, studentApi } from '@/services/api';

interface Room {
  id: number;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  genderArea: string;
  students?: Student[];
  occupancy?: number;
}

interface Student {
  id: number;
  name: string;
  studentNumber: string;
  gender: string;
  studentType: string;
  age: number;
  bedNumber?: number;
  bedId?: number;
  allocationId?: number;
  studyTimes?: number;
  city?: string;
}

interface AllocationData {
  id: number;
  studentId: number;
  bedId: number;
  sessionId: number;
}

export default function AllocationResultPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [currentCenter, setCurrentCenter] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [filterGender, setFilterGender] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [swapMode, setSwapMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

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

  // 加载分配结果数据
  useEffect(() => {
    if (isHydrated && currentSession?.id && currentCenter?.id) {
      loadAllocationData();
    }
  }, [currentSession?.id, currentCenter?.id, isHydrated]);

  const loadAllocationData = async () => {
    setLoading(true);
    try {
      // 1. 获取所有房间
      const roomsRes = await roomApi.getRooms(currentCenter.id);
      let roomList: any[] = [];
      if (roomsRes.data?.data?.list) {
        roomList = roomsRes.data.data.list;
      } else if (Array.isArray(roomsRes.data?.data)) {
        roomList = roomsRes.data.data;
      }

      // 2. 获取所有分配
      const allocationsRes = await allocationApi.getAllocationsBySession(currentSession.id);
      let allocationList: AllocationData[] = [];
      if (allocationsRes.data?.data?.list) {
        allocationList = allocationsRes.data.data.list;
      } else if (Array.isArray(allocationsRes.data?.data)) {
        allocationList = allocationsRes.data.data;
      }

      // 3. 获取所有床位
      const bedsRes = await bedApi.getBeds();
      let bedMap: { [key: number]: any } = {};
      const bedList = bedsRes.data?.data?.list || (Array.isArray(bedsRes.data?.data) ? bedsRes.data.data : []);
      bedList.forEach((bed: any) => {
        bedMap[bed.id] = bed;
      });

      // 4. 为每个房间加载分配的学员
      const enrichedRooms: Room[] = [];
      for (const room of roomList) {
        const roomAllocations = allocationList.filter((alloc) => {
          const bed = bedMap[alloc.bedId];
          return bed && bed.roomId === room.id;
        });

        const students: Student[] = [];
        for (const alloc of roomAllocations) {
          try {
            const studentRes = await studentApi.getStudent(alloc.studentId);
            const student = (studentRes.data?.data || {}) as any;
            students.push({
              id: student.id,
              name: student.name || '未知',
              studentNumber: student.studentNumber || '',
              gender: student.gender === 'M' ? '男' : '女',
              studentType:
                student.category === '旧生'
                  ? 'old_student'
                  : student.category === '新生'
                  ? 'new_student'
                  : 'monk',
              age: student.age || 0,
              bedId: alloc.bedId,
              bedNumber: bedMap[alloc.bedId]?.bedNumber || 1,
              allocationId: alloc.id,
              studyTimes: student.studyTimes || 0,
              city: student.city || '未知',
            });
          } catch (error) {
            console.error('Error loading student:', error);
          }
        }

        enrichedRooms.push({
          id: room.id,
          roomNumber: room.roomNumber,
          building: room.building,
          floor: room.floor,
          capacity: room.capacity,
          genderArea: room.genderArea,
          students: students,
          occupancy: students.length,
        });
      }

      setRooms(enrichedRooms);
    } catch (error) {
      console.error('Failed to load allocation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = (allocationId: number) => {
    Modal.confirm({
      title: '确认移除',
      content: '确定要移除这个学员的分配吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await allocationApi.deleteAllocation(allocationId);
          loadAllocationData();
        } catch (error) {
          console.error('Failed to remove allocation:', error);
        }
      },
    });
  };

  // 处理学生选择
  const handleSelectStudent = (student: Student) => {
    if (selectedStudents.length === 0) {
      setSelectedStudents([student]);
    } else if (selectedStudents.length === 1) {
      if (selectedStudents[0].id === student.id) {
        setSelectedStudents([]);
      } else {
        setSelectedStudents([...selectedStudents, student]);
      }
    } else if (selectedStudents.length === 2) {
      setSelectedStudents([student]);
    }
  };

  // 执行交换操作
  const handleSwap = async () => {
    if (selectedStudents.length !== 2) {
      message.error('请选择两个学生进行交换');
      return;
    }

    Modal.confirm({
      title: '确认交换',
      content: `确定要交换 ${selectedStudents[0].name} 和 ${selectedStudents[1].name} 的床位吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await allocationApi.swapAllocations(
            selectedStudents[0].allocationId || 0,
            selectedStudents[1].allocationId || 0
          );
          message.success('交换成功');
          setSelectedStudents([]);
          setSwapMode(false);
          loadAllocationData();
        } catch (error) {
          message.error('交换失败');
          console.error('Failed to swap allocations:', error);
        }
      },
    });
  };

  // 检查学生是否被选中
  const isStudentSelected = (student: Student) => {
    return selectedStudents.some((s) => s.id === student.id);
  };

  // 过滤和搜索房间
  const getFilteredRooms = (genderFilter?: string) => {
    return rooms.filter((room) => {
      const matchesSearch =
        room.roomNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        room.students?.some((s) =>
          s.name.toLowerCase().includes(searchText.toLowerCase())
        );

      // 支持 "男众"/"男" 和 "女众"/"女" 格式
      const checkGenderMatch = (filter: string, gender: string) => {
        if (filter.includes('男') && gender.includes('男')) return true;
        if (filter.includes('女') && gender.includes('女')) return true;
        return false;
      };

      const matchesGender = genderFilter
        ? checkGenderMatch(genderFilter, room.genderArea)
        : !filterGender || checkGenderMatch(filterGender, room.genderArea);

      return matchesSearch && matchesGender;
    });
  };

  // 提取房间号中的数字部分
  const getRoomNumber = (roomNumber: string): number => {
    const match = roomNumber.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  // 按楼层分组房间，并按房间号奇偶性分类
  const groupRoomsByFloor = (roomList: Room[]) => {
    const floorMap = new Map<number, Room[]>();
    roomList.forEach((room) => {
      if (!floorMap.has(room.floor)) {
        floorMap.set(room.floor, []);
      }
      floorMap.get(room.floor)!.push(room);
    });
    return Array.from(floorMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([floor, roomList]) => {
        // 按房间号的数字部分分类为偶数（上排）和奇数（下排）
        const evenRooms = roomList.filter((room) => getRoomNumber(room.roomNumber) % 2 === 0).sort((a, b) => getRoomNumber(a.roomNumber) - getRoomNumber(b.roomNumber));
        const oddRooms = roomList.filter((room) => getRoomNumber(room.roomNumber) % 2 !== 0).sort((a, b) => getRoomNumber(a.roomNumber) - getRoomNumber(b.roomNumber));
        return { floor, evenRooms, oddRooms };
      });
  };

  // 检查是否存在混合性别分配（支持 "男众"/"男" 和 "女众"/"女" 格式）
  const hasMixedGender = rooms.some((r) => r.genderArea?.includes('男')) && rooms.some((r) => r.genderArea?.includes('女'));

  // 按性别获取过滤的房间
  const filteredRooms = getFilteredRooms();

  // 渲染房间卡片行的辅助函数
  const renderRoomRow = (roomList: Room[], label: string, gutter: [number, number] = [6, 6], colSpan = { xs: 24, sm: 12, md: 8, lg: 5, xl: 4 }) => {
    if (!roomList || roomList.length === 0) return null;

    return (
      <div
        key={label}
        style={{
          marginBottom: 8,
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          gap: '6px',
          paddingBottom: '8px',
          scrollBehavior: 'smooth',
        }}
      >
        {roomList.map((room) => (
          <div key={room.id} style={{ flex: '0 0 180px', minWidth: '180px' }}>
              <Card
                hoverable
                className="room-card"
                size="small"
                style={{
                  background:
                    room.occupancy === 1
                      ? '#f6ffed'
                      : room.occupancy === room.capacity
                      ? '#fafafa'
                      : '#fff',
                  borderColor:
                    room.occupancy === 1
                      ? '#95de64'
                      : room.occupancy === room.capacity ? '#d9d9d9' : '#1890ff',
                  borderWidth: room.occupancy === 1 ? 2 : 1,
                  padding: 8,
                }}
              >
                {/* 房间头部 */}
                <div style={{ marginBottom: 6 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 'bold',
                      marginBottom: 2,
                    }}
                  >
                    {room.building} {room.roomNumber}
                  </div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                    {room.genderArea} | {room.capacity}人
                  </div>
                </div>

                {/* 入住率进度条 */}
                <div style={{ marginBottom: 6 }}>
                  <div
                    style={{
                      height: 3,
                      background: '#f0f0f0',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${((room.occupancy || 0) / room.capacity) * 100}%`,
                        background:
                          room.occupancy === room.capacity
                            ? '#ff4d4f'
                            : '#52c41a',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#666',
                      marginTop: 2,
                      textAlign: 'right',
                    }}
                  >
                    {room.occupancy || 0}/{room.capacity}
                  </div>
                </div>

                <Divider style={{ margin: '4px 0' }} />

                {/* 学员列表 */}
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {room.students && room.students.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {room.students.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => {
                            if (swapMode) {
                              handleSelectStudent(student);
                            }
                          }}
                          style={{
                            padding: 5,
                            background: isStudentSelected(student) ? '#e6f7ff' : '#fafafa',
                            borderRadius: 2,
                            border: isStudentSelected(student) ? '1px solid #1890ff' : '1px solid #f0f0f0',
                            cursor: swapMode ? 'pointer' : 'default',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 2,
                            }}
                          >
                            <strong style={{ fontSize: 12 }}>{student.name}</strong>
                            {!swapMode && (
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() =>
                                  handleRemoveStudent(student.allocationId || 0)
                                }
                                style={{ padding: 0, minWidth: 'auto' }}
                              />
                            )}
                            {swapMode && isStudentSelected(student) && (
                              <Tag color="blue" style={{ fontSize: 9 }}>已选</Tag>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', marginBottom: 2 }}>
                            <Tag color={student.gender === '男' ? 'blue' : 'pink'} style={{ fontSize: 9, margin: 0, padding: '1px 5px' }}>
                              {student.gender}
                            </Tag>
                            <span style={{ fontSize: 11, color: '#666' }}>
                              {student.age}岁
                            </span>
                          </div>
                          <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>
                            <strong>床位:</strong> {student.bedNumber || '-'}号
                          </div>
                          <div style={{ fontSize: 10, color: '#888', lineHeight: '1.3' }}>
                            {student.city}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#8c8c8c', textAlign: 'center', fontSize: 11 }}>
                      房间空闲
                    </p>
                  )}
                </div>
              </Card>
            </div>
          ))}
      </div>
    );
  };

  // 计算统计信息
  const statistics = {
    totalRooms: rooms.length,
    occupiedRooms: rooms.filter((r) => r.occupancy && r.occupancy > 0).length,
    totalCapacity: rooms.reduce((sum, r) => sum + r.capacity, 0),
    totalAllocated: rooms.reduce((sum, r) => sum + (r.occupancy || 0), 0),
    occupancyRate:
      rooms.length > 0
        ? (
            (rooms.reduce((sum, r) => sum + (r.occupancy || 0), 0) /
              rooms.reduce((sum, r) => sum + r.capacity, 0)) *
            100
          ).toFixed(1)
        : 0,
  };

  if (!isHydrated || !currentSession) {
    return (
      <div>
        <div className="page-header">
          <h1>分配结果可视化</h1>
        </div>
        <Alert
          message="请先选择课程会期"
          description="从顶部菜单栏选择要查看的禅修中心和课程会期后，可查看分配结果"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Empty description="暂无数据" style={{ marginTop: 50 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>分配结果可视化</h1>
        <p className="description">
          房间分配可视化展示，便于快速调整学员分配
        </p>
      </div>

      {/* 统计信息 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="总房间数"
              value={statistics.totalRooms}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="已分配房间"
              value={statistics.occupiedRooms}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="总分配人数"
              value={statistics.totalAllocated}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="入住率"
              value={statistics.occupancyRate}
              suffix="%"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 搜索和过滤 */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={16}>
              <Input.Search
                placeholder="搜索房间号或学员名"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="按性别区域筛选"
                value={filterGender}
                onChange={setFilterGender}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: '男', value: '男' },
                  { label: '女', value: '女' },
                ]}
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8}>
              <Button
                type={swapMode ? 'primary' : 'default'}
                icon={<SwapOutlined />}
                block
                onClick={() => {
                  setSwapMode(!swapMode);
                  setSelectedStudents([]);
                }}
              >
                {swapMode ? '退出交换' : '进入交换模式'}
              </Button>
            </Col>
            <Col xs={12} sm={8}>
              <Button
                icon={<PrinterOutlined />}
                block
                onClick={() => {
                  window.location.href = '/allocations/print';
                }}
              >
                打印分配表
              </Button>
            </Col>
            {swapMode && selectedStudents.length === 2 && (
              <Col xs={12} sm={8}>
                <Button
                  type="primary"
                  danger
                  block
                  onClick={handleSwap}
                >
                  确认交换 ({selectedStudents.length}/2)
                </Button>
              </Col>
            )}
            {swapMode && selectedStudents.length < 2 && (
              <Col xs={12} sm={8}>
                <Button
                  type="default"
                  disabled
                  block
                >
                  已选择 {selectedStudents.length}/2
                </Button>
              </Col>
            )}
          </Row>
        </Space>
      </Card>

      {/* 房间分配可视化网格 */}
      <Spin spinning={loading}>
        {hasMixedGender ? (
          // 存在混合性别，显示选项卡
          <Tabs
            defaultActiveKey="both"
            items={[
              {
                key: 'both',
                label: '全部',
                children: (
                  <div style={{ marginTop: 16 }}>
                    {(() => {
                      const roomsToDisplay = filteredRooms;
                      return roomsToDisplay.length === 0 ? (
                        <Empty description="没有找到匹配的房间" style={{ marginTop: 50 }} />
                      ) : (
                        <>
                          {groupRoomsByFloor(roomsToDisplay).map(({ floor, evenRooms, oddRooms }) => (
                            <div key={floor} style={{ marginBottom: 16 }}>
                              <h3 style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333', margin: '8px 0' }}>
                                第 {floor} 楼
                              </h3>
                              {/* 偶数房间（上排） */}
                              {renderRoomRow(evenRooms, `floor-${floor}-even`, [6, 6], { xs: 24, sm: 12, md: 8, lg: 5, xl: 4 })}
                              {/* 奇数房间（下排） */}
                              {renderRoomRow(oddRooms, `floor-${floor}-odd`, [6, 6], { xs: 24, sm: 12, md: 8, lg: 5, xl: 4 })}
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                ),
              },
              {
                key: 'male',
                label: '男众',
                children: (
                  <div style={{ marginTop: 16 }}>
                    {(() => {
                      const roomsToDisplay = getFilteredRooms('男');
                      return roomsToDisplay.length === 0 ? (
                        <Empty description="没有找到匹配的房间" style={{ marginTop: 50 }} />
                      ) : (
                        <>
                          {groupRoomsByFloor(roomsToDisplay).map(({ floor, evenRooms, oddRooms }) => (
                            <div key={floor} style={{ marginBottom: 16 }}>
                              <h3 style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333', margin: '8px 0' }}>
                                第 {floor} 楼
                              </h3>
                              {/* 偶数房间（上排） */}
                              {renderRoomRow(evenRooms, `floor-${floor}-even`, [6, 6], { xs: 24, sm: 12, md: 8, lg: 5, xl: 4 })}
                              {/* 奇数房间（下排） */}
                              {renderRoomRow(oddRooms, `floor-${floor}-odd`, [6, 6], { xs: 24, sm: 12, md: 8, lg: 5, xl: 4 })}
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                ),
              },
              {
                key: 'female',
                label: '女众',
                children: (
                  <div style={{ marginTop: 16 }}>
                    {(() => {
                      const roomsToDisplay = getFilteredRooms('女');
                      return roomsToDisplay.length === 0 ? (
                        <Empty description="没有找到匹配的房间" style={{ marginTop: 50 }} />
                      ) : (
                        <>
                          {groupRoomsByFloor(roomsToDisplay).map(({ floor, evenRooms, oddRooms }) => (
                            <div key={floor} style={{ marginBottom: 16 }}>
                              <h3 style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333', margin: '8px 0' }}>
                                第 {floor} 楼
                              </h3>
                              {/* 偶数房间（上排） */}
                              {renderRoomRow(evenRooms, `floor-${floor}-even`, [6, 6], { xs: 24, sm: 12, md: 8, lg: 5, xl: 4 })}
                              {/* 奇数房间（下排） */}
                              {renderRoomRow(oddRooms, `floor-${floor}-odd`, [6, 6], { xs: 24, sm: 12, md: 8, lg: 5, xl: 4 })}
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                ),
              },
            ]}
          />
        ) : (
          // 不存在混合性别，直接显示按楼层分组
          <>
            {filteredRooms.length === 0 ? (
              <Empty description="没有找到匹配的房间" style={{ marginTop: 50 }} />
            ) : (
              <>
                {groupRoomsByFloor(filteredRooms).map(({ floor, evenRooms, oddRooms }) => (
                  <div key={floor} style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                      第 {floor} 楼
                    </h3>
                    {/* 偶数房间（上排） */}
                    {renderRoomRow(evenRooms, `floor-${floor}-even`, [12, 12], { xs: 24, sm: 12, md: 8, lg: 6, xl: 6 })}
                    {/* 奇数房间（下排） */}
                    {renderRoomRow(oddRooms, `floor-${floor}-odd`, [12, 12], { xs: 24, sm: 12, md: 8, lg: 6, xl: 6 })}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </Spin>
    </div>
  );
}
