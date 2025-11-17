'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Statistic, Typography } from 'antd'
import { ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import type { HallLayout } from '@/types/domain'
import { calculateSectionCapacity, findOverlappingSections } from '@/utils/hall-layout'
import { TemplateSelector } from './TemplateSelector'

interface SectionFormValue {
  name: string
  purpose: string
  rowStart: number
  rowEnd: number
  colStart: number
  colEnd: number
}

interface LayoutFormValue {
  totalRows?: number
  totalCols?: number
  sections?: SectionFormValue[]
}

interface Props {
  layout?: HallLayout
  loading?: boolean
  onSubmit: (layout: HallLayout) => Promise<void>
  onValuesChange?: () => void
  onPreviewUpdate?: (layout: HallLayout) => void
  studentCount?: number
}

const purposeOptions = [
  { label: '法师', value: 'MONK' },
  { label: '旧生', value: 'OLD_STUDENT' },
  { label: '新生', value: 'NEW_STUDENT' },
  { label: '法工', value: 'WORKER' },
  { label: '预留', value: 'RESERVED' },
  { label: '混合', value: 'MIXED' },
]

export function HallLayoutEditor({ layout, loading, onSubmit, onValuesChange, onPreviewUpdate, studentCount = 0 }: Props) {
  const [form] = Form.useForm<LayoutFormValue>()
  const [modal, contextHolder] = Modal.useModal()

  // 处理表单值变化，触发实时预览
  const handleValuesChange = useCallback(() => {
    if (!onValuesChange) return
    onValuesChange()
  }, [onValuesChange])

  useEffect(() => {
    if (!layout) {
      form.resetFields()
      return
    }
    form.setFieldsValue({
      totalRows: layout.totalRows,
      totalCols: layout.totalCols,
      sections: (layout.sections ?? []).map((section) => ({
        ...section,
      })),
    })
  }, [layout, form])

  // 实时计算当前配置的总容量
  const currentCapacity = useMemo(() => {
    const values = form.getFieldsValue()
    if (!values.sections || values.sections.length === 0) {
      return 0
    }
    return values.sections.reduce((total, section) => {
      if (!section) return total
      const capacity = calculateSectionCapacity(section)
      return total + capacity
    }, 0)
  }, [form])

  // 计算容量状态
  const capacityStatus = useMemo(() => {
    if (currentCapacity === 0) return 'normal'
    const ratio = studentCount / currentCapacity
    if (ratio > 0.95) return 'danger' // 超过95%
    if (ratio > 0.85) return 'warning' // 超过85%
    return 'normal'
  }, [currentCapacity, studentCount])

  const handleFinish = async (values: LayoutFormValue) => {
    if (!layout) return
    const nextLayout: HallLayout = {
      ...layout,
      totalRows: values.totalRows,
      totalCols: values.totalCols,
      sections: values.sections,
    }
    await onSubmit(nextLayout)
  }

  const handleTemplateSelect = useCallback(
    (templateLayout: HallLayout) => {
      const currentValues = form.getFieldsValue()
      const hasChanges =
        currentValues.sections && currentValues.sections.length > 0

      const applyTemplate = () => {
        form.setFieldsValue({
          totalRows: templateLayout.totalRows,
          totalCols: templateLayout.totalCols,
          sections: templateLayout.sections,
        })

        // 立即触发预览更新
        if (onPreviewUpdate) {
          onPreviewUpdate(templateLayout)
        }

        // 同时触发 onValuesChange
        if (onValuesChange) {
          onValuesChange()
        }
      }

      if (hasChanges) {
        modal.confirm({
          title: '确认应用模板',
          icon: <ExclamationCircleOutlined />,
          content: '应用模板将覆盖当前配置，是否继续？',
          okText: '继续',
          cancelText: '取消',
          onOk: applyTemplate,
        })
      } else {
        applyTemplate()
      }
    },
    [form, onValuesChange, onPreviewUpdate, modal]
  )

  return (
    <>
      {contextHolder}
      <Card
        title="禅堂布局"
        extra={
          <Space>
            <TemplateSelector onSelectTemplate={handleTemplateSelect} />
            <Typography.Text type="secondary">编辑区域行列、用途</Typography.Text>
          </Space>
        }
      >
        {/* 配置提示 */}
      <Alert
        type="info"
        icon={<InfoCircleOutlined />}
        message="配置说明"
        description={
          <div>
            <p>• 坐标从 0 开始，结束值<strong>不包含</strong>（例如：行 0-10 表示第 0-9 行，共 10 行）</p>
            <p>• 区域不能重叠，建议保持 10-15% 冗余空间</p>
            <p>• 配置后点击&ldquo;预览布局&rdquo;可查看效果</p>
          </div>
        }
        style={{ marginBottom: 16 }}
      />

      {/* 容量统计 */}
      <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
        <Space size="large">
          <Statistic
            title="当前容量"
            value={currentCapacity}
            suffix="座"
            valueStyle={{ color: capacityStatus === 'danger' ? '#cf1322' : capacityStatus === 'warning' ? '#d48806' : undefined }}
          />
          <Statistic
            title="已报名"
            value={studentCount}
            suffix="人"
          />
          <Statistic
            title="使用率"
            value={currentCapacity > 0 ? Math.round((studentCount / currentCapacity) * 100) : 0}
            suffix="%"
            valueStyle={{ color: capacityStatus === 'danger' ? '#cf1322' : capacityStatus === 'warning' ? '#d48806' : '#3f8600' }}
          />
        </Space>
      </Card>

      <Form layout="vertical" form={form} onFinish={handleFinish} onValuesChange={handleValuesChange} disabled={loading}>
        <Space size="large">
          <Form.Item label="总行数" name="totalRows" style={{ width: 140 }}>
            <InputNumber min={1} max={200} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="总列数" name="totalCols" style={{ width: 140 }}>
            <InputNumber min={1} max={200} style={{ width: '100%' }} />
          </Form.Item>
        </Space>

        <Typography.Title level={5} style={{ marginTop: 16 }}>
          功能分区
        </Typography.Title>

        <Form.List name="sections">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {fields.map((field) => {
                const section = form.getFieldValue(['sections', field.name])
                const sectionCapacity = section ? calculateSectionCapacity(section) : 0

                return (
                  <Card
                    key={field.key}
                    size="small"
                    title={
                      <Space>
                        <span>区域 {field.name + 1}</span>
                        {sectionCapacity > 0 && (
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            ({sectionCapacity} 座)
                          </Typography.Text>
                        )}
                      </Space>
                    }
                    extra={<Button type="link" danger onClick={() => remove(field.name)}>删除</Button>}
                  >
                  <Space size="large" wrap>
                    <Form.Item label="名称" name={[field.name, 'name']} rules={[{ required: true, message: '请输入名称' }]}>
                      <Input placeholder="如 A区" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item label="用途" name={[field.name, 'purpose']} rules={[{ required: true }]}> 
                      <Select style={{ width: 160 }} options={purposeOptions} />
                    </Form.Item>
                  </Space>
                  <Space size="large" wrap>
                    <Form.Item
                      label="起始行"
                      name={[field.name, 'rowStart']}
                      rules={[
                        { required: true, message: '请输入起始行' },
                        { type: 'number', min: 0, message: '不能小于0' },
                      ]}
                    >
                      <InputNumber min={0} style={{ width: 120 }} placeholder="0" />
                    </Form.Item>
                    <Form.Item
                      label="结束行"
                      name={[field.name, 'rowEnd']}
                      rules={[
                        { required: true, message: '请输入结束行' },
                        { type: 'number', min: 0, message: '不能小于0' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const totalRows = getFieldValue('totalRows')
                            const rowStart = getFieldValue(['sections', field.name, 'rowStart'])

                            if (!value && value !== 0) {
                              return Promise.resolve()
                            }

                            if (totalRows && value > totalRows) {
                              return Promise.reject(new Error(`不能超过总行数 ${totalRows}`))
                            }

                            if (rowStart !== undefined && value <= rowStart) {
                              return Promise.reject(new Error('必须大于起始行'))
                            }

                            return Promise.resolve()
                          },
                        }),
                      ]}
                      dependencies={['totalRows', [field.name, 'rowStart']]}
                    >
                      <InputNumber min={0} style={{ width: 120 }} placeholder="10" />
                    </Form.Item>
                    <Form.Item
                      label="起始列"
                      name={[field.name, 'colStart']}
                      rules={[
                        { required: true, message: '请输入起始列' },
                        { type: 'number', min: 0, message: '不能小于0' },
                      ]}
                    >
                      <InputNumber min={0} style={{ width: 120 }} placeholder="0" />
                    </Form.Item>
                    <Form.Item
                      label="结束列"
                      name={[field.name, 'colEnd']}
                      rules={[
                        { required: true, message: '请输入结束列' },
                        { type: 'number', min: 0, message: '不能小于0' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const totalCols = getFieldValue('totalCols')
                            const colStart = getFieldValue(['sections', field.name, 'colStart'])

                            if (!value && value !== 0) {
                              return Promise.resolve()
                            }

                            if (totalCols && value > totalCols) {
                              return Promise.reject(new Error(`不能超过总列数 ${totalCols}`))
                            }

                            if (colStart !== undefined && value <= colStart) {
                              return Promise.reject(new Error('必须大于起始列'))
                            }

                            // 检查与其他分区是否重叠
                            const currentSection = {
                              name: getFieldValue(['sections', field.name, 'name']) || `区域${field.name + 1}`,
                              purpose: getFieldValue(['sections', field.name, 'purpose']),
                              rowStart: getFieldValue(['sections', field.name, 'rowStart']),
                              rowEnd: getFieldValue(['sections', field.name, 'rowEnd']),
                              colStart: getFieldValue(['sections', field.name, 'colStart']),
                              colEnd: value,
                            }

                            const allSections = getFieldValue('sections') || []
                            const overlapping = findOverlappingSections(currentSection, allSections, field.name)

                            if (overlapping.length > 0) {
                              const names = overlapping.map(s => s.name || '未命名').join('、')
                              return Promise.reject(new Error(`与 ${names} 重叠`))
                            }

                            return Promise.resolve()
                          },
                        }),
                      ]}
                      dependencies={['totalCols', [field.name, 'colStart'], [field.name, 'rowStart'], [field.name, 'rowEnd'], 'sections']}
                    >
                      <InputNumber min={0} style={{ width: 120 }} placeholder="15" />
                    </Form.Item>
                  </Space>
                </Card>
                )
              })}
              <Button type="dashed" onClick={() => add({ name: `区域${fields.length + 1}`, purpose: 'MIXED', rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 0 })}>
                添加分区
              </Button>
            </Space>
          )}
        </Form.List>

        <div style={{ marginTop: 24 }}>
          {currentCapacity > 0 && studentCount > currentCapacity && (
            <Alert
              type="warning"
              message="容量不足"
              description={`当前容量 ${currentCapacity} 座，但已有 ${studentCount} 人报名，请增加分区或扩大现有分区`}
              style={{ marginBottom: 16 }}
              showIcon
            />
          )}
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存布局
            </Button>
          </div>
        </div>
      </Form>
    </Card>
    </>
  )
}
