/**
 * 禅堂布局工具函数
 * 符合第一性原理：计算容量本质 = 计算二维空间中的格子数量
 */

import type { HallLayout, HallSection } from '@/types/domain'

/**
 * 计算单个分区的容量
 */
export function calculateSectionCapacity(section: HallSection): number {
  const rows = Math.max(0, section.rowEnd - section.rowStart)
  const cols = Math.max(0, section.colEnd - section.colStart)
  return rows * cols
}

/**
 * 计算整个布局的总容量
 */
export function calculateTotalCapacity(layout?: HallLayout): number {
  if (!layout?.sections || layout.sections.length === 0) {
    return 0
  }

  return layout.sections.reduce((total, section) => {
    return total + calculateSectionCapacity(section)
  }, 0)
}

/**
 * 检查分区是否越界
 */
export function isSectionOutOfBounds(
  section: HallSection,
  totalRows?: number,
  totalCols?: number
): boolean {
  if (!totalRows || !totalCols) {
    return false
  }

  return (
    section.rowStart < 0 ||
    section.rowEnd > totalRows ||
    section.colStart < 0 ||
    section.colEnd > totalCols
  )
}

/**
 * 检查两个分区是否重叠
 */
export function doSectionsOverlap(a: HallSection, b: HallSection): boolean {
  // 使用矩形相交算法
  const rowOverlap = a.rowStart < b.rowEnd && a.rowEnd > b.rowStart
  const colOverlap = a.colStart < b.colEnd && a.colEnd > b.colStart
  return rowOverlap && colOverlap
}

/**
 * 查找与指定分区重叠的所有分区
 */
export function findOverlappingSections(
  section: HallSection,
  allSections: HallSection[],
  excludeIndex?: number
): HallSection[] {
  return allSections.filter((other, index) => {
    if (excludeIndex !== undefined && index === excludeIndex) {
      return false
    }
    return doSectionsOverlap(section, other)
  })
}

/**
 * 验证分区配置的有效性
 */
export interface SectionValidationResult {
  valid: boolean
  errors: string[]
}

export function validateSection(
  section: HallSection,
  totalRows?: number,
  totalCols?: number
): SectionValidationResult {
  const errors: string[] = []

  // 检查起始值小于结束值
  if (section.rowStart >= section.rowEnd) {
    errors.push('起始行必须小于结束行')
  }

  if (section.colStart >= section.colEnd) {
    errors.push('起始列必须小于结束列')
  }

  // 检查边界
  if (isSectionOutOfBounds(section, totalRows, totalCols)) {
    errors.push(`超出边界（总行${totalRows}，总列${totalCols}）`)
  }

  // 检查容量
  const capacity = calculateSectionCapacity(section)
  if (capacity <= 0) {
    errors.push('容量必须大于0')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
