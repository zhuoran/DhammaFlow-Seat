'use client'

import { useMemo } from 'react'
import { Card, Col, Row, Space, Tag, Typography } from 'antd'
import { CheckCircleOutlined, StarOutlined } from '@ant-design/icons'
import { HALL_TEMPLATES, type HallTemplateKey } from '@/constants/hall-templates'
import { recommendTemplate } from '@/utils/hall-auto-config'
import type { Student } from '@/types/domain'

interface Props {
  students: Student[]
  courseGenderType?: string
  onSelect: (templateKey: HallTemplateKey) => void
  selectedTemplate: HallTemplateKey | null
  mode?: 'inline' | 'modal'
}

export function TemplateSelector({
  students,
  courseGenderType,
  onSelect,
  selectedTemplate,
  mode = 'inline',
}: Props) {
  // 自动推荐模板
  const recommendedTemplate = useMemo(() => {
    return recommendTemplate(students, courseGenderType || 'co-ed')
  }, [students, courseGenderType])

  // 内联模式：直接显示3个模板卡片
  if (mode === 'inline') {
    return (
      <div>
        {recommendedTemplate && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Space>
              <StarOutlined className="text-blue-500" />
              <Typography.Text>
                系统推荐：<Typography.Text strong>{HALL_TEMPLATES.find(t => t.id === recommendedTemplate)?.name}</Typography.Text>
                （{students.filter(s => s.gender === 'M').length}位男众，{students.filter(s => s.gender === 'F').length}位女众）
              </Typography.Text>
            </Space>
          </div>
        )}

        <Row gutter={[16, 16]}>
          {HALL_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate === template.id
            const isRecommended = recommendedTemplate === template.id

            return (
              <Col key={template.id} xs={24} sm={24} md={8}>
                <Card
                  hoverable
                  onClick={() => onSelect(template.id as HallTemplateKey)}
                  style={{
                    borderColor: isSelected
                      ? '#1890ff'
                      : isRecommended
                        ? '#52c41a'
                        : '#d9d9d9',
                    borderWidth: isSelected || isRecommended ? 2 : 1,
                  }}
                  styles={{ body: { padding: 16 } }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Typography.Text strong>{template.name}</Typography.Text>
                        {isRecommended && (
                          <Tag color="green" icon={<StarOutlined />}>
                            推荐
                          </Tag>
                        )}
                      </Space>
                      {isSelected && <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 18 }} />}
                    </div>

                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {template.description}
                    </Typography.Text>

                    <Space wrap>
                      <Tag color="blue">
                        默认 {template.layout.totalRows}行 × {template.layout.totalCols}列
                      </Tag>
                      <Tag color="purple">
                        {template.templateType}
                      </Tag>
                    </Space>

                    <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                      {template.description}
                    </div>
                  </Space>
                </Card>
              </Col>
            )
          })}
        </Row>
      </div>
    )
  }

  // Modal模式（暂时不实现，因为用户要求取消弹窗）
  return null
}
