"use client";

import { useMemo, useState } from "react";
import { Button, Card, Col, Empty, List, Row, Space, Switch, message as antdMessage } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { meditationSeatApi } from "@/services/api";
import { useHallConfigs, useUpdateHallLayout, useStudents } from "@/hooks/queries";
import type { CompiledLayout, HallConfig, HallLayout } from "@/types/domain";
import { HallLayoutEditor } from "./HallLayoutEditor";
import { HallPreviewGrid } from "./HallPreviewGrid";
import { compileLayoutLocally } from "@/utils/hall-layout-compiler";

export function MeditationSeatsPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const { currentSession } = useAppContext();
  const hallConfigsQuery = useHallConfigs(currentSession?.id);
  const studentsQuery = useStudents(currentSession?.id);
  const [selectedConfigId, setSelectedConfigId] = useState<number>();
  const [autoPreviewEnabled, setAutoPreviewEnabled] = useState(true);
  const [localPreview, setLocalPreview] = useState<CompiledLayout | null>(null);

  const updateLayout = useUpdateHallLayout(currentSession?.id);

  const configs = useMemo(() => hallConfigsQuery.data ?? [], [hallConfigsQuery.data]);
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const studentCount = students.length;

  // 派生状态：自动选择第一个配置
  const actualSelectedConfigId = useMemo(() => {
    if (selectedConfigId) return selectedConfigId;
    if (configs.length > 0) return configs[0].id;
    return undefined;
  }, [selectedConfigId, configs]);

  const selectedConfig: HallConfig | undefined = useMemo(() => {
    return configs.find((cfg) => cfg.id === actualSelectedConfigId);
  }, [configs, actualSelectedConfigId]);

  if (!currentSession) {
    return (
      <Card>
        <PageHeader title="禅堂座位" description="请选择会期" />
        <Empty />
      </Card>
    );
  }

  const handleGenerate = async () => {
    await meditationSeatApi.generateSeats(currentSession.id);
    messageApi.success("已触发禅堂座位生成");
  };

  const handleSaveLayout = async (layout: HallLayout) => {
    if (!selectedConfig) return;
    await updateLayout.mutateAsync({ id: selectedConfig.id, layout });
    messageApi.success("布局已保存");
  };

  const handleLayoutChange = () => {
    if (!autoPreviewEnabled || !selectedConfig) return;

    // 使用前端本地编译生成预览
    try {
      const compiled = compileLayoutLocally(selectedConfig.layout);
      setLocalPreview(compiled);
    } catch (err) {
      console.error('预览编译失败:', err);
      setLocalPreview(null);
    }
  };

  const handlePreviewUpdate = (layout: HallLayout) => {
    if (!autoPreviewEnabled) return;

    // 应用模板时立即更新预览
    try {
      const compiled = compileLayoutLocally(layout);
      setLocalPreview(compiled);
    } catch (err) {
      console.error('预览编译失败:', err);
      setLocalPreview(null);
    }
  };

  return (
    <div>
      {contextHolder}
      <PageHeader title="禅堂座位" description="配置禅堂布局并生成座位表" />
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<ReloadOutlined />} onClick={handleGenerate}>
          生成座位
        </Button>
        <Switch
          checked={autoPreviewEnabled}
          onChange={setAutoPreviewEnabled}
          checkedChildren="实时预览"
          unCheckedChildren="手动预览"
        />
      </Space>

      <Row gutter={16}>
        <Col xs={24} md={7}>
          <Card title="禅堂列表" loading={hallConfigsQuery.isLoading}>
            {configs.length === 0 ? (
              <Empty description="暂无禅堂配置" />
            ) : (
              <List
                dataSource={configs}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => {
                      setSelectedConfigId(item.id);
                      setLocalPreview(null);
                    }}
                    style={{
                      cursor: "pointer",
                      background: item.id === selectedConfig?.id ? "#f5f5f5" : undefined,
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <List.Item.Meta title={`${item.regionName ?? item.regionCode}`} description={`配置ID: ${item.id}`} />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={17}>
          {!selectedConfig ? (
            <Card>
              <Empty description="请选择禅堂" />
            </Card>
          ) : (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <HallLayoutEditor
                layout={selectedConfig.layout}
                loading={updateLayout.isLoading}
                onSubmit={handleSaveLayout}
                onValuesChange={handleLayoutChange}
                onPreviewUpdate={handlePreviewUpdate}
                studentCount={studentCount}
              />
              <HallPreviewGrid layout={localPreview ?? undefined} loading={false} />
            </Space>
          )}
        </Col>
      </Row>
    </div>
  );
}
