/**
 * 禅堂布局模板库
 * 符合第一性原理：降低启动成本，提供参考配置
 *
 * 设计原则：
 * - 容量设计考虑 10-15% 冗余空间
 * - 单性课程：50-100 人
 * - 双性课程：80-120 人
 * - 不包含法师区（可后续手动添加）
 */

import type { HallLayout } from '@/types/domain'

export interface HallTemplate {
  id: string
  name: string
  description: string
  capacity: number
  targetStudents: string
  layout: Omit<HallLayout, 'originRow' | 'originCol'>
}

export const HALL_TEMPLATES: HallTemplate[] = [
  {
    id: 'small-single-mixed',
    name: '小型单性禅堂（混合）',
    description: '10行×6列，旧生新生混合，适合 50 人左右',
    capacity: 60,
    targetStudents: '40-50人',
    layout: {
      totalRows: 10,
      totalCols: 6,
      sections: [
        {
          name: '主区',
          purpose: 'MIXED',
          rowStart: 0,
          rowEnd: 10,
          colStart: 0,
          colEnd: 6,
        },
      ],
    },
  },
  {
    id: 'small-single-split',
    name: '小型单性禅堂（分区）',
    description: '10行×6列，前旧生后新生，适合 50 人左右',
    capacity: 60,
    targetStudents: '40-50人',
    layout: {
      totalRows: 10,
      totalCols: 6,
      sections: [
        {
          name: '旧生区',
          purpose: 'OLD_STUDENT',
          rowStart: 0,
          rowEnd: 5,
          colStart: 0,
          colEnd: 6,
        },
        {
          name: '新生区',
          purpose: 'NEW_STUDENT',
          rowStart: 5,
          rowEnd: 10,
          colStart: 0,
          colEnd: 6,
        },
      ],
    },
  },
  {
    id: 'medium-single',
    name: '中型单性禅堂',
    description: '12行×8列，前旧生后新生，适合 80 人左右',
    capacity: 96,
    targetStudents: '70-85人',
    layout: {
      totalRows: 12,
      totalCols: 8,
      sections: [
        {
          name: '旧生区',
          purpose: 'OLD_STUDENT',
          rowStart: 0,
          rowEnd: 6,
          colStart: 0,
          colEnd: 8,
        },
        {
          name: '新生区',
          purpose: 'NEW_STUDENT',
          rowStart: 6,
          rowEnd: 12,
          colStart: 0,
          colEnd: 8,
        },
      ],
    },
  },
  {
    id: 'large-single',
    name: '大型单性禅堂',
    description: '15行×8列，前旧生后新生，适合 100 人左右',
    capacity: 120,
    targetStudents: '90-105人',
    layout: {
      totalRows: 15,
      totalCols: 8,
      sections: [
        {
          name: '旧生区',
          purpose: 'OLD_STUDENT',
          rowStart: 0,
          rowEnd: 7,
          colStart: 0,
          colEnd: 8,
        },
        {
          name: '新生区',
          purpose: 'NEW_STUDENT',
          rowStart: 7,
          rowEnd: 15,
          colStart: 0,
          colEnd: 8,
        },
      ],
    },
  },
  {
    id: 'medium-dual',
    name: '中型双性禅堂',
    description: '12行×10列，左右分性别，适合 100 人左右',
    capacity: 120,
    targetStudents: '85-105人',
    layout: {
      totalRows: 12,
      totalCols: 10,
      sections: [
        {
          name: '女众区',
          purpose: 'MIXED',
          rowStart: 0,
          rowEnd: 12,
          colStart: 0,
          colEnd: 5,
        },
        {
          name: '男众区',
          purpose: 'MIXED',
          rowStart: 0,
          rowEnd: 12,
          colStart: 5,
          colEnd: 10,
        },
      ],
    },
  },
  {
    id: 'large-dual',
    name: '大型双性禅堂',
    description: '15行×10列，左右分性别，适合 120-140 人',
    capacity: 150,
    targetStudents: '110-135人',
    layout: {
      totalRows: 15,
      totalCols: 10,
      sections: [
        {
          name: '女众区',
          purpose: 'MIXED',
          rowStart: 0,
          rowEnd: 15,
          colStart: 0,
          colEnd: 5,
        },
        {
          name: '男众区',
          purpose: 'MIXED',
          rowStart: 0,
          rowEnd: 15,
          colStart: 5,
          colEnd: 10,
        },
      ],
    },
  },
]
