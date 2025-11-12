"use client";

import { useEffect, useMemo, useState } from "react";
import { App, Button, Card, Col, Empty, Input, Modal, Row, Segmented, Space, Tag, Typography, Statistic, Select, Tabs, Alert } from "antd";
import { DeleteOutlined, DashboardOutlined, PlayCircleOutlined } from "@ant-design/icons";
import type { Bed, Room, Student } from "@/types/domain";
import { useAppContext } from "@/state/app-context";
import { useAllocations, useRooms, useStudents } from "@/hooks/queries";
import { allocationApi, bedApi } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { groupRoomsByFloor } from "@/lib/room-layout";
import type { FloorRoomGroup } from "@/lib/room-layout";
import { buildParityRenderPlan, type FloorRenderPlan } from "@/lib/room-visual";
import { truncateText } from "@/lib/string";

interface RoomCardData {
  room: Room;
  occupants: OccupantEntry[];
  beds: Bed[];
}

interface OccupantEntry {
  allocationId: number;
  student?: Student;
  bed?: Bed;
}


type BoardMode = "workspace" | "overview";

interface RoomBoardProps {
  initialView?: BoardMode;
}

export function RoomBoardPage({ initialView = "workspace" }: RoomBoardProps) {
  const { currentCenter, currentSession } = useAppContext();
  const { message } = App.useApp();
  const roomsQuery = useRooms(currentCenter?.id);
  const studentsQuery = useStudents(currentSession?.id);
  const allocationsQuery = useAllocations(currentSession?.id);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [viewMode, setViewMode] = useState<"female" | "male">("female");
  const [selectedForSwap, setSelectedForSwap] = useState<number[]>([]);
  const [assignModal, setAssignModal] = useState<{ room: Room; bed: Bed } | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number>();
  const [studentSearch, setStudentSearch] = useState("");
  const [boardMode, setBoardMode] = useState<BoardMode>(initialView);
  const [autoAllocating, setAutoAllocating] = useState(false);

  useEffect(() => {
    const loadBeds = async () => {
      const list = await bedApi.fetchBeds();
      setBeds(list);
    };
    loadBeds();
  }, []);

  const studentMap = useMemo(() => new Map(studentsQuery.data?.map((stu) => [stu.id, stu]) ?? []), [studentsQuery.data]);
  const bedKeyMap = useMemo(() => {
    const map = new Map<string, Bed>();
    beds.forEach((bed) => {
      map.set(`${bed.roomId}-${bed.bedNumber}`, bed);
    });
    return map;
  }, [beds]);

  const normalizeGender = (value?: string | null): "female" | "male" | null => {
    if (!value) return null;
    const text = value.toLowerCase();
    if (text.includes("女") || text.startsWith("f") || text.includes("female")) {
      return "female";
    }
    if (text.includes("男") || text.startsWith("m") || text.includes("male")) {
      return "male";
    }
    return null;
  };

  const getRoomGenderKey = (room: Room): "female" | "male" | null => normalizeGender(room.genderArea);

  const roomCards: RoomCardData[] = useMemo(() => {
    if (!roomsQuery.data) return [];
    return roomsQuery.data.map((room) => {
      const occupants =
        allocationsQuery.data
          ?.filter((alloc) => alloc.roomId === room.id)
          .map((alloc) => {
            const bedKey = `${room.id}-${alloc.bedNumber}`;
            const matchedBed =
              bedKeyMap.get(bedKey) ??
              ({
                id: room.id * 100 + alloc.bedNumber,
                roomId: room.id,
                bedNumber: alloc.bedNumber,
                position: undefined,
                status: "OCCUPIED",
              } as Bed);
            return {
              allocationId: alloc.id,
              student: studentMap.get(alloc.studentId),
              bed: matchedBed,
            };
          }) ?? [];
      const roomBedsRaw = beds.filter((bed) => bed.roomId === room.id);
      const roomBeds: Bed[] =
        roomBedsRaw.length > 0
          ? roomBedsRaw
          : Array.from({ length: room.capacity }, (_, idx) => ({
              id: room.id * 100 + idx + 1,
              roomId: room.id,
              bedNumber: idx + 1,
              position: undefined,
              status: "AVAILABLE",
            }));
      return { room, occupants, beds: roomBeds };
    });
  }, [roomsQuery.data, allocationsQuery.data, bedKeyMap, studentMap, beds]);

  const pendingStudents = useMemo(() => {
    const assignedIds = new Set(allocationsQuery.data?.map((alloc) => alloc.studentId));
    let filtered = studentsQuery.data?.filter((stu) => !assignedIds.has(stu.id)) ?? [];

    // 根据当前房间性别过滤学员
    if (assignModal?.room) {
      const roomGender = getRoomGenderKey(assignModal.room);
      filtered = filtered.filter((stu) => {
        const studentGender = stu.gender?.toLowerCase();
        if (roomGender === "female") {
          return studentGender === "f" || studentGender === "female" || studentGender?.includes("女");
        }
        if (roomGender === "male") {
          return studentGender === "m" || studentGender === "male" || studentGender?.includes("男");
        }
        return true;
      });
    }

    // 根据搜索关键词过滤
    if (studentSearch) {
      filtered = filtered.filter((stu) => stu.name.toLowerCase().includes(studentSearch.toLowerCase()));
    }

    return filtered;
  }, [studentsQuery.data, allocationsQuery.data, studentSearch, assignModal]);
  const totalStudents = studentsQuery.data?.length ?? 0;
  const allocatedCount = allocationsQuery.data?.length ?? 0;
  const pendingCount = pendingStudents.length;
  const roomCount = roomsQuery.data?.length ?? 0;

  const roomCardMap = useMemo(() => new Map(roomCards.map((card) => [card.room.id, card])), [roomCards]);

  const roomsByGender = useMemo(() => {
    const female: Room[] = [];
    const male: Room[] = [];
    roomsQuery.data?.forEach((room) => {
      const key = getRoomGenderKey(room);
      if (key === "female") female.push(room);
      if (key === "male") male.push(room);
    });
    return { female, male };
  }, [roomsQuery.data]);

  const groupedByGender = useMemo(
    () => ({
      female: groupRoomsByFloor(roomsByGender.female),
      male: groupRoomsByFloor(roomsByGender.male),
    }),
    [roomsByGender],
  );

  const renderPlans = useMemo(
    () => ({
      female: buildParityRenderPlan(groupedByGender.female),
      male: buildParityRenderPlan(groupedByGender.male),
    }),
    [groupedByGender],
  );

  const hasFemaleRooms = renderPlans.female.length > 0;
  const hasMaleRooms = renderPlans.male.length > 0;

  const activeViewMode = useMemo(() => {
    if (viewMode === "female" && !hasFemaleRooms && hasMaleRooms) {
      return "male";
    }
    if (viewMode === "male" && !hasMaleRooms && hasFemaleRooms) {
      return "female";
    }
    return viewMode;
  }, [viewMode, hasFemaleRooms, hasMaleRooms]);

  const isInteractive = boardMode === "workspace";

  const gridClass = (occupied: boolean, selected: boolean) => {
    if (!occupied) return "bed-slot empty";
    if (selected) return "bed-slot occupied selected";
    return "bed-slot occupied";
  };

  const renderRoomCard = (data: RoomCardData) => {
    const { room, occupants, beds } = data;
    const genderKey = getRoomGenderKey(room);
    const genderLabel = genderKey === "female" ? "女众" : "男众";
    const occupancyStatus =
      occupants.length === 0 ? "empty" : occupants.length >= room.capacity ? "full" : "partial";
    return (
      <Card
        size="small"
        className={`room-card ${occupancyStatus} ${room.capacity === 1 ? "single-room" : ""}`}
        styles={{ body: { padding: 12 } }}
        hoverable
        title={
          <div className="room-card-head">
            <div>
              <div className="room-title">
                {room.building} {room.roomNumber}
              </div>
              <div className="room-meta">
                {room.floor} 层 · 容量 {room.capacity}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tag color={genderKey === "female" ? "magenta" : "blue"}>{genderLabel}</Tag>
              <span className="room-occupancy">{occupants.length} / {room.capacity}</span>
            </div>
          </div>
        }
      >
        <div className="room-grid">
          {beds.map((bed) => {
            const occupant = occupants.find((occ) => occ.bed?.id === bed.id);
            const isSelected = occupant ? selectedForSwap.includes(occupant.allocationId) : false;
            const detailParts = [
              occupant?.student?.age ? `${occupant.student.age}岁` : null,
              occupant?.student?.city ? truncateText(occupant.student.city, 9) : null,
            ].filter(Boolean);
            const detail = detailParts.join(" · ") || "信息不全";
            return (
              <div
                key={bed.id}
                className={gridClass(Boolean(occupant), isSelected)}
                onClick={() => (occupant ? handleOccupantClick(occupant.allocationId) : openAssignModal(room, bed))}
              >
                {occupant ? (
                  <Space direction="vertical" size={4} style={{ pointerEvents: isInteractive ? "auto" : "none" }}>
                    <Space align="center" size={6}>
                      <Typography.Text strong>{occupant.student?.name ?? "未知"}</Typography.Text>
                      {bed.bedNumber !== undefined && (
                        <Tag size="small" color="geekblue" bordered={false}>
                          床 {bed.bedNumber}
                        </Tag>
                      )}
                    </Space>
                    <Typography.Text type="secondary" className="bed-detail">
                      {detail}
                    </Typography.Text>
                    {isInteractive && (
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => handleRemove(occupant.allocationId, e)}
                      >
                        移除
                      </Button>
                    )}
                  </Space>
                ) : (
                  <Space direction="vertical" size={2}>
                    <Typography.Text type="secondary">空床 {bed.bedNumber ?? ""}</Typography.Text>
                    <Typography.Text type="secondary" className="bed-detail muted">
                      点击指派学员
                    </Typography.Text>
                  </Space>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const renderRoomRow = (rooms: Room[]) => {
    if (!rooms.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该楼层暂无房间" />;
    return (
      <div className="room-row-scroll">
        <div className="room-row-track">
          {rooms.map((room) => {
            const data = roomCardMap.get(room.id);
            if (!data) return null;
            return (
              <div key={room.id} className="room-card-wrapper">
                {renderRoomCard(data)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFloorSections = (plans: FloorRenderPlan[]) => {
    if (!plans.length) {
      return <Empty description="当前性别暂无房间" />;
    }
    return plans.map((plan) => (
      <Card key={plan.floor} className="floor-card" title={`第 ${plan.floor} 层`}>
        {plan.sections.map((section, index) => (
          <div key={section.key} className="room-section">
            <div className="row-label">{section.label}</div>
            {renderRoomRow(section.rooms)}
            {index < plan.sections.length - 1 && <div className="room-divider" />}
          </div>
        ))}
        {plan.sections.length === 0 && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该楼层暂无房间" className="floor-empty" />
        )}
      </Card>
    ));
  };

  const summarizePlans = (plans: FloorRenderPlan[]) =>
    plans.reduce(
      (acc, plan) => {
        plan.sections.forEach((section) => {
          section.rooms.forEach((room) => {
            const card = roomCardMap.get(room.id);
            const roomBeds = card?.beds ?? beds.filter((bed) => bed.roomId === room.id);
            acc.capacity += roomBeds.length;
            acc.occupied += card?.occupants.length ?? 0;
          });
        });
        return acc;
      },
      { occupied: 0, capacity: 0 },
    );

  const openAssignModal = (room: Room, bed: Bed) => {
    if (!isInteractive) return;
    setAssignModal({ room, bed });
    setSelectedStudentId(undefined);
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedStudentId || !currentSession) {
      message.warning("请选择学员");
      return;
    }
    try {
      await allocationApi.createAllocation({
        sessionId: currentSession.id,
        studentId: selectedStudentId,
        roomId: assignModal.room.id,
        bedNumber: assignModal.bed.bedNumber ?? 1,
        allocationType: "MANUAL",
      });
      message.success("指派成功");
      setAssignModal(null);
      await allocationsQuery.refetch();
    } catch (error) {
      console.error(error);
      message.error("指派失败");
    }
  };

  const handleRemove = async (allocationId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isInteractive) return;
    try {
      await allocationApi.deleteAllocation(allocationId);
      message.success("已移除");
      await allocationsQuery.refetch();
    } catch (error) {
      console.error("删除分配失败:", error);
      message.error("删除分配失败，请检查网络连接或联系管理员");
    }
  };

  const executeSwap = async (firstId: number, secondId: number) => {
    try {
      await allocationApi.swapAllocations(firstId, secondId);
      message.success("交换成功");
      setSelectedForSwap([]);
      await allocationsQuery.refetch();
    } catch (error) {
      console.error(error);
      message.error("交换失败");
    }
  };

  const handleOccupantClick = (allocationId: number) => {
    if (!isInteractive) return;
    if (selectedForSwap.length === 0) {
      // 选中第一个学员
      setSelectedForSwap([allocationId]);
      return;
    }
    const first = selectedForSwap[0];
    if (first === allocationId) {
      // 点击已选中的学员，取消选择
      setSelectedForSwap([]);
      return;
    }
    if (selectedForSwap.length === 1) {
      // 选中第二个学员，不直接交换
      setSelectedForSwap([first, allocationId]);
      return;
    }
    // 如果已经选了两个，点击任何学员都重新开始选择
    setSelectedForSwap([allocationId]);
  };

  const handleConfirmSwap = () => {
    if (selectedForSwap.length !== 2) return;
    executeSwap(selectedForSwap[0], selectedForSwap[1]);
  };

  const handleCancelSwap = () => {
    setSelectedForSwap([]);
  };

  const handleAutoAllocate = async () => {
    if (!currentSession) {
      message.warning("请先选择会期");
      return;
    }
    if (pendingCount === 0) {
      message.info("没有待分配的学员");
      return;
    }

    // 如果已有分配数据，弹出确认对话框
    if (allocatedCount > 0) {
      Modal.confirm({
        title: "确认自动分配",
        content: `当前已有 ${allocatedCount} 名学员的分配数据。自动分配会清空所有现有分配数据并重新分配，是否继续？`,
        okText: "确认分配",
        cancelText: "取消",
        okButtonProps: { danger: true },
        onOk: async () => {
          await executeAutoAllocate();
        },
      });
    } else {
      await executeAutoAllocate();
    }
  };

  const executeAutoAllocate = async () => {
    setAutoAllocating(true);
    try {
      await allocationApi.triggerAutoAllocation(currentSession.id);
      message.success("自动分配完成");
      await allocationsQuery.refetch();
    } catch (error) {
      console.error("自动分配失败:", error);
      message.error("自动分配失败，请检查网络连接或联系管理员");
    } finally {
      setAutoAllocating(false);
    }
  };



  if (!currentCenter || !currentSession) {
    return (
      <Card>
        <PageHeader title="房间总览" description="请选择中心与会期" />
        <Empty />
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="房间工作台"
        description="男女分区独立调整，点击学员即可与另一位交换"
        extra={
          <Space>
            <Segmented
              options={[
                { label: "手动调整", value: "workspace" },
                { label: "结果预览", value: "overview" },
              ]}
              value={boardMode}
              onChange={(value) => {
                setBoardMode(value as BoardMode);
                setSelectedForSwap([]);
              }}
            />
            {isInteractive && pendingCount > 0 && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleAutoAllocate}
                loading={autoAllocating}
              >
                自动分配 ({pendingCount}人)
              </Button>
            )}
            {!isInteractive && (
              <Button onClick={() => window.print()}>打印 / 导出</Button>
            )}
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={6}>
          <Card>
            <Statistic title="学员总数" value={totalStudents} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card>
            <Statistic title="已分配" value={allocatedCount} valueStyle={{ color: "#52c41a" }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card>
            <Statistic title="待分配" value={pendingCount} valueStyle={{ color: "#faad14" }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card>
            <Statistic title="房间数" value={roomCount} />
          </Card>
        </Col>
      </Row>

      {isInteractive && selectedForSwap.length > 0 && (
        <Alert
          type={selectedForSwap.length === 1 ? "info" : "warning"}
          showIcon
          message={
            selectedForSwap.length === 1 ? (
              "已选中 1 名学员，点击另一个学员以继续"
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <span>
                  已选中 2 名学员：
                  {(() => {
                    const alloc1 = allocationsQuery.data?.find((a) => a.id === selectedForSwap[0]);
                    const alloc2 = allocationsQuery.data?.find((a) => a.id === selectedForSwap[1]);
                    const student1 = alloc1 ? studentMap.get(alloc1.studentId) : null;
                    const student2 = alloc2 ? studentMap.get(alloc2.studentId) : null;
                    const room1 = alloc1 ? roomsQuery.data?.find((r) => r.id === alloc1.roomId) : null;
                    const room2 = alloc2 ? roomsQuery.data?.find((r) => r.id === alloc2.roomId) : null;
                    const bed1 = alloc1 ? bedKeyMap.get(`${alloc1.roomId}-${alloc1.bedNumber}`) : null;
                    const bed2 = alloc2 ? bedKeyMap.get(`${alloc2.roomId}-${alloc2.bedNumber}`) : null;
                    return (
                      <strong>
                        {student1?.name ?? "未知"}({room1?.building ?? ""}{room1?.roomNumber ?? ""}-床{bed1?.bedNumber ?? ""})
                        <span style={{ margin: "0 8px" }}>↔</span>
                        {student2?.name ?? "未知"}({room2?.building ?? ""}{room2?.roomNumber ?? ""}-床{bed2?.bedNumber ?? ""})
                      </strong>
                    );
                  })()}
                </span>
                <Space>
                  <Button type="primary" size="small" onClick={handleConfirmSwap}>
                    交换床位
                  </Button>
                  <Button size="small" onClick={handleCancelSwap}>
                    取消选择
                  </Button>
                </Space>
              </div>
            )
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <Tabs
              type="card"
              activeKey={activeViewMode}
              onChange={(key) => {
                setViewMode(key as typeof viewMode);
                setSelectedForSwap([]);
              }}
              items={(["female", "male"] as const).map((genderKey) => {
                const plans = renderPlans[genderKey];
                const summary = summarizePlans(plans);
                const label = `${genderKey === "female" ? "女众" : "男众"}（${summary.occupied}/${summary.capacity || 0}）`;
                return {
                  key: genderKey,
                  label,
                  children: renderFloorSections(plans),
                };
              })}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="手动分配床位"
        open={Boolean(assignModal)}
        onCancel={() => setAssignModal(null)}
        onOk={handleAssign}
        okText="确认指派"
        okButtonProps={{ disabled: !selectedStudentId || !assignModal?.bed }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="搜索学员"
              allowClear
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </Space.Compact>
          {pendingStudents.length === 0 ? (
            <Empty description="暂无待分配学员" />
          ) : (
            <Card size="small" styles={{ body: { padding: 8 } }}>
              <Space wrap>
                {pendingStudents.map((stu) => (
                  <Tag
                    key={stu.id}
                    color={selectedStudentId === stu.id ? "blue" : "default"}
                    style={{
                      cursor: "pointer",
                      border: selectedStudentId === stu.id ? "2px solid #1890ff" : "1px solid #d9d9d9",
                      fontWeight: selectedStudentId === stu.id ? "bold" : "normal",
                      transform: selectedStudentId === stu.id ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => setSelectedStudentId(stu.id)}
                  >
                    {stu.studentNumber ?? "-"} {stu.name}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}
          <Select
            placeholder="选择房间"
            value={assignModal?.room.id}
            onChange={(roomId) => {
              const room = roomsQuery.data?.find((item) => item.id === roomId);
              if (!room) return;
              const roomBed = beds.find((bed) => bed.roomId === room.id);
              if (roomBed) {
                setAssignModal({ room, bed: roomBed });
              }
            }}
            options={roomsQuery.data?.map((room) => ({
              value: room.id,
              label: `${room.building} ${room.roomNumber} (${room.genderArea})`,
            }))}
          />
          <Select
            placeholder="选择床位"
            value={assignModal?.bed.id}
            onChange={(bedId) => {
              if (!assignModal) return;
              const bed = beds.find((item) => item.id === bedId);
              if (bed) {
                setAssignModal({ room: assignModal.room, bed });
              }
            }}
            options={beds
              .filter((bed) => bed.roomId === assignModal?.room.id)
              .map((bed) => ({
                value: bed.id,
                label: `床位 ${bed.bedNumber}`,
              }))}
          />
        </Space>
      </Modal>

      <style jsx>{`
        .floor-card {
          margin-bottom: 16px;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
        }
        .row-label {
          font-size: 13px;
          font-weight: 500;
          color: #8c8c8c;
          margin-bottom: 8px;
        }
        .floor-empty {
          margin: 12px 0;
        }
        .room-section {
          margin-bottom: 8px;
        }
        .room-divider {
          margin: 16px 0;
          border-bottom: 2px dashed #d9d9d9;
        }
        :global(.room-row-scroll) {
          overflow-x: auto;
          padding-bottom: 8px;
        }
        :global(.room-row-track) {
          display: flex;
          gap: 16px;
        }
        :global(.room-card-wrapper) {
          flex: 0 0 260px;
        }
        :global(.room-card) {
          border-radius: 12px;
          border: 2px solid #f0f0f0;
          transition: all 0.2s ease;
          min-height: 210px;
        }
        :global(.room-card.empty) {
          background: #fff;
          border-color: #e0e0e0;
        }
        :global(.room-card.partial) {
          background: #f0f9ff;
          border-color: #91caff;
        }
        :global(.room-card.full) {
          background: #fff1f0;
          border-color: #ffccc7;
        }
        :global(.room-card.single-room) {
          border-color: #ffa940 !important;
          background: #fff7e6 !important;
          border-width: 3px !important;
        }
        :global(.room-card:hover) {
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        }
        :global(.room-card .room-card-head) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        :global(.room-card .room-title) {
          font-size: 15px;
          font-weight: 600;
          color: #3a3a3a;
        }
        :global(.room-card .room-meta) {
          font-size: 12px;
          color: #8c8c8c;
        }
        :global(.room-card .room-occupancy) {
          font-size: 12px;
          color: #595959;
          font-weight: 500;
        }
        .room-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        :global(.bed-detail) {
          font-size: 12px;
        }
        :global(.bed-detail.muted) {
          color: #bfbfbf;
        }
        :global(.bed-slot) {
          border: 1px dashed #d9d9d9;
          border-radius: 8px;
          padding: 8px;
          min-height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        :global(.bed-slot.occupied) {
          border-style: solid;
          border-color: #91caff;
          background: #f0f7ff;
        }
        :global(.bed-slot.occupied.selected) {
          border-color: #1890ff !important;
          border-width: 3px !important;
          background: #bae0ff !important;
          box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.4), 0 4px 12px rgba(24, 144, 255, 0.3) !important;
          transform: scale(1.05) !important;
          z-index: 10 !important;
          position: relative !important;
        }
        :global(.bed-slot.occupied.selected::before) {
          content: '✓';
          position: absolute;
          top: 2px;
          right: 4px;
          background: #1890ff;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }
        :global(.bed-slot.empty) {
          cursor: pointer;
          border-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}
