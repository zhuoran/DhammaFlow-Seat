/**
 * 前端布局编译器 - 用于实时预览
 * 不依赖后端API，直接在前端生成预览数据
 */

import type { HallLayout, CompiledLayout, CompiledSeatCell } from '@/types/domain'

/**
 * 编译布局为预览数据
 */
export function compileLayoutLocally(layout: HallLayout): CompiledLayout {
  const { totalRows = 0, totalCols = 0, sections = [] } = layout

  if (totalRows === 0 || totalCols === 0) {
    return {
      totalRows: 0,
      totalCols: 0,
      cells: [],
    }
  }

  const cells: CompiledSeatCell[] = []

  // 遍历每个分区，生成对应的单元格
  sections.forEach((section) => {
    const { rowStart, rowEnd, colStart, colEnd, name, purpose } = section

    // 验证边界
    const validRowStart = Math.max(0, Math.min(rowStart, totalRows))
    const validRowEnd = Math.max(0, Math.min(rowEnd, totalRows))
    const validColStart = Math.max(0, Math.min(colStart, totalCols))
    const validColEnd = Math.max(0, Math.min(colEnd, totalCols))

    // 生成该分区的所有单元格
    for (let row = validRowStart; row < validRowEnd; row++) {
      for (let col = validColStart; col < validColEnd; col++) {
        cells.push({
          row,
          col,
          sectionName: name,
          purpose,
          reserved: false,
        })
      }
    }
  })

  return {
    totalRows,
    totalCols,
    cells,
  }
}

/**
 * 检查表单值是否有效（用于决定是否显示预览）
 */
export function isLayoutValid(layout: Partial<HallLayout>): boolean {
  if (!layout.totalRows || !layout.totalCols) {
    return false
  }

  if (layout.totalRows <= 0 || layout.totalCols <= 0) {
    return false
  }

  if (!layout.sections || layout.sections.length === 0) {
    return false
  }

  return true
}
