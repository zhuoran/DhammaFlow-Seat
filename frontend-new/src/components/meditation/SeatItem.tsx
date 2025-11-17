"use client";

import type { CSSProperties } from "react";
import type { MeditationSeat } from "@/types/domain";

interface SeatItemProps {
  seat: MeditationSeat;
  selected?: boolean;
  onClick?: (seat: MeditationSeat) => void;
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
export function SeatItem({ seat, selected = false, onClick }: SeatItemProps) {
  const getSeatColor = (): string => {
    if (seat.status === 'reserved') {
      return '#F5F5F5';
    }

    if (seat.status === 'available') {
      return '#E0E7FF';
    }

    // allocated
    if (seat.gender === 'M') {
      return '#4F6FAE';
    }

    if (seat.gender === 'F') {
      return '#C7B2D6';
    }

    return '#E0E7FF';
  };

  const getTextColor = (): string => {
    if (seat.status === 'available' || seat.status === 'reserved') {
      return '#666';
    }

    // allocated seats use white text
    return '#fff';
  };

  const handleClick = () => {
    if (seat.status !== 'reserved') {
      onClick?.(seat);
    }
  };

  const seatStyle: CSSProperties = {
    width: '48px',
    height: '48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: getSeatColor(),
    color: getTextColor(),
    borderRadius: '6px',
    cursor: seat.status === 'reserved' ? 'not-allowed' : 'pointer',
    border: selected ? '2px solid #1890ff' : '1px solid #d9d9d9',
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: 1.2,
    transition: 'all 0.2s ease',
    userSelect: 'none',
    position: 'relative',
  };

  const hoverStyle: CSSProperties = seat.status !== 'reserved' ? {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-1px)',
    border: '2px solid #fff',
  } : {};

  return (
    <div
      style={seatStyle}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (seat.status !== 'reserved') {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (seat.status !== 'reserved') {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.border = selected ? '2px solid #1890ff' : '1px solid #d9d9d9';
        }
      }}
      title={seat.studentName ? `${seat.seatNumber} - ${seat.studentName}` : seat.seatNumber}
    >
      <div style={{ fontSize: '10px', opacity: 0.9 }}>{seat.seatNumber}</div>
      {seat.studentName && (
        <div style={{ fontSize: '9px', opacity: 0.85, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center', padding: '0 2px' }}>
          {seat.studentName.length > 3 ? seat.studentName.slice(0, 3) : seat.studentName}
        </div>
      )}
    </div>
  );
}
