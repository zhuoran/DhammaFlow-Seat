"use client";

import { useEffect, useState } from "react";
import { Button, Card, Empty, Space } from "antd";
import { useAppContext } from "@/state/app-context";
import { useAllocations, useRooms, useStudents } from "@/hooks/queries";
import { bedApi } from "@/services/api";
import type { Bed } from "@/types/domain";
import { PageHeader } from "@/components/common/PageHeader";

export function AllocationPrintPage() {
  const { currentCenter, currentSession } = useAppContext();
  const allocationsQuery = useAllocations(currentSession?.id);
  const roomsQuery = useRooms(currentCenter?.id);
  const studentsQuery = useStudents(currentSession?.id);
  const [beds, setBeds] = useState<Bed[]>([]);

  useEffect(() => {
    const loadBeds = async () => {
      const list = await bedApi.fetchBeds();
      setBeds(list);
    };
    loadBeds();
  }, []);

  if (!currentCenter || !currentSession) {
    return (
      <Card>
        <PageHeader title="打印版房间表" description="请选择中心与会期" />
        <Empty />
      </Card>
    );
  }

  const bedMap = new Map(beds.map((bed) => [bed.id, bed]));
  const studentMap = new Map(studentsQuery.data?.map((student) => [student.id, student]) ?? []);

  return (
    <div>
      <PageHeader title="打印版房间表" description="导出或打印房间分配结果" />
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => window.print()}>打印</Button>
      </Space>
      <div className="print-grid">
        {roomsQuery.data?.map((room) => {
          const occupants =
            allocationsQuery.data?.filter((alloc) => bedMap.get(alloc.bedId)?.roomId === room.id) ?? [];
          return (
            <Card key={room.id} size="small" title={`${room.roomNumber}（${room.genderArea}）`} style={{ marginBottom: 12 }}>
              {occupants.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="空房" />
              ) : (
                occupants.map((alloc) => {
                  const student = studentMap.get(alloc.studentId);
                  const bed = bedMap.get(alloc.bedId);
                  return (
                    <div key={alloc.id} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{student?.name}</span>
                      <span>床位 {bed?.bedNumber}</span>
                    </div>
                  );
                })
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
