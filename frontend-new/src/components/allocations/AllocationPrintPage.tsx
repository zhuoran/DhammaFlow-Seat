"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, Empty, Segmented, Space } from "antd";
import type { Room, Student } from "@/types/domain";
import { useAppContext } from "@/state/app-context";
import { useAllocations, useRooms, useStudents } from "@/hooks/queries";

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
  if (normalized.includes("女") || normalized.startsWith("f")) return "female";
  if (normalized.includes("男") || normalized.startsWith("m")) return "male";
  return "all";
};

const bedSymbols = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮"];

const getBedSymbol = (bed?: number) => {
  if (!bed || bed < 1) return "•";
  return bedSymbols[bed - 1] ?? `床${bed}`;
};

const formatAddress = (student?: Student) => {
  if (!student) return null;
  const raw = (student.city ?? student.idAddress)?.trim();
  if (!raw) return null;
  const normalized = raw.replace(/\s+/g, "");
  if (normalized.length <= 7) return normalized;
  return `${normalized.slice(0, 7)}.`;
};

const getCompanionName = (student?: Student, lookup?: Map<number, Student>) => {
  if (!student) return null;
  if (student.companion && lookup?.has(student.companion)) {
    const mate = lookup.get(student.companion);
    if (mate?.name) {
      return mate.name;
    }
  }
  if (student.fellowList) {
    const candidate = student.fellowList
      .split(/[,，、/\\s]+/)
      .map((name) => name.trim())
      .filter((name) => name && name !== student.name)[0];
    if (candidate) {
      return candidate;
    }
  }
  return null;
};

export function AllocationPrintPage() {
  const router = useRouter();
  const { currentCenter, currentSession } = useAppContext();
  const allocationsQuery = useAllocations(currentSession?.id);
  const roomsQuery = useRooms(currentCenter?.id);
  const studentsQuery = useStudents(currentSession?.id);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("female");
  const [denseMode, setDenseMode] = useState(false);

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
      <div key={room.id} className="room-card">
        <div className="room-card-head">
          <div className="room-card-title">
            {room.roomNumber} · {room.roomType ?? "其他"} · 容量 {room.capacity}
          </div>
        </div>
        <ul className="resident-list">
          {occupants.length === 0 ? (
            <li className="resident-empty">暂无学员</li>
          ) : (
            occupants.map((occ, index) => {
              const mateName = getCompanionName(occ.student, studentMap);
              const displayName = mateName
                ? `${occ.student?.name ?? "未登记"}（同伴${mateName}）`
                : occ.student?.name ?? "未登记";
              const ageLabel = occ.student?.age ? `${occ.student.age}岁` : "年龄未知";
              const addr = formatAddress(occ.student);
              return (
                <li className="resident-row" key={`${room.id}-${occ.bedNumber ?? index}`}>
                  <span className="resident-bed">{getBedSymbol(occ.bedNumber)}</span>
                  <div className="resident-info">
                    <div className="resident-line">
                      <span className="resident-name">{displayName}</span>
                      <span className="resident-divider">·</span>
                      <span className="resident-age">{ageLabel}</span>
                    </div>
                    {addr && <div className="resident-meta">{addr}</div>}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    );
  };

  if (!currentCenter || !currentSession) {
    return (
      <div className="print-fallback">
        <div className="fallback-title">打印版房间表</div>
        <Empty description="请选择中心与会期" />
      </div>
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/allocations")}>
            返回分配页面
          </Button>
          <Segmented
            style={{ marginLeft: 8 }}
            value={denseMode ? "compact" : "standard"}
            onChange={(value) => setDenseMode(value === "compact")}
            options={[
              { label: "标准", value: "standard" },
              { label: "紧凑", value: "compact" },
            ]}
          />
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            打印当前视图
          </Button>
        </Space>
      </div>

      <div className={`print-page ${denseMode ? "compact" : ""}`}>
        <header className="print-header">
          <div className="header-text">
            <div className="header-center">{currentCenter.centerName}</div>
            <div className="header-session">
              {currentSession.sessionCode ?? "未命名期次"} · {currentSession.courseType ?? "未设置课程"}
            </div>
            <div className="header-subtitle">
              {genderFilter === "female" ? "女众" : genderFilter === "male" ? "男众" : "全部"}房间分配结果
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">房间</div>
              <div className="stat-value">{stats.roomCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">学员</div>
              <div className="stat-value">{stats.studentCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">已入住房间</div>
              <div className="stat-value">{stats.occupiedRooms}</div>
            </div>
          </div>
        </header>

        {floors.length === 0 ? (
          <div className="empty-holder">
            <Empty description="没有匹配的房间记录" />
          </div>
        ) : (
          floors.map((floor, index) => (
            <section key={floor.floor} className="floor-section" data-floor-index={index}>
              <div className="floor-title">第 {floor.floor} 层</div>
              <div className="room-grid">{floor.cards.map((card) => renderRoomCard(card))}</div>
            </section>
          ))
        )}

        <footer className="print-footer">
          禅修中心智能排床系统 · {new Date().toLocaleDateString("zh-CN")}
        </footer>
      </div>

      <style jsx>{`
        .allocation-print-shell {
          padding: 16px;
          font-family: "Noto Sans SC", "PingFang SC", sans-serif;
          color: #333;
        }
        .print-fallback {
          padding: 48px 0;
          text-align: center;
        }
        .fallback-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .print-controls {
          margin-bottom: 16px;
        }
        .print-page {
          background: #fff;
          padding: 32px 40px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          max-width: 960px;
          margin: 0 auto;
        }
        .print-page.compact {
          max-width: 100%;
          padding: 16px 24px;
        }
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #ededed;
        }
        .header-center {
          font-size: 20px;
          font-weight: 600;
        }
        .header-session {
          font-size: 14px;
          color: #666;
          margin-top: 4px;
        }
        .header-subtitle {
          font-size: 15px;
          margin-top: 8px;
          letter-spacing: 1px;
        }
        .stats-row {
          display: flex;
          gap: 12px;
        }
        .print-page.compact .stats-row {
          gap: 8px;
        }
        .stat-card {
          min-width: 120px;
          background: #fafafa;
          border: 1px solid #dcdcdc;
          border-radius: 12px;
          padding: 10px 14px;
          text-align: center;
        }
        .print-page.compact .stat-card {
          border-radius: 8px;
          padding: 8px 10px;
          min-width: 100px;
        }
        .stat-label {
          font-size: 12px;
          color: #7a7a7a;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 600;
          margin-top: 6px;
        }
        .print-page.compact .stat-value {
          font-size: 18px;
        }
        .empty-holder {
          padding: 48px 0;
        }
        .floor-section {
          margin-top: 32px;
          page-break-inside: avoid;
        }
        .print-page.compact .floor-section {
          margin-top: 20px;
        }
        .floor-title {
          background: #f4f4f4;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }
        .room-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .print-page.compact .room-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        .room-card {
          border: 1px solid #d7d7d7;
          border-radius: 8px;
          padding: 12px;
          background: #fff;
          min-height: 150px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .print-page.compact .room-card {
          padding: 8px;
          min-height: 120px;
          border-radius: 6px;
        }
        .room-card-title {
          font-size: 14px;
          font-weight: 600;
        }
        .print-page.compact .room-card-title {
          font-size: 13px;
        }
        .resident-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .resident-row {
          display: flex;
          align-items: flex-start;
          font-size: 12px;
          padding: 6px 0;
          border-bottom: 1px solid #f1f1f1;
          gap: 10px;
        }
        .print-page.compact .resident-row {
          padding: 4px 0;
          font-size: 11px;
        }
        .resident-row:last-child {
          border-bottom: none;
        }
        .resident-bed {
          font-weight: 600;
          color: #5c5c5c;
          min-width: 24px;
          text-align: center;
        }
        .print-page.compact .resident-bed {
          min-width: 20px;
          font-size: 10px;
        }
        .resident-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .resident-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        .resident-name {
          font-weight: 500;
        }
        .resident-divider {
          color: #b0b0b0;
        }
        .resident-age {
          color: #7a7a7a;
        }
        .resident-meta {
          font-size: 11px;
          color: #8d8d8d;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .meta-item {
          white-space: nowrap;
        }
        .resident-empty {
          text-align: center;
          color: #b3b3b3;
          font-size: 12px;
          padding: 8px 0;
        }
        .print-footer {
          margin-top: 24px;
          font-size: 12px;
          color: #888;
          text-align: center;
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
            border-radius: 0;
            max-width: unset;
          }
          .print-header {
            border-bottom: none;
            padding-bottom: 0;
          }
          .floor-section:not(:first-of-type) {
            page-break-before: always;
          }
          .floor-section,
          .room-card {
            break-inside: avoid;
            page-break-inside: avoid;
            print-color-adjust: exact;
          }
          .room-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
