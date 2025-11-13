"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Segmented, Space, Statistic, Typography } from "antd";
import type { Room, Student } from "@/types/domain";
import { useAppContext } from "@/state/app-context";
import { useAllocations, useRooms, useStudents } from "@/hooks/queries";
import { PageHeader } from "@/components/common/PageHeader";

type GenderFilter = "all" | "female" | "male";

interface RoomCardData {
  room: Room;
  occupants: {
    bedNumber?: number;
    student?: Student;
  }[];
}

const genderOptions = [
  { label: "全部", value: "all" },
  { label: "女众", value: "female" },
  { label: "男众", value: "male" },
];

const getGenderKey = (value?: string | null): GenderFilter => {
  if (!value) return "all";
  const normalized = value.toLowerCase();
  if (normalized.includes("女") || normalized.startsWith("f")) {
    return "female";
  }
  if (normalized.includes("男") || normalized.startsWith("m")) {
    return "male";
  }
  return "all";
};

export function AllocationPrintPage() {
  const router = useRouter();
  const { currentCenter, currentSession } = useAppContext();
  const allocationsQuery = useAllocations(currentSession?.id);
  const roomsQuery = useRooms(currentCenter?.id);
  const studentsQuery = useStudents(currentSession?.id);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("female");

  const studentMap = useMemo(
    () => new Map(studentsQuery.data?.map((student) => [student.id, student]) ?? []),
    [studentsQuery.data],
  );

  const roomCards: RoomCardData[] = useMemo(() => {
    if (!roomsQuery.data) return [];
    return roomsQuery.data.map((room) => {
      const occupants =
        allocationsQuery.data
          ?.filter((alloc) => alloc.roomId === room.id)
          .map((alloc) => ({
            bedNumber: alloc.bedNumber,
            student: studentMap.get(alloc.studentId),
          }))
          .sort((a, b) => (a.bedNumber ?? 0) - (b.bedNumber ?? 0)) ?? [];
      return { room, occupants };
    });
  }, [roomsQuery.data, allocationsQuery.data, studentMap]);

  const filteredRoomCards = useMemo(() => {
    if (genderFilter === "all") return roomCards;
    return roomCards.filter((card) => getGenderKey(card.room.genderArea) === genderFilter);
  }, [roomCards, genderFilter]);

  const floors = useMemo(() => {
    const floorMap = new Map<number, RoomCardData[]>();
    filteredRoomCards.forEach((card) => {
      const floorKey = card.room.floor ?? 0;
      const list = floorMap.get(floorKey) ?? [];
      list.push(card);
      floorMap.set(floorKey, list);
    });
    return Array.from(floorMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([floor, cards]) => ({
        floor,
        cards: cards.sort((a, b) => a.room.roomNumber.localeCompare(b.room.roomNumber, "zh-CN", { numeric: true })),
      }));
  }, [filteredRoomCards]);

  const stats = useMemo(() => {
    const roomCount = filteredRoomCards.length;
    const studentCount = filteredRoomCards.reduce((total, card) => total + card.occupants.length, 0);
    const occupiedRooms = filteredRoomCards.filter((card) => card.occupants.length > 0).length;
    return { roomCount, studentCount, occupiedRooms };
  }, [filteredRoomCards]);

  const renderRoomCard = (card: RoomCardData) => {
    const { room, occupants } = card;
    return (
      <Card key={room.id} size="small" className="print-room-card" variant="outlined">
        <div className="card-head">
          <div className="room-name">
            {room.building} {room.roomNumber}
          </div>
          <div className="room-meta">
            第{room.floor}层 · {room.roomType ?? "其他"} · 容量 {room.capacity}
          </div>
        </div>
        <div className="card-body">
          {occupants.length === 0 ? (
            <div className="empty-room">暂无学员</div>
          ) : (
            occupants.map((occ, index) => (
              <div className="occupant-row" key={`${room.id}-${occ.bedNumber ?? index}`}>
                <span className="occupant-text">
                  {[occ.student?.name ?? "未登记", occ.student?.age ? `${occ.student.age}岁` : "年龄未知", `床位${occ.bedNumber ?? "-"}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    );
  };

  if (!currentCenter || !currentSession) {
    return (
      <Card>
        <PageHeader title="打印版房间表" description="请选择中心与会期" />
        <Empty description="缺少禅修中心或课程期次信息" />
      </Card>
    );
  }

  return (
    <div className="allocation-print-shell">
      <div className="print-controls">
        <Space size={12} wrap>
          <Segmented
            options={genderOptions}
            value={genderFilter}
            onChange={(value) => setGenderFilter(value as GenderFilter)}
          />
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            返回分配页面
          </Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            打印当前性别
          </Button>
        </Space>
      </div>

      <div className="print-page">
        <div className="print-meta">
          <PageHeader
            title={currentCenter.centerName}
            description={`${currentSession.sessionCode ?? "未命名期次"} | ${currentSession.courseType ?? "未设置课程"}`}
          />
          <Typography.Title level={4} style={{ marginTop: 0 }}>
            {genderFilter === "female" ? "女众" : genderFilter === "male" ? "男众" : "全部"} 房间分配结果
          </Typography.Title>

          <div className="stats-row">
            <Card size="small">
              <Statistic title="房间" value={stats.roomCount} />
            </Card>
            <Card size="small">
              <Statistic title="学员" value={stats.studentCount} />
            </Card>
            <Card size="small">
              <Statistic title="已入住房间" value={stats.occupiedRooms} />
            </Card>
          </div>
        </div>

        {floors.length === 0 ? (
          <Card style={{ marginTop: 24 }}>
            <Empty description="没有匹配的房间记录" />
          </Card>
        ) : (
          floors.map((floor) => (
            <section key={floor.floor} className="floor-section">
              <Typography.Title level={5} className="floor-title">
                第 {floor.floor} 层
              </Typography.Title>
              <div className="room-grid">
                {floor.cards.map((card) => renderRoomCard(card))}
              </div>
            </section>
          ))
        )}

        <div className="print-footer">
          禅修中心智能排床系统 | {new Date().toLocaleDateString("zh-CN")}
        </div>
      </div>

      <style jsx>{`
        .allocation-print-shell {
          padding: 16px;
        }
        .print-controls {
          margin-bottom: 16px;
        }
        .print-page {
          background: #fff;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border-radius: 12px;
        }
        .print-meta {
          margin-bottom: 16px;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .floor-section {
          break-inside: avoid;
          margin-bottom: 24px;
        }
        .floor-title {
          margin-bottom: 12px;
        }
        .room-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .print-room-card {
          border-radius: 10px;
          min-height: 140px;
        }
        :global(.print-room-card .ant-card-body) {
          padding: 12px 14px;
        }
        .card-head {
          margin-bottom: 8px;
        }
        .room-name {
          font-weight: 600;
          font-size: 14px;
        }
        .room-meta {
          font-size: 12px;
          color: #8c8c8c;
          margin-top: 2px;
        }
        .card-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .empty-room {
          padding: 6px;
          text-align: center;
          color: #bfbfbf;
          border: 1px dashed #d9d9d9;
          border-radius: 8px;
        }
        .occupant-row {
          font-size: 12px;
          padding: 3px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .occupant-row:last-child {
          border-bottom: none;
        }
        .occupant-text {
          font-weight: 500;
          color: #3a3a3a;
        }
        .print-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        @media print {
          :global(body) {
            background: #fff !important;
          }
          @page {
            size: A4;
            margin: 12mm;
          }
          .allocation-print-shell {
            padding: 0;
          }
          .print-controls {
            display: none;
          }
          .print-page {
            box-shadow: none;
            padding: 0;
          }
          .print-meta,
          .print-footer {
            display: none;
          }
          .room-grid {
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          }
          .print-room-card {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
