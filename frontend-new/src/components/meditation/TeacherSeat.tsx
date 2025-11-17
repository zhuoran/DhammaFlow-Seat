"use client";

import type { CSSProperties } from "react";

interface TeacherSeatProps {
  label?: string;
  regionCode?: string;
}

/**
 * 老师法座组件
 * 设计庄重，尺寸较大，用于显示老师的座位
 */
export function TeacherSeat({ label = "法座", regionCode }: TeacherSeatProps) {
  const seatStyle: CSSProperties = {
    width: '120px',
    height: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B4513',
    color: '#FFD700',
    borderRadius: '8px',
    border: '3px solid #654321',
    fontSize: '16px',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(139, 69, 19, 0.3)',
    position: 'relative',
    margin: '0 auto',
  };

  const labelStyle: CSSProperties = {
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '2px',
  };

  const regionLabelStyle: CSSProperties = {
    fontSize: '11px',
    fontWeight: 500,
    opacity: 0.85,
    marginTop: '4px',
  };

  return (
    <div style={seatStyle}>
      <div style={labelStyle}>{label}</div>
      {regionCode && <div style={regionLabelStyle}>{regionCode}区老师</div>}
    </div>
  );
}
