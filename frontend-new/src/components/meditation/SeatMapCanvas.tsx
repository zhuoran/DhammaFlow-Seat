"use client";

import { useMemo } from "react";
import { Card, Empty, Space, Spin, Tag } from "antd";
import type { MeditationSeat } from "@/types/domain";
import { SeatItem } from "./SeatItem";
import { TeacherSeat } from "./TeacherSeat";

interface SeatMapCanvasProps {
  seats: MeditationSeat[];
  loading?: boolean;
  selectedSeatId?: number;
  onSeatClick?: (seat: MeditationSeat) => void;
}

interface RegionSeats {
  regionCode: string;
  regionName?: string;
  seats: MeditationSeat[];
  minRow: number; // 该区域最小行号（用于归一化）
  maxRow: number; // 该区域最大行号
  minCol: number; // 该区域最小列号
  maxCol: number; // 该区域最大列号
  gender?: 'M' | 'F';
}

/**
 * 电影院风格座位图画布
 * 支持双区域合并显示（A区左、B区右，中间分割线）
 * 包含老师法坐区域
 */
export function SeatMapCanvas({ seats, loading = false, selectedSeatId, onSeatClick }: SeatMapCanvasProps) {
  // 按区域分组座位
  const regionGroups = useMemo<RegionSeats[]>(() => {
    const groups = new Map<string, MeditationSeat[]>();

    seats.forEach((seat) => {
      const key = seat.regionCode;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(seat);
    });

    return Array.from(groups.entries())
      .map(([regionCode, regionSeats]) => {
        const rowIndices = regionSeats.map((s) => s.rowIndex);
        const colIndices = regionSeats.map((s) => s.colIndex);
        const maxRow = rowIndices.length ? Math.max(...rowIndices) : 0;
        const maxCol = colIndices.length ? Math.max(...colIndices) : 0;
        const minRow = rowIndices.length ? Math.min(...rowIndices) : 0;
        const minCol = colIndices.length ? Math.min(...colIndices) : 0;

        // 统计区域内座位的性别分布，取主要性别
        const genderCount = { M: 0, F: 0 };
        regionSeats.forEach((seat) => {
          if (seat.gender === 'M') genderCount.M++;
          else if (seat.gender === 'F') genderCount.F++;
        });
        const gender = genderCount.M > genderCount.F ? 'M' : genderCount.F > 0 ? 'F' : undefined;

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
      })
      .sort((a, b) => a.regionCode.localeCompare(b.regionCode)); // 按区域代码排序，确保A在前
  }, [seats]);

  // 检测是否为双性课程（有两个区域）
  const isDualGender = useMemo(() => {
    return regionGroups.length === 2;
  }, [regionGroups]);

  // 创建座位网格
  const createSeatGrid = (region: RegionSeats) => {
    const grid: (MeditationSeat | null)[][] = [];
    const rows = region.maxRow - region.minRow + 1;
    const cols = region.maxCol - region.minCol + 1;

    // 初始化网格
    for (let row = 0; row < rows; row++) {
      grid[row] = [];
      for (let col = 0; col < cols; col++) {
        grid[row][col] = null;
      }
    }

    // 填充座位
    region.seats.forEach((seat) => {
      const normRow = seat.rowIndex - region.minRow;
      const normCol = seat.colIndex - region.minCol;
      if (normRow >= 0 && normRow < rows && normCol >= 0 && normCol < cols) {
        grid[normRow][normCol] = seat;
      }
    });

    return grid;
  };

  const resolveRegionLabel = (region: RegionSeats) => {
    if (region.regionName) return region.regionName;
    if (region.regionCode) return `${region.regionCode}区`;
    return '禅堂区域';
  };

  const isFemaleRegion = (region: RegionSeats) => {
    if (region.gender === 'F') return true;
    if (region.gender === 'M') return false;
    const code = region.regionCode.toUpperCase();
    return code.startsWith('B'); // 约定 B=女众
  };

  // 渲染单个区域的座位网格（不含Card外壳）
  const renderRegionSeats = (
    region: RegionSeats,
    showLabel = true,
    isLeftRegion?: boolean
  ) => {
    const grid = createSeatGrid(region);
    const actualRows = grid.length;
    const femaleRegion = isFemaleRegion(region);

    return (
      <div className="flex flex-col gap-2">
        {showLabel && (
          <div className="text-center text-sm font-semibold text-gray-600">
            {resolveRegionLabel(region)} ({femaleRegion ? '女众' : '男众'})
          </div>
        )}
        <div className="inline-block bg-white p-4 rounded-lg">
          {[...grid].reverse().map((row, reverseIdx) => {
            // 反转后：第1排在下方（接近老师），最后一排在上方
            const rowIdx = actualRows - 1 - reverseIdx;
            const displayRowNumber = rowIdx + 1;

            return (
              <div
                key={rowIdx}
                className={`flex gap-1.5 items-center ${reverseIdx < grid.length - 1 ? 'mb-1.5' : ''}`}
              >
                <div className="w-8 text-right text-xs text-gray-500 mr-2">
                  第{displayRowNumber}排
                </div>
                {/* 根据区域位置决定列顺序 */}
                {isLeftRegion 
                  ? /* 左侧区域（女众）：反转列顺序，1号在右侧（靠近中间） */
                    [...row].reverse().map((seat, reverseColIdx) => {
                      const colIdx = row.length - 1 - reverseColIdx;
                      return seat ? (
                        <SeatItem
                          key={seat.id}
                          seat={seat}
                          selected={seat.id === selectedSeatId}
                          onClick={onSeatClick}
                        />
                      ) : (
                        <div
                          key={`empty-${rowIdx}-${colIdx}`}
                          className="w-12 h-12 bg-transparent"
                        />
                      );
                    })
                  : /* 右侧区域（男众）：正常顺序，1号在左侧（靠近中间） */
                    row.map((seat, colIdx) => {
                      return seat ? (
                        <SeatItem
                          key={seat.id}
                          seat={seat}
                          selected={seat.id === selectedSeatId}
                          onClick={onSeatClick}
                        />
                      ) : (
                        <div
                          key={`empty-${rowIdx}-${colIdx}`}
                          className="w-12 h-12 bg-transparent"
                        />
                      );
                    })
                }
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 渲染双区域合并布局
  const renderDualRegionLayout = () => {
    if (regionGroups.length !== 2) {
      return null;
    }

    // 按性别排序：女众在左（法座左边），男众在右（法座右边）
    const sortedRegions = [...regionGroups].sort((a, b) => {
      if (a.gender === 'F' && b.gender === 'M') return -1;
      if (a.gender === 'M' && b.gender === 'F') return 1;
      return 0;
    });

    const leftRegion = sortedRegions[0];
    const rightRegion = sortedRegions[1];
    
    const totalStats = {
      total: leftRegion.seats.length + rightRegion.seats.length,
      allocated:
        leftRegion.seats.filter((s) => s.status === 'allocated').length +
        rightRegion.seats.filter((s) => s.status === 'allocated').length,
      available:
        leftRegion.seats.filter((s) => s.status === 'available').length +
        rightRegion.seats.filter((s) => s.status === 'available').length,
    };

    // 检测是否同一位老师（简化：默认双性课程共用一位老师）
    const sameTeacher = true;

    return (
      <Card
        title={
          <Space>
            <span>禅堂座位图</span>
            <Tag color="blue">总计 {totalStats.total}</Tag>
            <Tag color="green">已分配 {totalStats.allocated}</Tag>
            <Tag color="default">可用 {totalStats.available}</Tag>
          </Space>
        }
        styles={{ body: { padding: '24px', backgroundColor: '#fafafa' } }}
      >
        <div className="flex flex-col gap-8">
          {/* 座位区域：左区 | 分割线 | 右区 */}
          <div className="flex gap-6 items-end justify-center">
            {/* 左侧区域 */}
            {renderRegionSeats(leftRegion, true, true)}

            {/* 中间分割线 */}
            <div className="w-0.5 self-stretch bg-gray-300 mx-4" />

            {/* 右侧区域 */}
            {renderRegionSeats(rightRegion, true, false)}
          </div>

          {/* 老师法座区域 */}
          <div className="border-t-2 border-gray-300 pt-6 mt-2">
            {sameTeacher ? (
              // 同一位老师：法座在正中间
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-3">
                  老师法座
                </div>
                <TeacherSeat label="法座" />
              </div>
            ) : (
              // 不同老师：每个区域下方各有一个法座
              <div className="flex justify-around gap-12">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-3">
                    {leftRegion.regionCode}区老师法座
                  </div>
                  <TeacherSeat label="法座" regionCode={leftRegion.regionCode} />
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-3">
                    {rightRegion.regionCode}区老师法座
                  </div>
                  <TeacherSeat label="法座" regionCode={rightRegion.regionCode} />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // 渲染单区域布局（保持原有逻辑）
  const renderSingleRegionLayout = (region: RegionSeats) => {
    const stats = {
      total: region.seats.length,
      allocated: region.seats.filter((s) => s.status === 'allocated').length,
      available: region.seats.filter((s) => s.status === 'available').length,
    };

    return (
      <Card
        key={region.regionCode}
        title={
          <Space>
            <span>{region.regionName || region.regionCode}区</span>
            <Tag color="blue">总计 {stats.total}</Tag>
            <Tag color="green">已分配 {stats.allocated}</Tag>
            <Tag color="default">可用 {stats.available}</Tag>
          </Space>
        }
        styles={{ body: { padding: '16px', backgroundColor: '#fafafa' } }}
      >
        <div className="flex flex-col gap-6">
          {renderRegionSeats(region, false)}

          {/* 单区域也显示法座 */}
          <div className="border-t-2 border-gray-300 pt-6 text-center">
            <div className="text-xs text-gray-500 mb-3">
              老师法座
            </div>
            <TeacherSeat label="法座" />
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <Spin tip="加载座位数据..." size="large">
          <div className="p-10 min-h-[200px]" />
        </Spin>
      </Card>
    );
  }

  if (seats.length === 0) {
    return (
      <Card>
        <Empty description="暂无座位数据，请先生成座位" />
      </Card>
    );
  }

  // 根据是否双性课程选择布局方式
  if (isDualGender) {
    return renderDualRegionLayout();
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      {regionGroups.map((region) => renderSingleRegionLayout(region))}
    </Space>
  );
}
