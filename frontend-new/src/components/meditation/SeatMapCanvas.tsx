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
  maxRow: number;
  maxCol: number;
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
        const maxRow = Math.max(...regionSeats.map((s) => s.rowIndex), 0);
        const maxCol = Math.max(...regionSeats.map((s) => s.colIndex), 0);

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
          maxRow,
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

    // 初始化网格
    for (let row = 0; row <= region.maxRow; row++) {
      grid[row] = [];
      for (let col = 0; col <= region.maxCol; col++) {
        grid[row][col] = null;
      }
    }

    // 填充座位
    region.seats.forEach((seat) => {
      if (seat.rowIndex <= region.maxRow && seat.colIndex <= region.maxCol) {
        grid[seat.rowIndex][seat.colIndex] = seat;
      }
    });

    return grid;
  };

  // 渲染单个区域的座位网格（不含Card外壳）
  const renderRegionSeats = (region: RegionSeats, showLabel = true) => {
    const grid = createSeatGrid(region);
    const totalRows = grid.length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {showLabel && (
          <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#666' }}>
            {region.regionCode}区 ({region.gender === 'M' ? '男众' : '女众'})
          </div>
        )}
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#fff',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          {[...grid].reverse().map((row, reverseIdx) => {
            // 反转后：第1排在下方（接近老师），最后一排在上方
            const rowIdx = totalRows - 1 - reverseIdx;
            const displayRowNumber = rowIdx + 1;

            return (
              <div
                key={rowIdx}
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: rowIdx < grid.length - 1 ? '6px' : 0,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    textAlign: 'right',
                    fontSize: '12px',
                    color: '#999',
                    marginRight: '8px',
                  }}
                >
                  第{displayRowNumber}排
                </div>
                {row.map((seat, colIdx) =>
                  seat ? (
                    <SeatItem
                      key={seat.id}
                      seat={seat}
                      selected={seat.id === selectedSeatId}
                      onClick={onSeatClick}
                    />
                  ) : (
                    <div
                      key={`empty-${rowIdx}-${colIdx}`}
                      style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: 'transparent',
                      }}
                    />
                  )
                )}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 座位区域：左区 | 分割线 | 右区 */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            {/* 左侧区域 */}
            <div>{renderRegionSeats(leftRegion)}</div>

            {/* 中间分割线 */}
            <div
              style={{
                width: '2px',
                alignSelf: 'stretch',
                backgroundColor: '#d9d9d9',
                margin: '0 16px',
              }}
            />

            {/* 右侧区域 */}
            <div>{renderRegionSeats(rightRegion)}</div>
          </div>

          {/* 老师法座区域 */}
          <div
            style={{
              borderTop: '2px solid #d9d9d9',
              paddingTop: '24px',
              marginTop: '8px',
            }}
          >
            {sameTeacher ? (
              // 同一位老师：法座在正中间
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                  老师法座
                </div>
                <TeacherSeat label="法座" />
              </div>
            ) : (
              // 不同老师：每个区域下方各有一个法座
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  gap: '48px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                    {leftRegion.regionCode}区老师法座
                  </div>
                  <TeacherSeat label="法座" regionCode={leftRegion.regionCode} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {renderRegionSeats(region, false)}

          {/* 单区域也显示法座 */}
          <div
            style={{
              borderTop: '2px solid #d9d9d9',
              paddingTop: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
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
          <div style={{ padding: '40px', minHeight: '200px' }} />
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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {regionGroups.map((region) => renderSingleRegionLayout(region))}
    </Space>
  );
}
