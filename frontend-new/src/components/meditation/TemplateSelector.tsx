'use client'

import { useState } from 'react'
import { Button, Card, Col, Divider, Modal, Row, Space, Tag, Typography } from 'antd'
import { LayoutOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { HALL_TEMPLATES, type HallTemplate } from '@/constants/hall-templates'
import type { HallLayout } from '@/types/domain'

interface Props {
  onSelectTemplate: (layout: HallLayout) => void
}

export function TemplateSelector({ onSelectTemplate }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<HallTemplate | null>(null)

  const handleApply = () => {
    if (!selectedTemplate) return

    onSelectTemplate({
      originRow: 0,
      originCol: 0,
      ...selectedTemplate.layout,
    })

    setOpen(false)
    setSelectedTemplate(null)
  }

  return (
    <>
      <Button icon={<LayoutOutlined />} onClick={() => setOpen(true)}>
        选择模板
      </Button>

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false)
          setSelectedTemplate(null)
        }}
        onOk={handleApply}
        okText="应用模板"
        cancelText="取消"
        width={900}
        okButtonProps={{ disabled: !selectedTemplate }}
        title="选择禅堂布局模板"
      >
        <Typography.Paragraph type="secondary">
          选择一个预设模板快速开始配置，应用后可继续调整参数
        </Typography.Paragraph>

        <Divider />

        <Row gutter={[16, 16]}>
          {HALL_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate?.id === template.id

            return (
              <Col key={template.id} span={12}>
                <Card
                  hoverable
                  onClick={() => setSelectedTemplate(template)}
                  style={{
                    borderColor: isSelected ? '#1890ff' : undefined,
                    borderWidth: isSelected ? 2 : 1,
                  }}
                  styles={{ body: { padding: 16 } }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography.Text strong>{template.name}</Typography.Text>
                      {isSelected && <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 18 }} />}
                    </div>

                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {template.description}
                    </Typography.Text>

                    <Space wrap>
                      <Tag color="blue">
                        {template.layout.totalRows}行 × {template.layout.totalCols}列
                      </Tag>
                      <Tag color="green">容量 {template.capacity} 座</Tag>
                      <Tag color="orange">适合 {template.targetStudents}</Tag>
                    </Space>

                    <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                      分区：
                      {template.layout.sections?.map((section, idx) => (
                        <span key={idx}>
                          {idx > 0 && '、'}
                          {section.name}
                        </span>
                      ))}
                    </div>
                  </Space>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Modal>
    </>
  )
}
