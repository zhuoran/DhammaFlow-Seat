/**
 * 禅堂布局模板库 - 简化版（2个模板）
 * 
 * 根据实际禅修中心情况，只有2种模板：
 * 1. 单性课程模板 - 适用于男众或女众单独上课的场景
 * 2. 双性课程模板 - 适用于男女众混合上课的场景
 * 
 * 设计原则：
 * - 容量设计考虑 10-15% 冗余空间
 * - 单性课程：通常不超过100人
 * - 双性课程：通常不超过150人
 * - 行列数会根据实际学员数据自动计算，这里只是基础模板结构
 * - 模板不再针对单性课程区分男女，统一使用一个模板
 */

import type { HallLayout } from '@/types/domain'

export interface HallTemplate {
  id: string
  name: string
  description: string
  templateType: '单性课程' | '双性课程'
  genderType: 'SINGLE' | 'CO_ED'
  numberingType: 'sequential' | 'sequential_with_prefix'
  seatPrefix: string
  layout: Omit<HallLayout, 'originRow' | 'originCol'>
}

export type HallTemplateKey = 'single-gender' | 'co-ed'

export const HALL_TEMPLATES: HallTemplate[] = [
  {
    id: 'single-gender',
    name: '单性课程模板',
    description: '适用于男众或女众单独上课，禅堂中仅一种性别，通常不超过100人',
    templateType: '单性课程',
    genderType: 'SINGLE',
    numberingType: 'sequential',
    seatPrefix: '',
    layout: {
      totalRows: 12, // 默认值，会根据实际数据自动调整
      totalCols: 8,  // 默认值，会根据实际数据自动调整
      sections: [
        {
          name: '旧生区',
          purpose: 'OLD_STUDENT',
          rowStart: 0,
          rowEnd: 3, // 前2-3排，会根据旧生人数自动调整
          colStart: 0,
          colEnd: 8,
        },
        {
          name: '新生区',
          purpose: 'NEW_STUDENT',
          rowStart: 3, // 从第3排开始，会根据旧生区自动调整
          rowEnd: 12,
          colStart: 0,
          colEnd: 8,
        },
      ],
    },
  },
  {
    id: 'co-ed',
    name: '双性课程模板',
    description: '适用于男女众混合上课，禅堂包含男女两个独立区域，通常不超过150人',
    templateType: '双性课程',
    genderType: 'CO_ED',
    numberingType: 'sequential_with_prefix',
    seatPrefix: 'A', // A=男众，B=女众
    layout: {
      totalRows: 15, // 默认值，会根据实际数据自动调整
      totalCols: 10, // 默认值，会根据实际数据自动调整
      sections: [
        {
          name: 'B区-女众',
          purpose: 'MIXED',
          rowStart: 0,
          rowEnd: 15,
          colStart: 0,
          colEnd: 5, // 左侧，会根据男女比例自动调整
        },
        {
          name: 'A区-男众',
          purpose: 'MIXED',
          rowStart: 0,
          rowEnd: 15,
          colStart: 5, // 右侧，会根据男女比例自动调整
          colEnd: 10,
        },
      ],
    },
  },
]
