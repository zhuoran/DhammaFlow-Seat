"use client";

import { Button, Card, Empty, Select, Space, Table, Tag, message } from "antd";
import { DownloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";

export function ReportsPage() {
  const { currentSession } = useAppContext();

  if (!currentSession) {
    return (
      <Card>
        <PageHeader title="报表导出" description="请选择课程会期" />
        <Empty />
      </Card>
    );
  }

  const columns = [
    { title: "房间", dataIndex: "room" },
    { title: "床位", dataIndex: "bed" },
    { title: "学员", dataIndex: "student" },
    {
      title: "类型",
      dataIndex: "type",
      render: (type: string) => <Tag color={type === "old_student" ? "green" : "gold"}>{type}</Tag>,
    },
  ];

  const data = [
    { key: 1, room: "A101", bed: 1, student: "张三", type: "old_student" },
    { key: 2, room: "A101", bed: 2, student: "李四", type: "new_student" },
  ];

  return (
    <div>
      <PageHeader title="报表导出" description="导出房间分配、禅堂座位等报表" />

      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Select
            defaultValue="bed"
            options={[
              { value: "bed", label: "房间分配报表" },
              { value: "meditation", label: "禅堂座位报表" },
            ]}
          />
          <Button type="primary" icon={<FileExcelOutlined />} onClick={() => message.success("已导出 Excel")}>
            导出 Excel
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => message.success("已导出 PDF")}>
            导出 PDF
          </Button>
        </Space>
      </Card>

      <Card title="预览">
        <Table rowKey="key" columns={columns} dataSource={data} pagination={false} />
      </Card>
    </div>
  );
}
