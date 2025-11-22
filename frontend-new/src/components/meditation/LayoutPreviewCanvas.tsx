'use client'

import { useMemo } from 'react'
import { Card, Space, Tag } from 'antd'
import type { HallLayout } from '@/types/domain'
import { TeacherSeat } from './TeacherSeat'

interface PreviewSeat {
  row: number
  col: number
  sectionName: string
  purpose: string
  seatNumber?: string
}

interface LayoutPreviewCanvasProps {
  layout: HallLayout
  loading?: boolean
}

/**
 * 电影院风格配置预览画布
 * 用于预览禅堂布局配置（未生成实际座位前）
 */
export function LayoutPreviewCanvas({ layout, loading = false }: LayoutPreviewCanvasProps) {
  // 从布局生成预览座位数据
  const previewSeats = useMemo<PreviewSeat[]>(() => {
    const seats: PreviewSeat[] = []
    const sections = layout.sections || []

    sections.forEach((section) => {
      for (let row = section.rowStart; row < section.rowEnd; row++) {
        for (let col = section.colStart; col < section.colEnd; col++) {
          seats.push({
            row,
            col,
            sectionName: section.name,
            purpose: section.purpose,
          })
        }
      }
    })

    return seats
  }, [layout])

  // 按区域分组
  const regionGroups = useMemo(() => {
    const groups = new Map<string, PreviewSeat[]>()

    previewSeats.forEach((seat) => {
      const key = seat.sectionName
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)?.push(seat)
    })

    return Array.from(groups.entries()).map(([sectionName, seats]) => {
      const maxRow = Math.max(...seats.map((s) => s.row), 0)
      const maxCol = Math.max(...seats.map((s) => s.col), 0)
      const section = layout.sections?.find((s) => s.name === sectionName)

      return {
        sectionName,
        seats,
        maxRow,
        maxCol,
        purpose: section?.purpose || 'MIXED',
      }
    })
  }, [previewSeats, layout.sections])

  // 检测是否为双性课程（有两个区域）
  const isDualGender = useMemo(() => {
    return regionGroups.length === 2
  }, [regionGroups])

  // 创建座位网格（修复：使用实际的行列范围）
  const createSeatGrid = (region: typeof regionGroups[0]) => {
    const section = layout.sections?.find((s) => s.name === region.sectionName)
    if (!section) return []

    const rows = section.rowEnd - section.rowStart
    const cols = section.colEnd - section.colStart
    const grid: (PreviewSeat | null)[][] = []

    // 初始化网格（使用实际尺寸）
    for (let row = 0; row < rows; row++) {
      grid[row] = []
      for (let col = 0; col < cols; col++) {
        grid[row][col] = null
      }
    }

    // 填充座位（映射到网格坐标）
    region.seats.forEach((seat) => {
      const gridRow = seat.row - section.rowStart
      const gridCol = seat.col - section.colStart
      if (gridRow >= 0 && gridRow < rows && gridCol >= 0 && gridCol < cols) {
        grid[gridRow][gridCol] = seat
      }
    })

    return grid
  }

  // 获取座位颜色（根据用途）
  const getSeatColor = (purpose: string): string => {
    switch (purpose) {
      case 'MONK':
        return '#f59f9f'
      case 'OLD_STUDENT':
        return '#8ac6d1'
      case 'NEW_STUDENT':
        return '#a7c957'
      case 'WORKER':
        return '#f4a259'
      case 'RESERVED':
        return '#F5F5F5'
      case 'MIXED':
        return '#E0E7FF'
      default:
        return '#E0E7FF'
    }
  }

  // 渲染单个座位（参考 SeatItem 的电影院风格）
  const renderPreviewSeat = (seat: PreviewSeat | null, gridRow: number, gridCol: number) => {
    if (!seat) {
      return (
        <div
          key={`empty-${gridRow}-${gridCol}`}
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: 'transparent',
          }}
        />
      )
    }

    const backgroundColor = getSeatColor(seat.purpose)
    // 使用网格坐标计算座位编号（从1开始）
    // gridRow 是从0开始的网格索引，+1 后就是第几排
    const seatNumber = `${gridRow + 1}-${gridCol + 1}`
    const isReserved = seat.purpose === 'RESERVED'
    const textColor = isReserved ? '#666' : '#333'

    // 参考 SeatItem 的样式
    const seatStyle: React.CSSProperties = {
      width: '48px',
      height: '48px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor,
      color: textColor,
      borderRadius: '6px',
      cursor: 'default',
      border: '1px solid #d9d9d9',
      fontSize: '11px',
      fontWeight: 500,
      lineHeight: 1.2,
      transition: 'all 0.2s ease',
      userSelect: 'none',
      position: 'relative',
    }

    return (
      <div
        key={`${gridRow}-${gridCol}`}
        style={seatStyle}
        title={`${seat.sectionName} - ${seat.purpose} (第${gridRow + 1}排-第${gridCol + 1}座)`}
      >
        <div style={{ fontSize: '10px', opacity: 0.9 }}>{seatNumber}</div>
      </div>
    )
  }

  // 渲染单个区域的座位网格（支持对齐到法座）
  const renderRegionSeats = (region: typeof regionGroups[0], showLabel = true, maxRows?: number, isLeftRegion = false) => {
    const grid = createSeatGrid(region)
    const actualRows = grid.length
    const alignRows = maxRows || actualRows // 用于对齐的总行数

    // 判断区域性别（根据区域名称或用途推断）
    const isFemaleRegion = region.sectionName.includes('女') || region.sectionName.includes('B')
    const isMaleRegion = region.sectionName.includes('男') || region.sectionName.includes('A')

    // 计算需要在顶部添加的空白行数
    const emptyRowsOnTop = alignRows - actualRows

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        {showLabel && (
          <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#666' }}>
            {region.sectionName}
            {isFemaleRegion && ' (女众)'}
            {isMaleRegion && ' (男众)'}
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
          {/* 渲染空白行（如果需要对齐） */}
          {emptyRowsOnTop > 0 && Array.from({ length: emptyRowsOnTop }).map((_, emptyIdx) => {
            const emptyRowNumber = alignRows - emptyIdx
            return (
              <div
                key={`empty-${emptyIdx}`}
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '6px',
                  alignItems: 'center',
                  opacity: 0.3,
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
                  第{emptyRowNumber}排
                </div>
                {/* 空白占位 */}
                <div style={{ height: '48px' }} />
              </div>
            )
          })}

          {/* 渲染实际座位（从最后一排到第一排，反转显示） */}
          {[...grid].reverse().map((row, reverseIdx) => {
            const rowIdx = actualRows - 1 - reverseIdx
            const displayRowNumber = rowIdx + 1

            return (
              <div
                key={rowIdx}
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: reverseIdx < grid.length - 1 ? '6px' : 0,
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
                {/* 根据区域位置决定列顺序 */}
                {isLeftRegion 
                  ? /* 左侧区域（女众）：反转列顺序，1号在右侧（靠近中间） */
                    [...row].reverse().map((seat, reverseColIdx) => {
                      const colIdx = row.length - 1 - reverseColIdx
                      return renderPreviewSeat(seat, rowIdx, colIdx)
                    })
                  : /* 右侧区域（男众）：正常顺序，1号在左侧（靠近中间） */
                    row.map((seat, colIdx) => renderPreviewSeat(seat, rowIdx, colIdx))
                }
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 渲染双区域合并布局
  const renderDualRegionLayout = () => {
    if (regionGroups.length !== 2) {
      return null
    }

    // 按区域名称排序：女众在左，男众在右
    const sortedRegions = [...regionGroups].sort((a, b) => {
      const aIsFemale = a.sectionName.includes('女') || a.sectionName.includes('B')
      const bIsFemale = b.sectionName.includes('女') || b.sectionName.includes('B')
      if (aIsFemale && !bIsFemale) return -1
      if (!aIsFemale && bIsFemale) return 1
      return 0
    })

    const leftRegion = sortedRegions[0]
    const rightRegion = sortedRegions[1]

    const totalCapacity = leftRegion.seats.length + rightRegion.seats.length

    // 获取两个区域的实际行数
    const leftSection = layout.sections?.find((s) => s.name === leftRegion.sectionName)
    const rightSection = layout.sections?.find((s) => s.name === rightRegion.sectionName)
    const leftRows = leftSection ? leftSection.rowEnd - leftSection.rowStart : 0
    const rightRows = rightSection ? rightSection.rowEnd - rightSection.rowStart : 0
    const maxRows = Math.max(leftRows, rightRows)

    return (
      <Card
        title={
          <Space>
            <span>禅堂布局预览</span>
            <Tag color="blue">总容量 {totalCapacity} 座</Tag>
            <Tag color="green">左区 {leftRegion.seats.length} 座</Tag>
            <Tag color="purple">右区 {rightRegion.seats.length} 座</Tag>
          </Space>
        }
        styles={{ body: { padding: '24px', backgroundColor: '#fafafa' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 座位区域：左区 | 分割线 | 右区 - 底部对齐（靠近法座） */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', justifyContent: 'center' }}>
            {/* 左侧区域（女众） */}
            {renderRegionSeats(leftRegion, true, maxRows, true)}

            {/* 中间分割线 */}
            <div style={{ width: '1px', backgroundColor: '#d9d9d9', alignSelf: 'stretch', margin: '0 16px' }} />

            {/* 右侧区域（男众） */}
            {renderRegionSeats(rightRegion, true, maxRows, false)}
          </div>

          {/* 老师法座区域 */}
          <div style={{ borderTop: '2px solid #d9d9d9', paddingTop: '24px', marginTop: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>老师法座</div>
              <TeacherSeat label="法座" />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // 渲染单区域布局（居中对齐）
  const renderSingleRegionLayout = (region: typeof regionGroups[0]) => {
    const capacity = region.seats.length

    return (
      <Card
        key={region.sectionName}
        title={
          <Space>
            <span>{region.sectionName}</span>
            <Tag color="blue">容量 {capacity} 座</Tag>
          </Space>
        }
        styles={{ body: { padding: '16px', backgroundColor: '#fafafa' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          {renderRegionSeats(region, false)}

          {/* 单区域也显示法座 */}
          <div style={{ borderTop: '2px solid #d9d9d9', paddingTop: '24px', width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>老师法座</div>
              <TeacherSeat label="法座" />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <div className="py-10 text-center text-gray-500">加载中...</div>
      </Card>
    )
  }

  if (!layout || previewSeats.length === 0) {
    return (
      <Card>
        <div className="py-10 text-center text-gray-500">暂无布局配置</div>
      </Card>
    )
  }

  // 根据是否双性课程选择布局方式
  if (isDualGender) {
    return renderDualRegionLayout()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {regionGroups.map((region) => renderSingleRegionLayout(region))}
    </div>
  )
}

