'use client'

import { useMemo, useState, useCallback } from 'react'
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Statistic,
  Row,
  Col,
  InputNumber,
  Spin,
  message,
} from 'antd'
import { ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { Student, HallLayout } from '@/types/domain'
import { TemplateSelector } from './TemplateSelector'
import { HallPreviewGrid } from './HallPreviewGrid'
import {
  calculateStudentStatistics,
  recommendTemplate,
  generateAutoConfig,
} from '@/utils/hall-auto-config'
import { compileLayoutLocally } from '@/utils/hall-layout-compiler'
import { HALL_TEMPLATES } from '@/constants/hall-templates'

interface Props {
  students: Student[]
  courseGenderType?: string
  onConfigGenerated: (layout: HallLayout) => void
  loading?: boolean
}

export function AutoConfigWizard({
  students,
  courseGenderType,
  onConfigGenerated,
  loading = false,
}: Props) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [customRows, setCustomRows] = useState<number | null>(null)
  const [customCols, setCustomCols] = useState<number | null>(null)

  // 计算学员统计
  const stats = useMemo(() => {
    return calculateStudentStatistics(students)
  }, [students])

  // 推荐模板
  const recommendedTemplate = useMemo(() => {
    return recommendTemplate(stats, courseGenderType)
  }, [stats, courseGenderType])

  // 计算实际使用的模板ID（优先使用手动选择的，否则使用推荐的）
  const actualTemplateId = useMemo(() => {
    return selectedTemplateId || recommendedTemplate?.id || null
  }, [selectedTemplateId, recommendedTemplate?.id])

  // 计算自动配置（直接使用 useMemo，不通过 state）
  const autoConfig = useMemo(() => {
    if (!actualTemplateId) return null

    const template = HALL_TEMPLATES.find(t => t.id === actualTemplateId)
    if (!template) return null

    return generateAutoConfig(template, stats, customRows || undefined, customCols || undefined)
  }, [actualTemplateId, stats, customRows, customCols])

  // 计算预览布局
  const previewLayout = useMemo(() => {
    if (!autoConfig?.layout) return null
    
    try {
      return compileLayoutLocally(autoConfig.layout)
    } catch (err) {
      console.error('预览编译失败:', err)
      return null
    }
  }, [autoConfig])

  const handleTemplateSelect = useCallback((layout: HallLayout) => {
    // 根据layout的特征找到对应的模板
    const sections = layout.sections || []
    
    if (sections.length === 2 && sections.every(s => s.purpose === 'MIXED')) {
      setSelectedTemplateId('mixed-region')
    } else if (sections.some(s => s.purpose === 'OLD_STUDENT' || s.purpose === 'NEW_STUDENT')) {
      // 根据当前推荐模板判断是A区还是B区
      if (recommendedTemplate) {
        setSelectedTemplateId(recommendedTemplate.id)
      }
    }
    
    setCustomRows(layout.totalRows || null)
    setCustomCols(layout.totalCols || null)
  }, [recommendedTemplate])

  const handleApply = useCallback(() => {
    if (!autoConfig || !autoConfig.layout) {
      message.error('请先选择模板')
      return
    }

    // 验证配置
    if (autoConfig.warnings.some((w) => w.includes('容量不足'))) {
      message.warning('配置存在容量不足问题，请调整后再保存')
      return
    }

    onConfigGenerated(autoConfig.layout)
    message.success('配置已生成')
  }, [autoConfig, onConfigGenerated])

  if (loading) {
    return (
      <Card>
        <Spin tip="正在分析学员数据..." />
      </Card>
    )
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      {/* 学员统计卡片 */}
      <Card title="学员数据统计" size="small">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总人数" value={stats.total} />
          </Col>
          <Col span={6}>
            <Statistic title="女众" value={stats.female} />
          </Col>
          <Col span={6}>
            <Statistic title="男众" value={stats.male} />
          </Col>
          <Col span={6}>
            <Statistic title="旧生" value={stats.oldStudents} />
          </Col>
        </Row>
      </Card>

      {/* 模板选择 */}
      <Card
        title="选择禅堂模板"
        extra={
          recommendedTemplate && (
            <Typography.Text type="success">
              <CheckCircleOutlined /> 系统推荐：{recommendedTemplate.name}
            </Typography.Text>
          )
        }
      >
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          recommendedTemplateId={recommendedTemplate?.id}
        />
      </Card>

      {/* 自动生成的配置 */}
      {autoConfig && (
        <>
          {/* 配置预览和调整 */}
          <Card
            title="配置预览"
            extra={
              <Space>
                <Typography.Text type="secondary">调整行列数：</Typography.Text>
                <Space>
                  <InputNumber
                    min={8}
                    max={30}
                    value={customRows || autoConfig.layout.totalRows}
                    onChange={(v) => setCustomRows(v || null)}
                    addonBefore="行"
                    className="w-24"
                  />
                  <InputNumber
                    min={4}
                    max={20}
                    value={customCols || autoConfig.layout.totalCols}
                    onChange={(v) => setCustomCols(v || null)}
                    addonBefore="列"
                    className="w-24"
                  />
                </Space>
              </Space>
            }
          >
            <Space direction="vertical" size="middle" className="w-full">
              {/* 容量统计 */}
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="总容量"
                    value={autoConfig.capacity}
                    suffix="座"
                    valueStyle={{
                      color: autoConfig.usageRate > 0.95 ? '#cf1322' : autoConfig.usageRate > 0.85 ? '#d48806' : undefined,
                    }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic title="已报名" value={stats.total} suffix="人" />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="使用率"
                    value={Math.round(autoConfig.usageRate * 100)}
                    suffix="%"
                    valueStyle={{
                      color: autoConfig.usageRate > 0.95 ? '#cf1322' : autoConfig.usageRate > 0.85 ? '#d48806' : '#3f8600',
                    }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="冗余空间"
                    value={autoConfig.capacity - stats.total}
                    suffix="座"
                  />
                </Col>
              </Row>

              {/* 警告提示 */}
              {autoConfig.warnings.length > 0 && (
                <Alert
                  type={autoConfig.warnings.some((w) => w.includes('容量不足')) ? 'error' : 'warning'}
                  message="配置提示"
                  description={
                    <ul className="m-0 pl-5">
                      {autoConfig.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  }
                  showIcon
                />
              )}

              {/* 布局预览 */}
              {previewLayout && (
                <div>
                  <Typography.Title level={5}>布局预览</Typography.Title>
                  <HallPreviewGrid layout={previewLayout} loading={false} />
                </div>
              )}

              {/* 应用按钮 */}
              <div className="text-right">
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={handleApply}
                  disabled={autoConfig.warnings.some((w) => w.includes('容量不足'))}
                >
                  应用此配置
                </Button>
              </div>
            </Space>
          </Card>
        </>
      )}
    </Space>
  )
}

