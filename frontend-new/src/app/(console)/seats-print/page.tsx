"use client";

import { useMemo, useState } from "react";
import { Button, Card, Empty, Space } from "antd";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { useMeditationSeats, useStudents } from "@/hooks/queries";
import type { MeditationSeat } from "@/types/domain";
import { SeatItem } from "@/components/meditation/SeatItem";

type RegionSeats = {
  regionCode: string;
  regionName?: string;
  seats: MeditationSeat[];
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
  gender?: "M" | "F";
};

function groupByRegion(seats: MeditationSeat[]): RegionSeats[] {
  const groups = new Map<string, MeditationSeat[]>();

  seats.forEach((seat) => {
    const key = seat.regionCode || "默认区";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(seat);
  });

  return Array.from(groups.entries()).map(([regionCode, regionSeats]) => {
    const rowIndices = regionSeats.map((s) => s.rowIndex ?? 0);
    const colIndices = regionSeats.map((s) => s.colIndex ?? 0);
    const maxRow = rowIndices.length ? Math.max(...rowIndices) : 0;
    const maxCol = colIndices.length ? Math.max(...colIndices) : 0;
    const minRow = rowIndices.length ? Math.min(...rowIndices) : 0;
    const minCol = colIndices.length ? Math.min(...colIndices) : 0;

    const genderCount = { M: 0, F: 0 };
    regionSeats.forEach((seat) => {
      if (seat.gender === "M") genderCount.M += 1;
      if (seat.gender === "F") genderCount.F += 1;
    });
    const gender = genderCount.M > genderCount.F ? "M" : genderCount.F > 0 ? "F" : undefined;

    return {
      regionCode,
      regionName: regionSeats[0]?.regionCode,
      seats: regionSeats,
      minRow,
      maxRow,
      minCol,
      maxCol,
      gender,
    };
  });
}

function createSeatGrid(region: RegionSeats): (MeditationSeat | null)[][] {
  const rows = region.maxRow - region.minRow + 1;
  const cols = region.maxCol - region.minCol + 1;
  const grid: (MeditationSeat | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  );

  region.seats.forEach((seat) => {
    const normRow = (seat.rowIndex ?? 0) - region.minRow;
    const normCol = (seat.colIndex ?? 0) - region.minCol;
    if (normRow >= 0 && normRow < rows && normCol >= 0 && normCol < cols) {
      grid[normRow][normCol] = seat;
    }
  });

  return grid;
}

function isFemaleRegion(region: RegionSeats) {
  if (region.gender === "F") return true;
  if (region.gender === "M") return false;
  const code = (region.regionCode || "").toUpperCase();
  return code.startsWith("B");
}

function resolveRegionLabel(region: RegionSeats) {
  if (region.regionName) return region.regionName;
  if (region.regionCode) return `${region.regionCode}区`;
  return "禅堂区域";
}

function SeatPrintRegion({ region, alignRows }: { region: RegionSeats; alignRows?: number }) {
  const grid = useMemo(() => createSeatGrid(region), [region]);
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;
  const targetRows = alignRows ? Math.max(alignRows, rowCount) : rowCount;
  const emptyRowsOnTop = Math.max(targetRows - rowCount, 0);
  const reverseColumns = isFemaleRegion(region);

  const rowsForRender = useMemo(() => {
    const paddedRows = Array.from({ length: emptyRowsOnTop }).map((_, idx) => ({
      key: `pad-${idx}`,
      isPlaceholder: true,
      displayRow: targetRows - idx,
      cells: Array.from({ length: colCount }, () => null as MeditationSeat | null),
    }));
    const actualRows = [...grid].reverse().map((cells, idx) => ({
      key: `row-${idx}`,
      isPlaceholder: false,
      displayRow: rowCount - idx,
      cells,
    }));
    return [...paddedRows, ...actualRows];
  }, [colCount, emptyRowsOnTop, grid, rowCount, targetRows]);

  const renderRows = useMemo(() => {
    return rowsForRender
      .filter((row) => !row.isPlaceholder)
      .filter((row) => (row.cells || []).some((seat) => seat && seat.studentId));
  }, [rowsForRender]);

  const maxCols = useMemo(
    () => Math.max(...renderRows.map((row) => row.cells.length), 1),
    [renderRows],
  );
  const visibleRowCount = renderRows.length || 1;

  const scale = useMemo(() => {
    // 横向：每列约92px，行号占60px
    const estimatedWidth = 60 + maxCols * 92;
    const targetWidth = 940; // A4 横向可用宽度（含边距预估）
    const widthScale = targetWidth / Math.max(estimatedWidth, 1);

    // 纵向：每行约110px（含间距与行号）
    const estimatedHeight = visibleRowCount * 110 + 20;
    const targetHeight = 680; // A4 横向可用高度（含边距预估）
    const heightScale = targetHeight / Math.max(estimatedHeight, 1);

    const minScale = 0.55;
    const maxScale = 1;
    const bounded = Math.min(widthScale, heightScale, maxScale);
    return Math.max(minScale, bounded);
  }, [maxCols, visibleRowCount]);

  const stats = useMemo(() => {
    const total = region.seats.length;
    const allocated = region.seats.filter((s) => s.status === "allocated").length;
    const available = region.seats.filter((s) => s.status === "available").length;
    return { total, allocated, available };
  }, [region.seats]);

  return (
    <div className="seat-print-region">
      <div className="seat-print-region-header">
        <div className="seat-print-title">
          {resolveRegionLabel(region)}（{reverseColumns ? "女众" : "男众"}）
        </div>
        <div className="seat-print-meta">
          <span>总计 {stats.total}</span>
          <span>已分配 {stats.allocated}</span>
          <span>可用 {stats.available}</span>
        </div>
      </div>

      <div className="seat-print-grid" style={{ ["--print-scale" as string]: scale }}>
        {renderRows.map((row) => {
          const orderedCells = reverseColumns ? [...row.cells].reverse() : row.cells;
          return (
            <div key={row.key} className="seat-print-row">
              <div className="seat-print-row-label">第{row.displayRow}排</div>
              <div className="seat-print-row-cells">
                {orderedCells.map((seat, idx) =>
                  seat && seat.studentId ? (
                    <SeatItem
                      key={seat.id ?? `${region.regionCode}-${seat.rowIndex}-${seat.colIndex}`}
                      seat={seat}
                      highlighted={false}
                      selected={false}
                      draggable={false}
                    />
                  ) : (
                    <div key={`empty-${row.key}-${idx}`} className="print-placeholder print-hide-empty" />
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GenderPrintPage({
  gender,
  regions,
  alignRows,
}: {
  gender: "M" | "F";
  regions: RegionSeats[];
  alignRows?: number;
}) {
  const title = gender === "F" ? "女众座位" : "男众座位";
  const seats = regions.flatMap((r) => r.seats);
  const stats = useMemo(() => {
    const total = seats.length;
    const allocated = seats.filter((s) => s.status === "allocated").length;
    const available = seats.filter((s) => s.status === "available").length;
    return { total, allocated, available };
  }, [seats]);

  if (regions.length === 0) {
    return null;
  }

  return (
    <div className="seat-print-page">
      <div className="seat-print-gender-grid">
        {regions.map((region) => (
          <SeatPrintRegion key={region.regionCode} region={region} alignRows={alignRows} />
        ))}
      </div>
    </div>
  );
}

export default function SeatsPrintPage() {
  const { currentSession } = useAppContext();
  const seatsQuery = useMeditationSeats(currentSession?.id);
  const studentsQuery = useStudents(currentSession?.id);
  const [visibleGender, setVisibleGender] = useState<"F" | "M">("F");
  const router = useRouter();

  const rawSeats = useMemo(() => seatsQuery.data ?? [], [seatsQuery.data]);
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const seats = useMemo(() => {
    return rawSeats.map((seat) => {
      const student = students.find((s) => s.id === seat.studentId);
      return {
        ...seat,
        studentName: student?.name || seat.studentName,
        age: student?.age,
        studyTimes: student?.studyTimes,
        serviceTimes: student?.serviceTimes,
      };
    });
  }, [rawSeats, students]);

  const regions = useMemo(() => groupByRegion(seats), [seats]);
  const femaleRegions = useMemo(() => regions.filter((r) => isFemaleRegion(r)), [regions]);
  const maleRegions = useMemo(() => regions.filter((r) => !isFemaleRegion(r)), [regions]);

  const femaleMaxRows = useMemo(
    () => Math.max(...femaleRegions.map((r) => r.maxRow - r.minRow + 1), 0),
    [femaleRegions],
  );
  const maleMaxRows = useMemo(() => Math.max(...maleRegions.map((r) => r.maxRow - r.minRow + 1), 0), [maleRegions]);

  if (!currentSession) {
    return (
      <Card>
        <PageHeader title="打印视图" description="请选择会期后再打印" />
        <Empty />
      </Card>
    );
  }

  if (seats.length === 0) {
    return (
      <Card>
        <PageHeader title="打印视图" description="暂无座位数据，请先生成座位" />
        <Empty />
      </Card>
    );
  }

  return (
    <div className="print-container main-container">
      <div className="no-print" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <PageHeader title="打印视图" description="女众第一页、男众第二页，A4 横向打印。" />
          <Space>
            <Button onClick={() => router.push('/seats-management')}>返回座位管理</Button>
            <Button
              type={visibleGender === "F" ? "primary" : "default"}
              onClick={() => setVisibleGender("F")}
            >
              仅看女众
            </Button>
            <Button
              type={visibleGender === "M" ? "primary" : "default"}
              onClick={() => setVisibleGender("M")}
            >
              仅看男众
            </Button>
            <Button type="primary" onClick={() => window.print()}>
              打印当前
            </Button>
          </Space>
        </div>
      </div>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {visibleGender === "F" && <GenderPrintPage gender="F" regions={femaleRegions} alignRows={femaleMaxRows} />}
        {visibleGender === "M" && <GenderPrintPage gender="M" regions={maleRegions} alignRows={maleMaxRows} />}
      </Space>
    </div>
  );
}
