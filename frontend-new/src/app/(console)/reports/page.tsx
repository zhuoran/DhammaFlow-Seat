"use client";

import { Card } from "antd";
import { useAppContext } from "@/state/app-context";
import { PageHeader } from "@/components/common/PageHeader";

export default function ReportsPage() {
  const { currentSession } = useAppContext();

  const handleDownload = async () => {
    if (!currentSession) return;
    const res = await fetch(`/api/reports/export?sessionId=${currentSession.id}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "禅堂座位报表.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <PageHeader title="报表导出" description="下载当前会期禅堂座位报表（男众/女众各一页）" />
      <button onClick={handleDownload} disabled={!currentSession}>
        下载报表
      </button>
    </Card>
  );
}
