"use client";

import { Button, Card, Col, Empty, Row, Space, Tag, message } from "antd";
import { ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { meditationSeatApi } from "@/services/api";

const seatColors: Record<string, string> = {
  monk: "#f759ab",
  student: "#1890ff",
  dharma_worker: "#fa8c16",
};

export function MeditationSeatsPage() {
  const { currentSession } = useAppContext();

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
    message.success("已触发生成");
  };

  const seats = Array.from({ length: 20 }, (_, idx) => ({
    id: idx + 1,
    number: `A${idx + 1}`,
    type: idx < 3 ? "monk" : "student",
  }));

  return (
    <div>
      <PageHeader title="禅堂座位" description="生成与查看禅堂座位排布" />
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<ReloadOutlined />} onClick={handleGenerate}>
          生成座位
        </Button>
        <Button icon={<DownloadOutlined />}>导出座位表</Button>
      </Space>
      <Row gutter={[16, 16]}>
        {seats.map((seat) => (
          <Col key={seat.id} xs={6} sm={4} md={3}>
            <Card size="small" style={{ textAlign: "center", background: seatColors[seat.type] ?? "#f0f0f0", color: "#fff" }}>
              {seat.number}
            </Card>
          </Col>
        ))}
      </Row>
      <Space style={{ marginTop: 16 }}>
        <Tag color={seatColors.monk}>法师座</Tag>
        <Tag color={seatColors.student}>学员座</Tag>
        <Tag color={seatColors.dharma_worker}>法工座</Tag>
      </Space>
    </div>
  );
}
