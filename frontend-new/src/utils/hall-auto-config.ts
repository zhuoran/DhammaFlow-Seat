/**
 * 禅堂自动配置生成工具
 * 根据学员数据和课程设置自动生成禅堂配置
 */

import type { HallLayout, Student } from '@/types/domain'
import type { HallTemplate } from '@/constants/hall-templates'

export interface StudentStatistics {
  total: number
  female: number
  male: number
  oldStudents: number
  newStudents: number
  oldFemale: number
  oldMale: number
  newFemale: number
  newMale: number
  monks: number
}

export interface AutoConfigResult {
  recommendedTemplate: HallTemplate | null
  layout: HallLayout
  capacity: number
  usageRate: number
  warnings: string[]
}

/**
 * 统计学员数据
 */
export function calculateStudentStatistics(students: Student[]): StudentStatistics {
  const stats: StudentStatistics = {
    total: students.length,
    female: 0,
    male: 0,
    oldStudents: 0,
    newStudents: 0,
    oldFemale: 0,
    oldMale: 0,
    newFemale: 0,
    newMale: 0,
    monks: 0,
  }

  students.forEach((student) => {
    // 统计性别
    if (student.gender === 'F') {
      stats.female++
    } else if (student.gender === 'M') {
      stats.male++
    }

    // 统计学员类型
    if (student.studentType === 'monk') {
      stats.monks++
    } else if (student.studentType === 'old_student') {
      stats.oldStudents++
      if (student.gender === 'F') stats.oldFemale++
      if (student.gender === 'M') stats.oldMale++
    } else {
      stats.newStudents++
      if (student.gender === 'F') stats.newFemale++
      if (student.gender === 'M') stats.newMale++
    }
  })

  return stats
}

/**
 * 推荐模板（基于学员数据）
 */
import type { HallTemplateKey } from '@/constants/hall-templates'

export function recommendTemplate(
  students: Student[],
  courseGenderType?: string
): HallTemplateKey | null {
  const stats = calculateStudentStatistics(students)
  
  // 如果课程类型是双性，推荐双性课程模板
  if (courseGenderType === 'co-ed' || courseGenderType === 'CO_ED') {
    // 验证双性课程必须同时有男女众
    if (stats.female > 0 && stats.male > 0) {
      return 'co-ed'
    }
  }

  // 单性课程：只要有学员就推荐单性模板
  if (stats.total > 0) {
    // 如果只有一种性别，推荐单性模板
    if ((stats.female > 0 && stats.male === 0) || (stats.male > 0 && stats.female === 0)) {
      return 'single-gender'
    }
  }

  // 如果有两种性别，默认推荐双性课程模板
  if (stats.female > 0 && stats.male > 0) {
    return 'co-ed'
  }

  // 没有学员数据时返回null
  return null
}

/**
 * 计算推荐的行列数
 */
export function calculateRecommendedDimensions(
  totalStudents: number,
  templateType: '单性课程' | '双性课程'
): { rows: number; cols: number } {
  // 考虑15%冗余空间
  const targetCapacity = Math.ceil(totalStudents * 1.15)

  // 单性课程：不超过100人
  // 双性课程：不超过150人
  const maxCapacity = templateType === '双性课程' ? 150 : 100
  const actualCapacity = Math.min(targetCapacity, maxCapacity)

  // 根据容量计算行列数
  // 单性课程：通常列数6-10，行数10-20
  // 双性课程：通常列数10-12，行数12-20
  if (templateType === '双性课程') {
    // 双性课程：优先使用10列
    const cols = 10
    const rows = Math.ceil(actualCapacity / cols)
    return { rows: Math.max(12, Math.min(rows, 20)), cols }
  } else {
    // 单性课程：优先使用8列
    const cols = 8
    const rows = Math.ceil(actualCapacity / cols)
    return { rows: Math.max(10, Math.min(rows, 20)), cols }
  }
}

/**
 * 计算双性课程每个区域的独立行列数
 */
export function calculateDualGenderDimensions(
  femaleCount: number,
  maleCount: number
): {
  femaleRows: number
  femaleCols: number
  maleRows: number
  maleCols: number
} {
  // 为每个性别添加15%冗余
  const femaleCapacity = Math.ceil(femaleCount * 1.15)
  const maleCapacity = Math.ceil(maleCount * 1.15)

  // 优先使用6列（单性区域通常不需要太宽）
  const preferredCols = 6

  // 计算每个区域的行数
  const femaleRows = Math.max(4, Math.min(Math.ceil(femaleCapacity / preferredCols), 12))
  const femaleCols = Math.max(4, Math.min(Math.ceil(femaleCapacity / femaleRows), 8))

  const maleRows = Math.max(4, Math.min(Math.ceil(maleCapacity / preferredCols), 12))
  const maleCols = Math.max(4, Math.min(Math.ceil(maleCapacity / maleRows), 8))

  return {
    femaleRows,
    femaleCols,
    maleRows,
    maleCols,
  }
}

/**
 * 生成自动配置
 */
export function generateAutoConfig(
  template: HallTemplate,
  stats: StudentStatistics,
  customRows?: number,
  customCols?: number
): AutoConfigResult {
  const warnings: string[] = []

  // 生成布局
  const layout: HallLayout = {
    originRow: 0,
    originCol: 0,
    totalRows: 0,
    totalCols: 0,
    sections: [],
  }

  if (template.templateType === '双性课程') {
    // 混合园区：为男女众分别计算独立的行列数
    const totalGender = stats.female + stats.male
    if (totalGender === 0) {
      warnings.push('没有学员数据，无法分配区域')
      return {
        recommendedTemplate: template,
        layout: { ...layout, totalRows: 10, totalCols: 10 },
        capacity: 0,
        usageRate: 0,
        warnings,
      }
    }

    // 计算每个区域的独立行列数
    const dimensions = calculateDualGenderDimensions(stats.female, stats.male)

    // 如果用户自定义了尺寸，则按比例分配
    let femaleRows = dimensions.femaleRows
    let femaleCols = dimensions.femaleCols
    let maleRows = dimensions.maleRows
    let maleCols = dimensions.maleCols

    if (customRows && customCols) {
      // 用户自定义时，保持列数独立，行数使用相同值
      femaleRows = customRows
      maleRows = customRows
      // 列数按比例分配
      const totalCols = customCols
      femaleCols = Math.max(4, Math.ceil((stats.female / totalGender) * totalCols))
      maleCols = Math.max(4, totalCols - femaleCols)
    }

    // 使用较大的行数作为整体行数（两个区域并排，行数对齐）
    const maxRows = Math.max(femaleRows, maleRows)

    // 女众区（左侧，B区）
    layout.sections!.push({
      name: 'B区-女众',
      purpose: 'MIXED',
      rowStart: 0,
      rowEnd: maxRows,
      colStart: 0,
      colEnd: femaleCols,
    })

    // 男众区（右侧，A区）
    layout.sections!.push({
      name: 'A区-男众',
      purpose: 'MIXED',
      rowStart: 0,
      rowEnd: maxRows,
      colStart: femaleCols,
      colEnd: femaleCols + maleCols,
    })

    // 设置总行列数
    layout.totalRows = maxRows
    layout.totalCols = femaleCols + maleCols

    // 计算容量和使用率
    const femaleCapacity = maxRows * femaleCols
    const maleCapacity = maxRows * maleCols
    const totalCapacity = femaleCapacity + maleCapacity
    const usageRate = stats.total / totalCapacity

    // 验证区域容量
    if (femaleCapacity < stats.female) {
      warnings.push(`女众区容量不足：${femaleCapacity}座 < ${stats.female}人`)
    }
    if (maleCapacity < stats.male) {
      warnings.push(`男众区容量不足：${maleCapacity}座 < ${stats.male}人`)
    }

    if (usageRate > 0.95) {
      warnings.push(`容量紧张：使用率${Math.round(usageRate * 100)}%，建议增加行数`)
    }

    return {
      recommendedTemplate: template,
      layout,
      capacity: totalCapacity,
      usageRate,
      warnings,
    }
  } else {
    // 单性模板：计算推荐行列数
    const recommended = calculateRecommendedDimensions(stats.total, template.templateType)
    const rows = customRows || recommended.rows
    const cols = customCols || recommended.cols
    const capacity = rows * cols

    // 计算使用率
    const usageRate = stats.total / capacity

    // 容量验证
    if (capacity < stats.total) {
      warnings.push(`容量不足：当前容量${capacity}座，但已有${stats.total}人报名`)
    } else if (usageRate > 0.95) {
      warnings.push(`容量紧张：使用率${Math.round(usageRate * 100)}%，建议增加1-2行`)
    }

    layout.totalRows = rows
    layout.totalCols = cols

    // 单性模板：计算旧生/新生比例
    const oldStudentRows =
      stats.oldStudents > 0
        ? Math.max(2, Math.min(3, Math.ceil((stats.oldStudents / stats.total) * rows * 0.3)))
        : 0

    if (oldStudentRows > 0) {
      layout.sections!.push({
        name: '旧生区',
        purpose: 'OLD_STUDENT',
        rowStart: 0,
        rowEnd: oldStudentRows,
        colStart: 0,
        colEnd: cols,
      })
    }

    layout.sections!.push({
      name: '新生区',
      purpose: 'NEW_STUDENT',
      rowStart: oldStudentRows,
      rowEnd: rows,
      colStart: 0,
      colEnd: cols,
    })

    // 验证区域容量
    const oldCapacity = oldStudentRows * cols
    const newCapacity = (rows - oldStudentRows) * cols
    if (oldCapacity < stats.oldStudents) {
      warnings.push(`旧生区容量不足：${oldCapacity}座 < ${stats.oldStudents}人`)
    }
    if (newCapacity < stats.newStudents) {
      warnings.push(`新生区容量不足：${newCapacity}座 < ${stats.newStudents}人`)
    }

    return {
      recommendedTemplate: template,
      layout,
      capacity,
      usageRate,
      warnings,
    }
  }
}

