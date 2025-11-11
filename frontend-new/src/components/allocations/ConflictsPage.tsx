"use client";

import { Button, Card, Empty, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { useAllocationConflicts } from "@/hooks/queries";

interface ConflictRecord {
  id: number;
  studentName?: string;
  conflictType: string;
  description?: string;
  status: "resolved" | "unresolved";
}

export function ConflictsPage() {
  const { currentSession } = useAppContext();
  const { data, isLoading } = useAllocationConflicts(currentSession?.id);

  if (!currentSession) {
    return (
      <Card>
        <PageHeader title="冲突管理" description="请选择课程会期" />
        <Empty />
      </Card>
    );
  }

  const columns: ColumnsType<ConflictRecord> = [
    { title: "学员", dataIndex: "studentName" },
    { title: "冲突类型", dataIndex: "conflictType" },
    { title: "描述", dataIndex: "description" },
    {
      title: "状态",
      dataIndex: "status",
      render: (status: ConflictRecord["status"]) => (
        <Tag color={status === "resolved" ? "green" : "red"}>{status === "resolved" ? "已解决" : "未解决"}</Tag>
      ),
    },
    {
      title: "操作",
      render: (_, record) => (
        <Space>
          {record.status === "unresolved" && (
            <Button size="small" type="link" onClick={() => message.success("已标记为解决")}>
              标记解决
            </Button>
          )}
          <Button size="small" danger type="link">
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="冲突管理" description="查看自动分配中的冲突并手动调整" />
      <Card>
        <Table<ConflictRecord> rowKey="id" loading={isLoading} dataSource={data as ConflictRecord[]} columns={columns} />
      </Card>
    </div>
  );
}
