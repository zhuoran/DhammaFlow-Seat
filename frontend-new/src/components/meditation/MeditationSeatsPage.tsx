'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { Button, Card, Space, App, Row, Col, Divider, Statistic } from 'antd'
import { ThunderboltOutlined, CheckCircleOutlined, TeamOutlined, ManOutlined, WomanOutlined } from '@ant-design/icons'
import { PageHeader } from '@/components/common/PageHeader'
import { useAppContext } from '@/state/app-context'
import { meditationSeatApi } from '@/services/api'
import { useHallConfigs, useUpdateHallLayout, useStudents } from '@/hooks/queries'
import { sessionApi } from '@/services/api'
import type { HallLayout } from '@/types/domain'
import { TemplateSelector } from './TemplateSelector'
import { LayoutPreviewCanvas } from './LayoutPreviewCanvas'
import { calculateStudentStatistics, generateAutoConfig } from '@/utils/hall-auto-config'
import { HALL_TEMPLATES, type HallTemplateKey } from '@/constants/hall-templates'

export function MeditationSeatsPage() {
  const { message } = App.useApp()
  const { currentSession } = useAppContext()
  const hallConfigsQuery = useHallConfigs(currentSession?.id)
  const studentsQuery = useStudents(currentSession?.id)
  const updateLayout = useUpdateHallLayout(currentSession?.id)

  const [selectedTemplate, setSelectedTemplate] = useState<HallTemplateKey | null>(null)
  const [currentLayout, setCurrentLayout] = useState<HallLayout | null>(null)
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null)
  const [courseGenderType, setCourseGenderType] = useState<string | undefined>(undefined)
  const [totalRows, setTotalRows] = useState(10)
  const [totalCols, setTotalCols] = useState(8)
  
  // 混合园区的独立行列设置
  const [femaleRows, setFemaleRows] = useState(4)
  const [femaleCols, setFemaleCols] = useState(6)
  const [maleRows, setMaleRows] = useState(4)
  const [maleCols, setMaleCols] = useState(6)
  
  // 标记配置是否已加载
  const [configLoaded, setConfigLoaded] = useState(false)

  const configs = useMemo(() => hallConfigsQuery.data ?? [], [hallConfigsQuery.data])
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data])

  // 计算学员统计
  const statistics = useMemo(() => {
    return calculateStudentStatistics(students)
  }, [students])

  // 从session配置中读取课程性别类型
  useEffect(() => {
    const loadSessionConfig = async () => {
      if (!currentSession) return
      try {
        const config = await sessionApi.fetchSessionConfig(currentSession.id)
        if (config && typeof config.courseGenderType === 'string') {
          setCourseGenderType(config.courseGenderType)
        } else {
          // 如果没有配置，根据学员数据推断
          const hasFemale = students.some(s => s.gender === 'F')
          const hasMale = students.some(s => s.gender === 'M')
          setCourseGenderType(hasFemale && hasMale ? 'co-ed' : 'single')
        }
      } catch (err) {
        console.error('读取课程配置失败:', err)
        // 降级：根据学员数据推断
        const hasFemale = students.some(s => s.gender === 'F')
        const hasMale = students.some(s => s.gender === 'M')
        setCourseGenderType(hasFemale && hasMale ? 'co-ed' : 'single')
      }
    }
    loadSessionConfig()
  }, [currentSession, students])

  // 如果有已保存的配置，自动选择第一个
  const defaultConfig = useMemo(() => {
    if (configs.length > 0 && !selectedConfigId) {
      return configs[0]
    }
    return configs.find(c => c.id === selectedConfigId) || null
  }, [configs, selectedConfigId])

  // 从已保存的配置恢复UI状态（初次加载时）
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (configLoaded || !defaultConfig || !defaultConfig.layout) return
    
    const layout = defaultConfig.layout
    setCurrentLayout(layout)
    
    // 判断模板类型
    const isMixed = layout.sections && layout.sections.length === 2
    if (isMixed) {
      setSelectedTemplate('co-ed')
      
      // 恢复每个区域的行列数
      const femaleSection = layout.sections?.find(s => s.name.includes('女'))
      const maleSection = layout.sections?.find(s => s.name.includes('男'))
      
      if (femaleSection) {
        const rows = femaleSection.rowEnd - femaleSection.rowStart
        const cols = femaleSection.colEnd - femaleSection.colStart
        setFemaleRows(rows)
        setFemaleCols(cols)
      }
      
      if (maleSection) {
        const rows = maleSection.rowEnd - maleSection.rowStart
        const cols = maleSection.colEnd - maleSection.colStart
        setMaleRows(rows)
        setMaleCols(cols)
      }
    } else {
      // 单性课程模板
      setSelectedTemplate('single-gender')
      
      if (layout.totalRows && layout.totalCols) {
        setTotalRows(layout.totalRows)
        setTotalCols(layout.totalCols)
      }
    }
    
    setConfigLoaded(true)
  }, [configLoaded, defaultConfig])
  /* eslint-enable react-hooks/set-state-in-effect */

  // 处理模板选择
  const handleTemplateSelect = useCallback((templateKey: HallTemplateKey) => {
    setSelectedTemplate(templateKey)
    
    // 查找模板
    const template = HALL_TEMPLATES.find(t => t.id === templateKey)
    if (!template) return
    
    // 根据模板和学员数据自动生成配置
    const autoConfig = generateAutoConfig(template, statistics)
    
    setTotalRows(autoConfig.layout.totalRows)
    setTotalCols(autoConfig.layout.totalCols)
    setCurrentLayout(autoConfig.layout)
    
    // 如果是混合园区，初始化区域行列数
    if (templateKey === 'mixed-region') {
      const femaleSection = autoConfig.layout.sections?.find(s => s.name.includes('女'))
      const maleSection = autoConfig.layout.sections?.find(s => s.name.includes('男'))
      
      if (femaleSection) {
        setFemaleRows(femaleSection.rowEnd - femaleSection.rowStart)
        setFemaleCols(femaleSection.colEnd - femaleSection.colStart)
      }
      
      if (maleSection) {
        setMaleRows(maleSection.rowEnd - maleSection.rowStart)
        setMaleCols(maleSection.colEnd - maleSection.colStart)
      }
    }
  }, [statistics])

  // 处理行列调整后重新生成（单性园区）
  const handleDimensionChange = useCallback((rows: number, cols: number) => {
    setTotalRows(rows)
    setTotalCols(cols)
    
    if (!selectedTemplate) return
    
    // 查找模板
    const template = HALL_TEMPLATES.find(t => t.id === selectedTemplate)
    if (!template) return
    
    // 根据模板和学员数据重新生成配置，使用自定义行列数
    const autoConfig = generateAutoConfig(template, statistics, rows, cols)
    setCurrentLayout(autoConfig.layout)
  }, [selectedTemplate, statistics])
  
  // 处理混合园区区域调整后重新生成
  const handleMixedRegionRegenerate = useCallback(() => {
    if (!selectedTemplate || selectedTemplate !== 'co-ed') return
    
    // 手动构建混合园区布局
    // 使用较大的行数作为整体行数（保证视觉对齐）
    const maxRows = Math.max(femaleRows, maleRows)
    
    const layout: HallLayout = {
      originRow: 0,
      originCol: 0,
      totalRows: maxRows,
      totalCols: femaleCols + maleCols,
      sections: [
        {
          name: 'B区-女众',
          purpose: 'MIXED',
          rowStart: 0,
          rowEnd: femaleRows, // 使用女众区自己的行数
          colStart: 0,
          colEnd: femaleCols,
        },
        {
          name: 'A区-男众',
          purpose: 'MIXED',
          rowStart: 0,
          rowEnd: maleRows, // 使用男众区自己的行数
          colStart: femaleCols,
          colEnd: femaleCols + maleCols,
        },
      ],
    }
    
    setTotalRows(maxRows)
    setTotalCols(femaleCols + maleCols)
    setCurrentLayout(layout)
    
    message.success('布局已重新生成')
  }, [selectedTemplate, femaleRows, femaleCols, maleRows, maleCols, message])

  // 保存配置
  const handleSaveConfig = useCallback(async () => {
    if (!currentLayout) {
      message.warning('请先选择模板生成配置')
      return
    }

    if (!currentSession) {
      message.warning('请先选择会期')
      return
    }

    // 如果有已存在的配置，更新它；否则创建新配置
    if (defaultConfig) {
      try {
        await updateLayout.mutateAsync({ id: defaultConfig.id, layout: currentLayout })
        message.success('配置已保存')
        setSelectedConfigId(defaultConfig.id)
      } catch {
        message.error('保存配置失败')
      }
    } else {
      // TODO: 创建新配置的API调用
      message.info('创建新配置功能开发中')
    }
  }, [currentLayout, currentSession, defaultConfig, updateLayout, message])

  // 处理生成座位
  const handleGenerateSeats = useCallback(async () => {
    if (!currentLayout) {
      message.warning('请先配置禅堂布局')
      return
    }

    if (!currentSession) {
      message.warning('请先选择会期')
      return
    }

    // 先保存配置
    await handleSaveConfig()

    try {
      await meditationSeatApi.generateSeats(currentSession.id)
      message.success('座位生成成功，可前往座位管理页面查看')
    } catch {
      message.error('生成座位失败')
    }
  }, [currentLayout, currentSession, handleSaveConfig, message])

  // Early return 必须在所有 hooks 之后
  if (!currentSession) {
    return (
      <Card>
        <PageHeader title="禅堂座位配置" description="请选择会期" />
      </Card>
    )
  }

  const hasStudents = students.length > 0
  const totalCapacity = currentLayout?.sections?.reduce((sum, section) => {
    const rows = section.rowEnd - section.rowStart
    const cols = section.colEnd - section.colStart
    return sum + rows * cols
  }, 0) || 0

  return (
    <div>
      <PageHeader
        title="禅堂座位配置"
        description="为本次会期配置禅堂座位布局"
      />

      <Space direction="vertical" size="large" className="w-full mt-6">
        {/* 1. 学员统计 - 精简显示，辅助决策 */}
        {hasStudents && (
          <Card size="small" title="本期学员概况">
            <Row gutter={24}>
              <Col span={6}>
                <Statistic
                  title="总人数"
                  value={statistics.total}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="男众"
                  value={statistics.male}
                  prefix={<ManOutlined />}
                  valueStyle={{ color: '#4F6FAE' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="女众"
                  value={statistics.female}
                  prefix={<WomanOutlined />}
                  valueStyle={{ color: '#C7B2D6' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="课程类型"
                  value={statistics.male > 0 && statistics.female > 0 ? '双性课程' : '单性课程'}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* 2. 选择模板 - 直接展示3个卡片 */}
        <Card title="选择禅堂模板" extra={selectedTemplate && <CheckCircleOutlined style={{ color: '#52c41a' }} />}>
          <TemplateSelector
            students={students}
            courseGenderType={courseGenderType}
            onSelect={handleTemplateSelect}
            selectedTemplate={selectedTemplate}
            mode="inline"
          />
        </Card>

        {/* 3. 调整参数 - 显示在选择模板后 */}
        {selectedTemplate && currentLayout && (() => {
          const isMixed = selectedTemplate === 'co-ed'
          
          return (
            <Card title="布局参数">
              <Space direction="vertical" size="large" className="w-full">
                {/* 整体统计 */}
                <Row gutter={[16, 16]} align="middle">
                  <Col span={6}>
                    <Statistic
                      title="总容量"
                      value={totalCapacity}
                      suffix="座"
                      valueStyle={{ color: totalCapacity >= statistics.total ? '#52c41a' : '#faad14' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="报名人数"
                      value={statistics.total}
                      suffix="人"
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="使用率"
                      value={totalCapacity > 0 ? Math.round((statistics.total / totalCapacity) * 100) : 0}
                      suffix="%"
                      valueStyle={{
                        color: totalCapacity === 0 ? '#999' : statistics.total / totalCapacity > 0.95 ? '#f5222d' : statistics.total / totalCapacity > 0.8 ? '#faad14' : '#52c41a'
                      }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="剩余座位"
                      value={Math.max(0, totalCapacity - statistics.total)}
                      suffix="座"
                      valueStyle={{ color: totalCapacity - statistics.total < 5 ? '#f5222d' : '#52c41a' }}
                    />
                  </Col>
                </Row>

                {/* 混合园区：显示两个区域的独立配置 */}
                {isMixed ? (
                  <>
                    <Divider orientation="left">区域配置（可手动调整）</Divider>
                    <Row gutter={[24, 16]}>
                      {/* 女众区配置 */}
                      <Col span={12}>
                        <Card size="small" title="B区 - 女众" style={{ borderColor: '#C7B2D6' }}>
                          <Space direction="vertical" size="middle" className="w-full">
                            {/* 行列数输入 */}
                            <Row gutter={16}>
                              <Col span={12}>
                                <div>
                                  <label className="block text-sm font-medium mb-2">行数</label>
                                  <input
                                    type="number"
                                    min={4}
                                    max={12}
                                    value={femaleRows}
                                    onChange={(e) => setFemaleRows(parseInt(e.target.value) || 4)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </div>
                              </Col>
                              <Col span={12}>
                                <div>
                                  <label className="block text-sm font-medium mb-2">列数</label>
                                  <input
                                    type="number"
                                    min={4}
                                    max={8}
                                    value={femaleCols}
                                    onChange={(e) => setFemaleCols(parseInt(e.target.value) || 4)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </div>
                              </Col>
                            </Row>
                            
                            {/* 统计信息 - 使用状态变量而非section */}
                            <Row gutter={16}>
                              <Col span={12}>
                                <Statistic
                                  title="区域容量"
                                  value={femaleRows * femaleCols}
                                  suffix="座"
                                  valueStyle={{ 
                                    color: femaleRows * femaleCols >= statistics.female ? '#52c41a' : '#f5222d'
                                  }}
                                />
                              </Col>
                              <Col span={12}>
                                <Statistic
                                  title="女众人数"
                                  value={statistics.female}
                                  suffix="人"
                                />
                              </Col>
                            </Row>
                          </Space>
                        </Card>
                      </Col>

                      {/* 男众区配置 */}
                      <Col span={12}>
                        <Card size="small" title="A区 - 男众" style={{ borderColor: '#4F6FAE' }}>
                          <Space direction="vertical" size="middle" className="w-full">
                            {/* 行列数输入 */}
                            <Row gutter={16}>
                              <Col span={12}>
                                <div>
                                  <label className="block text-sm font-medium mb-2">行数</label>
                                  <input
                                    type="number"
                                    min={4}
                                    max={12}
                                    value={maleRows}
                                    onChange={(e) => setMaleRows(parseInt(e.target.value) || 4)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </div>
                              </Col>
                              <Col span={12}>
                                <div>
                                  <label className="block text-sm font-medium mb-2">列数</label>
                                  <input
                                    type="number"
                                    min={4}
                                    max={8}
                                    value={maleCols}
                                    onChange={(e) => setMaleCols(parseInt(e.target.value) || 4)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </div>
                              </Col>
                            </Row>
                            
                            {/* 统计信息 - 使用状态变量而非section */}
                            <Row gutter={16}>
                              <Col span={12}>
                                <Statistic
                                  title="区域容量"
                                  value={maleRows * maleCols}
                                  suffix="座"
                                  valueStyle={{ 
                                    color: maleRows * maleCols >= statistics.male ? '#52c41a' : '#f5222d'
                                  }}
                                />
                              </Col>
                              <Col span={12}>
                                <Statistic
                                  title="男众人数"
                                  value={statistics.male}
                                  suffix="人"
                                />
                              </Col>
                            </Row>
                          </Space>
                        </Card>
                      </Col>
                    </Row>

                    <div className="text-center mt-4">
                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        onClick={handleMixedRegionRegenerate}
                      >
                        重新生成预览
                      </Button>
                      <div className="text-sm text-gray-500 mt-2">
                        提示：修改行列数后，点击&ldquo;重新生成预览&rdquo;按钮查看效果
                      </div>
                    </div>
                  </>
                ) : (
                  /* 单性园区：显示简单的行列调整 */
                  <>
                    <Divider orientation="left">调整行列</Divider>
                    <Row gutter={[16, 16]} align="middle">
                      <Col span={6}>
                        <div>
                          <label className="block text-sm font-medium mb-2">总行数</label>
                          <input
                            type="number"
                            min={5}
                            max={20}
                            value={totalRows}
                            onChange={(e) => {
                              const rows = parseInt(e.target.value) || 10
                              handleDimensionChange(rows, totalCols)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </Col>
                      <Col span={6}>
                        <div>
                          <label className="block text-sm font-medium mb-2">总列数</label>
                          <input
                            type="number"
                            min={4}
                            max={12}
                            value={totalCols}
                            onChange={(e) => {
                              const cols = parseInt(e.target.value) || 8
                              handleDimensionChange(totalRows, cols)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </Col>
                    </Row>
                  </>
                )}
              </Space>
            </Card>
          )
        })()}

        <Divider />

        {/* 4. 布局预览 */}
        {currentLayout ? (
          <Card
            title="禅堂布局预览"
            extra={
              <Space>
                <Button onClick={handleSaveConfig}>
                  保存配置
                </Button>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleGenerateSeats}
                >
                  保存并生成座位
                </Button>
              </Space>
            }
          >
            <LayoutPreviewCanvas layout={currentLayout} loading={false} />
          </Card>
        ) : (
          <Card>
            <div className="text-center py-12 text-gray-400">
              <TeamOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>请先选择禅堂模板</p>
            </div>
          </Card>
        )}
      </Space>
    </div>
  )
}
