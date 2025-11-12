"use client";

import { Card, Empty, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { useAllocations, useRooms, useStudents } from "@/hooks/queries";

interface AllocationRow {
  id: number;
  roomNumber?: string;
  bedNumber?: number;
  studentName?: string;
  studentType?: string;
  gender?: string;
}

export function AllocationDetailsPage() {
  const { currentCenter, currentSession } = useAppContext();
  const allocationsQuery = useAllocations(currentSession?.id);
  const roomsQuery = useRooms(currentCenter?.id);
  const studentsQuery = useStudents(currentSession?.id);
  if (!currentSession || !currentCenter) {
    return (
      <Card>
        <PageHeader title="分配详情" description="请选择中心和会期" />
        <Empty />
      </Card>
    );
  }

  const roomMap = new Map(roomsQuery.data?.map((room) => [room.id, room]) ?? []);
  const studentMap = new Map(studentsQuery.data?.map((stu) => [stu.id, stu]) ?? []);

  const rows: AllocationRow[] =
    allocationsQuery.data?.map((alloc) => {
      const room = roomMap.get(alloc.roomId);
      const student = studentMap.get(alloc.studentId);
      return {
        id: alloc.id,
        roomNumber: room?.roomNumber,
        bedNumber: alloc.bedNumber,
        studentName: student?.name,
        studentType: student?.studentType,
        gender: student?.gender === "M" ? "男" : "女",
      };
    }) ?? [];

  const columns: ColumnsType<AllocationRow> = [
    { title: "房间", dataIndex: "roomNumber" },
    { title: "床位", dataIndex: "bedNumber" },
    { title: "学员", dataIndex: "studentName" },
    {
      title: "学员类型",
      dataIndex: "studentType",
      render: (type: string) => {
        if (type === "monk") return "法师";
        if (type === "old_student") return "旧生";
        return "新生";
      },
    },
    { title: "性别", dataIndex: "gender" },
  ];

  return (
    <div>
      <PageHeader title="分配详情" description="查看全部学员的房间与床位" />
      <Card>
        <Table<AllocationRow> rowKey="id" columns={columns} dataSource={rows} loading={allocationsQuery.isLoading} />
      </Card>
    </div>
  );
}
