'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Select,
  Alert,
  Empty,
  Spin,
  Space,
  Card,
  Tag,
  Divider,
} from 'antd';
import {
  PrinterOutlined,
  ArrowLeftOutlined,
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
  age: number;
  bedNumber?: number;
  bedId?: number;
}

export default function AllocationPrintPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [currentCenter, setCurrentCenter] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isHydrated && currentSession?.id && currentCenter?.id) {
      loadAllocationData();
    }
  }, [currentSession?.id, currentCenter?.id, isHydrated]);

  const loadAllocationData = async () => {
    setLoading(true);
    try {
      const roomsRes = await roomApi.getRooms(currentCenter.id);
      let roomList: any[] = [];
      if (roomsRes.data?.data?.list) {
        roomList = roomsRes.data.data.list;
      } else if (Array.isArray(roomsRes.data?.data)) {
        roomList = roomsRes.data.data;
      }

      const allocationsRes = await allocationApi.getAllocationsBySession(
        currentSession.id
      );
      let allocationList: any[] = [];
      if (allocationsRes.data?.data?.list) {
        allocationList = allocationsRes.data.data.list;
      } else if (Array.isArray(allocationsRes.data?.data)) {
        allocationList = allocationsRes.data.data;
      }

      const bedsRes = await bedApi.getBeds();
      let bedMap: { [key: number]: any } = {};
      const bedList = bedsRes.data?.data?.list || (Array.isArray(bedsRes.data?.data) ? bedsRes.data.data : []);
      bedList.forEach((bed: any) => {
        bedMap[bed.id] = bed;
      });

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
              age: student.age || 0,
              bedId: alloc.bedId,
              bedNumber: bedMap[alloc.bedId]?.bedNumber || 1,
            });
          } catch (error) {
            console.error('Failed to load student:', error);
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

  const handlePrint = () => {
    window.print();
  };

  const getFilteredRooms = () => {
    if (!genderFilter) return rooms;
    return rooms.filter((room) =>
      room.genderArea?.includes(genderFilter === 'M' ? '男' : '女')
    );
  };

  const getRoomNumber = (roomNumber: string): number => {
    const match = roomNumber.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const getFloorGroupedRooms = (roomList: Room[]) => {
    const floorMap = new Map<number, Room[]>();
    roomList.forEach((room) => {
      if (!floorMap.has(room.floor)) {
        floorMap.set(room.floor, []);
      }
      floorMap.get(room.floor)!.push(room);
    });

    return Array.from(floorMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([floor, roomListForFloor]) => {
        // 按房间号的数字部分分类为偶数（上排）和奇数（下排）
        const evenRooms = roomListForFloor
          .filter((room) => getRoomNumber(room.roomNumber) % 2 === 0)
          .sort((a, b) => getRoomNumber(a.roomNumber) - getRoomNumber(b.roomNumber));
        const oddRooms = roomListForFloor
          .filter((room) => getRoomNumber(room.roomNumber) % 2 !== 0)
          .sort((a, b) => getRoomNumber(a.roomNumber) - getRoomNumber(b.roomNumber));
        return { floor, evenRooms, oddRooms };
      });
  };

  const filteredRooms = getFilteredRooms();
  const floorGroupedRooms = getFloorGroupedRooms(filteredRooms);

  const getTotalStats = (roomList: Room[]) => {
    return {
      totalRooms: roomList.length,
      totalStudents: roomList.reduce((sum, r) => sum + (r.occupancy || 0), 0),
      occupiedRooms: roomList.filter((r) => (r.occupancy || 0) > 0).length,
    };
  };

  if (!isHydrated || !currentSession) {
    return (
      <div className="print-container" style={{ padding: '20px' }}>
        <Alert
          message="请先选择课程会期"
          description="从顶部菜单栏选择要查看的禅修中心和课程会期后，可生成打印版本"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Empty description="暂无数据" />
      </div>
    );
  }

  const stats = getTotalStats(filteredRooms);
  const genderLabel = genderFilter === 'M' ? '男众' : genderFilter === 'F' ? '女众' : '全部';

  return (
    <div>
      {/* 控制栏 - 打印时隐藏 */}
      <div className="no-print" style={{ marginBottom: 24, padding: '16px', background: '#fafafa', borderRadius: '4px' }}>
        <Space wrap>
          <Select
            style={{ width: 150 }}
            placeholder="选择性别"
            value={genderFilter}
            onChange={setGenderFilter}
            options={[
              { label: '全部', value: null },
              { label: '男众', value: 'M' },
              { label: '女众', value: 'F' },
            ]}
          />
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            打印
          </Button>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => (window.location.href = '/allocations/result')}
          >
            返回
          </Button>
        </Space>
      </div>

      {/* 打印内容 */}
      <div ref={printRef} className="print-content" style={{ background: 'white', padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin />
          </div>
        ) : filteredRooms.length === 0 ? (
          <Empty description="没有符合条件的房间" />
        ) : (
          <>
            {/* 标题 */}
            <div style={{ marginBottom: '30px', textAlign: 'center', pageBreakAfter: 'avoid' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>
                {currentCenter?.centerName || '禅修中心'}
              </h1>
              <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                课程期次: {currentSession?.sessionCode || '-'} | {currentSession?.courseType || '-'}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '10px 0' }}>
                {genderLabel}分配结果
              </p>
              <Divider style={{ margin: '20px 0' }} />
            </div>

            {/* 统计信息 */}
            <div
              style={{
                marginBottom: '30px',
                display: 'flex',
                gap: '30px',
                justifyContent: 'center',
                pageBreakAfter: 'avoid',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {stats.totalRooms}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>房间</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.totalStudents}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>学员</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {stats.occupiedRooms}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>已入住</div>
              </div>
            </div>

            <Divider style={{ margin: '20px 0' }} />

            {/* 按楼层分组的房间卡片 */}
            {floorGroupedRooms.map((floorGroup) => (
              <div key={floorGroup.floor} style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
                {/* 楼层标题 */}
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1890ff' }}>
                  {floorGroup.floor}楼
                </h2>

                {/* 偶数房间行 */}
                {floorGroup.evenRooms.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '12px',
                      pageBreakInside: 'avoid',
                      marginBottom: '12px',
                    }}
                  >
                    {floorGroup.evenRooms.map((room) => (
                    <Card
                      key={room.id}
                      style={{
                        background:
                          room.occupancy === room.capacity
                            ? '#fafafa'
                            : '#fff',
                        borderColor:
                          room.occupancy === room.capacity ? '#d9d9d9' : '#1890ff',
                        borderWidth: 1,
                        pageBreakInside: 'avoid',
                      }}
                      size="small"
                    >
                      {/* 房间头部 */}
                      <div style={{ marginBottom: '10px' }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 'bold',
                            marginBottom: '2px',
                          }}
                        >
                          {room.building} {room.roomNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                          {room.capacity}人房 | {room.occupancy || 0}/{room.capacity}
                        </div>
                      </div>

                      <Divider style={{ margin: '8px 0' }} />

                      {/* 学员列表 */}
                      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {room.students && room.students.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {room.students.map((student) => (
                              <div
                                key={student.id}
                                style={{
                                  padding: '6px',
                                  background: '#fafafa',
                                  borderRadius: '2px',
                                  fontSize: '11px',
                                }}
                              >
                                <div style={{ marginBottom: '2px' }}>
                                  <strong>{student.name}</strong>
                                  <span style={{ color: '#999', marginLeft: '8px' }}>
                                    {student.age}岁
                                  </span>
                                </div>
                                <div style={{ color: '#1890ff', fontWeight: 'bold' }}>
                                  床位 {student.bedNumber}号
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: '#8c8c8c', textAlign: 'center', fontSize: '11px' }}>
                            无学员
                          </p>
                        )}
                      </div>
                    </Card>
                    ))}
                  </div>
                )}

                {/* 奇数房间行 */}
                {floorGroup.oddRooms.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '12px',
                      pageBreakInside: 'avoid',
                    }}
                  >
                    {floorGroup.oddRooms.map((room) => (
                    <Card
                      key={room.id}
                      style={{
                        background:
                          room.occupancy === room.capacity
                            ? '#fafafa'
                            : '#fff',
                        borderColor:
                          room.occupancy === room.capacity ? '#d9d9d9' : '#1890ff',
                        borderWidth: 1,
                        pageBreakInside: 'avoid',
                      }}
                      size="small"
                    >
                      {/* 房间头部 */}
                      <div style={{ marginBottom: '10px' }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 'bold',
                            marginBottom: '2px',
                          }}
                        >
                          {room.building} {room.roomNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                          {room.capacity}人房 | {room.occupancy || 0}/{room.capacity}
                        </div>
                      </div>

                      <Divider style={{ margin: '8px 0' }} />

                      {/* 学员列表 */}
                      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {room.students && room.students.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {room.students.map((student) => (
                              <div
                                key={student.id}
                                style={{
                                  padding: '6px',
                                  background: '#fafafa',
                                  borderRadius: '2px',
                                  fontSize: '11px',
                                }}
                              >
                                <div style={{ marginBottom: '2px' }}>
                                  <strong>{student.name}</strong>
                                  <span style={{ color: '#999', marginLeft: '8px' }}>
                                    {student.age}岁
                                  </span>
                                </div>
                                <div style={{ color: '#1890ff', fontWeight: 'bold' }}>
                                  床位 {student.bedNumber}号
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: '#8c8c8c', textAlign: 'center', fontSize: '11px' }}>
                            无学员
                          </p>
                        )}
                      </div>
                    </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 页脚 */}
            <div
              style={{
                marginTop: '40px',
                paddingTop: '20px',
                borderTop: '1px solid #d9d9d9',
                textAlign: 'center',
                fontSize: '11px',
                color: '#999',
                pageBreakBefore: 'avoid',
              }}
            >
              <p>禅修中心智能排床系统 | {new Date().toLocaleDateString('zh-CN')}</p>
            </div>
          </>
        )}
      </div>

      {/* 打印样式 */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: white;
            width: 210mm;
            height: 297mm;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          /* 打印内容容器 */
          .print-content {
            width: 180mm !important;
            margin: 0 auto !important;
            padding: 15mm !important;
          }
          /* Grid 卡片容器 - A4 宽度为 180mm，控制列数 */
          div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
          }
          div[style*="pageBreakAfter"] {
            page-break-after: auto;
          }
          div[style*="pageBreakInside"] {
            page-break-inside: avoid;
          }
          h1, h2, h3 {
            page-break-after: avoid;
          }
          .ant-card {
            page-break-inside: avoid;
            max-width: 100% !important;
          }
          /* 卡片内容优化 */
          .ant-card-body {
            padding: 6px !important;
          }
        }

        @media screen {
          @page {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
