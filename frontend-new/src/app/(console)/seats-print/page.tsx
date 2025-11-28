"use client";

import { useMemo } from "react";
import { Card, Empty, Space } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { useMeditationSeats } from "@/hooks/queries";
import type { MeditationSeat } from "@/types/domain";
import { SeatItem } from "@/components/meditation/SeatItem";

function PrintSection({ title, seats, className }: { title: string; seats: MeditationSeat[]; className: string }) {
  const sorted = useMemo(
    () => [...seats].sort((a, b) => (a.seatNumber || "").localeCompare(b.seatNumber || "", "zh-CN")),
    [seats],
  );

  return (
    <div className={`print-section hide-companion ${className}`}>
      <h3 style={{ textAlign: "center", marginBottom: 12 }}>{title}</h3>
      <div className="print-grid">
        {sorted.map((seat) => (
          <SeatItem key={seat.id} seat={seat} highlighted={false} selected={false} draggable={false} />
        ))}
      </div>
      <div className="print-page-break" />
    </div>
  );
}

export default function SeatsPrintPage() {
  const { currentSession } = useAppContext();
  const seatsQuery = useMeditationSeats(currentSession?.id);
  const seats = useMemo(() => seatsQuery.data ?? [], [seatsQuery.data]);

  if (!currentSession) {
    return (
      <Card>
        <PageHeader title="打印视图" description="请选择会期后再打印" />
        <Empty />
      </Card>
    );
  }

  const maleSeats = seats.filter((s) => s.gender === "M");
  const femaleSeats = seats.filter((s) => s.gender === "F");

  return (
    <div className="print-container main-container">
      <div className="no-print" style={{ marginBottom: 16 }}>
        <PageHeader title="打印视图" description="每个性别一页，适配 A4 横向。打印时请勾选背景图形。" />
      </div>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {femaleSeats.length > 0 && <PrintSection className="section-b" title="B区（女众）" seats={femaleSeats} />}
        {maleSeats.length > 0 && <PrintSection className="section-a" title="A区（男众）" seats={maleSeats} />}
      </Space>
    </div>
  );
}
