"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Empty, List, Row, Space, message as antdMessage } from "antd";
import { ReloadOutlined, EyeOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { meditationSeatApi, hallConfigApi } from "@/services/api";
import { useHallConfigs, useUpdateHallLayout } from "@/hooks/queries";
import type { CompiledLayout, HallConfig, HallLayout } from "@/types/domain";
import { HallLayoutEditor } from "./HallLayoutEditor";
import { HallPreviewGrid } from "./HallPreviewGrid";

export function MeditationSeatsPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const { currentSession } = useAppContext();
  const hallConfigsQuery = useHallConfigs(currentSession?.id);
  const [selectedConfigId, setSelectedConfigId] = useState<number>();
  const [preview, setPreview] = useState<CompiledLayout | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const updateLayout = useUpdateHallLayout(currentSession?.id);

  const configs = hallConfigsQuery.data ?? [];

  useEffect(() => {
    if (!selectedConfigId && configs.length > 0) {
      setSelectedConfigId(configs[0].id);
    }
  }, [configs, selectedConfigId]);

  const selectedConfig: HallConfig | undefined = useMemo(() => {
    return configs.find((cfg) => cfg.id === selectedConfigId) ?? configs[0];
  }, [configs, selectedConfigId]);

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

  const handlePreview = async () => {
    if (!selectedConfig) return;
    setPreviewLoading(true);
    try {
      const compiled = await hallConfigApi.compileHallLayout(selectedConfig.id);
      setPreview(compiled);
    } finally {
      setPreviewLoading(false);
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
        <Button icon={<EyeOutlined />} onClick={handlePreview} disabled={!selectedConfig}>
          预览布局
        </Button>
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
                      setPreview(null);
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
              <HallLayoutEditor layout={selectedConfig.layout} loading={updateLayout.isLoading} onSubmit={handleSaveLayout} />
              <HallPreviewGrid layout={preview ?? undefined} loading={previewLoading} />
            </Space>
          )}
        </Col>
      </Row>
    </div>
  );
}
