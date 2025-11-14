'use client'

import { useEffect } from 'react'
import { Button, Card, Form, Input, InputNumber, Select, Space, Typography } from 'antd'
import type { HallLayout } from '@/types/domain'

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
}

const purposeOptions = [
  { label: '法师', value: 'MONK' },
  { label: '旧生', value: 'OLD_STUDENT' },
  { label: '新生', value: 'NEW_STUDENT' },
  { label: '法工', value: 'WORKER' },
  { label: '预留', value: 'RESERVED' },
  { label: '混合', value: 'MIXED' },
]

export function HallLayoutEditor({ layout, loading, onSubmit }: Props) {
  const [form] = Form.useForm<LayoutFormValue>()

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

  return (
    <Card title="禅堂布局" extra={<Typography.Text type="secondary">编辑区域行列、用途</Typography.Text>}>
      <Form layout="vertical" form={form} onFinish={handleFinish} disabled={loading}>
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
              {fields.map((field) => (
                <Card key={field.key} size="small" title={`区域 ${field.name + 1}`} extra={<Button type="link" danger onClick={() => remove(field.name)}>删除</Button>}>
                  <Space size="large" wrap>
                    <Form.Item label="名称" name={[field.name, 'name']} rules={[{ required: true, message: '请输入名称' }]}>
                      <Input placeholder="如 A区" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item label="用途" name={[field.name, 'purpose']} rules={[{ required: true }]}> 
                      <Select style={{ width: 160 }} options={purposeOptions} />
                    </Form.Item>
                  </Space>
                  <Space size="large" wrap>
                    <Form.Item label="起始行" name={[field.name, 'rowStart']} rules={[{ required: true }]}> 
                      <InputNumber min={0} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item label="结束行" name={[field.name, 'rowEnd']} rules={[{ required: true }]}> 
                      <InputNumber min={0} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item label="起始列" name={[field.name, 'colStart']} rules={[{ required: true }]}> 
                      <InputNumber min={0} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item label="结束列" name={[field.name, 'colEnd']} rules={[{ required: true }]}> 
                      <InputNumber min={0} style={{ width: 120 }} />
                    </Form.Item>
                  </Space>
                </Card>
              ))}
              <Button type="dashed" onClick={() => add({ name: `区域${fields.length + 1}`, purpose: 'MIXED', rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 0 })}>
                添加分区
              </Button>
            </Space>
          )}
        </Form.List>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存布局
          </Button>
        </div>
      </Form>
    </Card>
  )
}
