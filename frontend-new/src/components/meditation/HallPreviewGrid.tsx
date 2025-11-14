'use client'

import { Card, Empty } from 'antd'
import type { CompiledLayout, CompiledSeatCell } from '@/types/domain'
import styles from './HallPreviewGrid.module.css'

const purposeColors: Record<string, string> = {
  MONK: '#f59f9f',
  OLD_STUDENT: '#8ac6d1',
  NEW_STUDENT: '#a7c957',
  WORKER: '#f4a259',
  RESERVED: '#ced4da',
  MIXED: '#c3aed6',
}

interface Props {
  layout?: CompiledLayout
  loading?: boolean
}

export function HallPreviewGrid({ layout, loading }: Props) {
  if (!layout || layout.cells.length === 0) {
    return (
      <Card title="布局预览">
        {loading ? <div>加载中…</div> : <Empty description="尚未预览" />}
      </Card>
    )
  }

  const { totalRows, totalCols, cells } = layout
  const cellKey = (row: number, col: number) => `${row}:${col}`
  const cellMap = new Map<string, CompiledSeatCell>()
  cells.forEach((cell) => cellMap.set(cellKey(cell.row, cell.col), cell))

  const rows = Array.from({ length: totalRows }, (_, row) => row)
  const cols = Array.from({ length: totalCols }, (_, col) => col)

  return (
    <Card title="布局预览" extra={<span>共 {totalRows} 行 × {totalCols} 列</span>}>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${totalCols}, 1fr)` }}>
        {rows.map((row) =>
          cols.map((col) => {
            const cell = cellMap.get(cellKey(row, col))
            const color = cell?.purpose ? purposeColors[cell.purpose] ?? '#e9ecef' : '#ffffff'
            return (
              <div
                key={`${row}-${col}`}
                className={styles.cell}
                style={{ backgroundColor: cell?.reserved ? '#ffccd5' : color }}
                title={`${cell?.sectionName ?? '空'} (${row}, ${col})`}
              />
            )
          }),
        )}
      </div>
      <div className={styles.legend}>
        {Object.entries(purposeColors).map(([purpose, color]) => (
          <div key={purpose} className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ backgroundColor: color }} />
            <span>{purpose}</span>
          </div>
        ))}
        <div className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ backgroundColor: '#ffccd5' }} />
          <span>预留/不可用</span>
        </div>
      </div>
    </Card>
  )
}
