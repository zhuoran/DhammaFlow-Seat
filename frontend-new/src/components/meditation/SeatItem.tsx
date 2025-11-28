"use client";

import type { CSSProperties, DragEvent } from "react";
import { Tooltip } from "antd";
import type { MeditationSeat } from "@/types/domain";

interface SeatItemProps {
  seat: MeditationSeat;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: (seat: MeditationSeat) => void;
  onDragStart?: (seat: MeditationSeat, event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: DragEvent<HTMLDivElement>) => void;
  onDropOn?: (seat: MeditationSeat, event: DragEvent<HTMLDivElement>) => void;
  draggable?: boolean;
  companionName?: string;
}

/**
 * 电影院风格座位单元格组件
 *
 * 颜色规范：
 * - 空座位: #E0E7FF (柔和浅紫蓝)
 * - 男众: #4F6FAE (稳定的藏青色)
 * - 女众: #C7B2D6 (柔和淡紫藤色)
 * - 不可用: #F5F5F5
 */
export function SeatItem({ seat, selected = false, highlighted = false, onClick, onDragStart, onDragEnd, onDropOn, draggable = false, companionName }: SeatItemProps) {
  const handleClick = () => {
    if (seat.status !== 'reserved') {
      onClick?.(seat);
    }
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    // 仅对非保留座位启用拖拽
    if (seat.status === 'reserved') {
      event.preventDefault();
      return;
    }
    // 附加 seatId 到 dataTransfer，便于 drop 解析
    event.dataTransfer.setData('application/seat-id', String(seat.id));
    onDragStart?.(seat, event);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    // 允许放置但不打断默认点击
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDropOn?.(seat, event);
  };

  const formatRoomBed = (): string | undefined => {
    if (!seat.bedCode) return undefined;
    const raw = seat.bedCode.trim();
    if (!raw) return undefined;

    const parts = raw.split(/[-.]/).filter(Boolean);
    const roomPart = parts[0] ?? raw;
    const bedPart = parts[1];

    const regionPrefix = seat.regionCode ? seat.regionCode.toUpperCase() : '';
    const roomWithPrefix = /^[A-Za-z]/.test(roomPart)
      ? roomPart
      : `${regionPrefix}${roomPart}`;

    const bedLabel = bedPart || '';
    return bedLabel ? `${roomWithPrefix}.${bedLabel}` : roomWithPrefix;
  };

  const roomBedLabel = formatRoomBed();
  const isEmptySeat = !seat.studentId;

  const accent = (() => {
    if (seat.gender === 'M') {
      return { border: '#4F6FAE', badgeBg: '#E8F1FF' };
    }
    if (seat.gender === 'F') {
      return { border: '#B388FF', badgeBg: '#F3E5F5' };
    }
    return { border: '#9E9E9E', badgeBg: '#F5F5F5' };
  })();

  const nameFontSize = '13.5px';

  const seatStyle: CSSProperties = {
    width: '86px',
    height: '98px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    backgroundColor: isEmptySeat ? '#f8fafc' : '#fff',
    color: '#333',
    borderRadius: '8px',
    cursor: seat.status === 'reserved' ? 'not-allowed' : 'pointer',
    borderWidth: selected ? 2 : 1,
    borderStyle: isEmptySeat ? 'dashed' : 'solid',
    borderColor: selected ? '#1890ff' : isEmptySeat ? '#cbd5e1' : '#e0e0e0',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1.4,
    transition: 'box-shadow 0.2s ease, transform 0.2s ease, border 0.2s ease',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
    padding: '6px 6px 7px',
    boxSizing: 'border-box',
    boxShadow: `inset 4px 0 0 ${accent.border}, 0 2px 6px rgba(0,0,0,0.05)`,
  };

  const normalizedStatus = seat.status?.toLowerCase() || '';
  const specialBadge = (() => {
    if (normalizedStatus.includes('preg') || normalizedStatus.includes('孕')) {
      return { label: '孕', bg: '#FFEDD5', color: '#C2410C' };
    }
    if (normalizedStatus.includes('elder') || normalizedStatus.includes('老')) {
      return { label: '老', bg: '#E5E7EB', color: '#374151' };
    }
    return null;
  })();

  const companionTooltip = companionName
    ? `同伴：${companionName}`
    : seat.companionSeatId
      ? `同伴座位ID: ${seat.companionSeatId}`
      : seat.isWithCompanion
        ? '已与同伴相邻'
        : '';

  const statsNodes = [
    seat.studyTimes !== undefined ? { label: '课', value: seat.studyTimes } : null,
    seat.serviceTimes !== undefined ? { label: '服', value: seat.serviceTimes } : null,
  ].filter(Boolean);

  return (
    <div
      id={`seat-card-${seat.id}`}
      className={`seat-card ${highlighted ? 'seat-card-highlight' : ''} ${isEmptySeat ? 'print-hide-empty' : ''}`}
      style={seatStyle}
      onClick={handleClick}
      draggable={draggable && seat.status !== 'reserved'}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      title={seat.studentName ? `${seat.seatNumber} - ${seat.studentName}` : seat.seatNumber}
    >
      {(seat.isWithCompanion || seat.companionSeatId) && (
        <Tooltip title={companionTooltip || '同伴座位'} mouseEnterDelay={0} mouseLeaveDelay={0} placement="topRight">
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: '#ff9800',
              color: '#fff',
              fontSize: '10px',
              padding: '2px 6px',
              borderBottomLeftRadius: '6px',
              fontWeight: 700,
              boxShadow: '-1px 1px 2px rgba(0,0,0,0.1)',
              zIndex: 10,
            }}
          >
            伴
          </div>
        </Tooltip>
      )}

      {specialBadge && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 6,
            background: specialBadge.bg,
            color: specialBadge.color,
            borderRadius: '6px',
            padding: '2px 4px',
            fontSize: '10px',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {specialBadge.label}
        </div>
      )}

      {/* 头部：座位号 + 姓名 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '0px', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: accent.border,
            background: accent.badgeBg,
            padding: '1px 3px',
            borderRadius: '5px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            border: 'none',
          }}
        >
          {seat.seatNumber}
        </span>
      </div>

      {/* 姓名独立一行，空位展示占位文案 */}
      <div
        style={{
          fontSize: nameFontSize,
          fontWeight: 700,
          color: isEmptySeat ? '#94a3b8' : '#222',
          textAlign: 'center',
          lineHeight: 1.1,
          minHeight: '14px',
          wordBreak: 'keep-all',
          whiteSpace: 'normal',
        }}
      >
        {seat.studentName || '空位'}
      </div>

      {/* 腰部：房号 + 年龄同一行 */}
      {(roomBedLabel || seat.age !== undefined || isEmptySeat) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '3px',
            fontSize: '10px',
            color: isEmptySeat ? '#cbd5e1' : '#888',
            marginTop: 'auto',
            marginBottom: '2px',
            lineHeight: 1.1,
          }}
        >
          {roomBedLabel && (
            <span style={{ fontFamily: '"Roboto Mono", Menlo, Consolas, Monaco, monospace' }}>
              {roomBedLabel}
            </span>
          )}
          {roomBedLabel && (seat.age !== undefined || isEmptySeat) && <span style={{ color: '#bbb' }}>|</span>}
          {seat.age !== undefined && (
            <span style={{ color: isEmptySeat ? '#cbd5e1' : '#777' }}>
              {seat.age}
            </span>
          )}
          {isEmptySeat && !roomBedLabel && seat.age === undefined && (
            <span style={{ color: '#cbd5e1' }}>未分配</span>
          )}
        </div>
      )}

      {/* 足部：统计 */}
      <div
        style={{
          fontSize: '9px',
          color: '#9a9a9a',
          background: '#f9f9f9',
          padding: '2px 3px',
          borderRadius: '4px',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          marginTop: 'auto',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        {isEmptySeat ? (
          <span style={{ color: '#cbd5e1' }}>未分配</span>
        ) : statsNodes.length ? (
          statsNodes.map((item, idx) => (
            <span key={item?.label ?? idx} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ color: '#b3b3b3' }}>{item!.label}</span>
              <span style={{ color: '#333', fontWeight: 700 }}>{item!.value}</span>
            </span>
          ))
        ) : (
          <span style={{ color: '#bbb' }}>空</span>
        )}
      </div>
    </div>
  );
}
