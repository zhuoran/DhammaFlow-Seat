"use client";

import { useState } from "react";
import { Alert, App, Button, Card, Empty, Result, Space, Steps, Upload } from "antd";
import type { UploadProps } from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { importApi } from "@/services/api";

export function RoomImportPage() {
  const { message } = App.useApp();
  const { currentCenter } = useAppContext();
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ successCount: number; failureCount: number; totalCount: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!currentCenter) {
    return (
      <Card>
        <PageHeader title="房间数据导入" description="请选择禅修中心后执行导入操作" />
        <Empty />
      </Card>
    );
  }

  const uploadProps: UploadProps = {
    multiple: false,
    maxCount: 1,
    accept: ".xlsx,.xls",
    customRequest: async ({ file, onError, onSuccess }) => {
      if (!(file instanceof File)) {
        onError?.(new Error("文件无效"));
        return;
      }
      try {
        setUploading(true);
        setStep(1);
        const res = await importApi.importRoomsAndBeds(file, currentCenter.id);
        setResult(res);
        setStep(2);
        message.success(res.message);
        onSuccess?.(res, file);
      } catch (error) {
        console.error(error);
        message.error("导入失败");
        onError?.(error as Error);
        setStep(0);
      } finally {
        setUploading(false);
      }
    },
  };

  return (
    <div>
      <PageHeader title="房间数据导入" description="通过标准模板批量导入房间与床位信息" />

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            message={`当前中心：${currentCenter.centerName}`}
            description="所有导入的数据都会写入该中心，请确保选择正确。"
            type="info"
            showIcon
          />

          <Button icon={<DownloadOutlined />} href="/房间床位导入模板.xlsx" download>
            下载导入模板
          </Button>

          <Upload.Dragger {...uploadProps} disabled={uploading} style={{ padding: 24 }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽 Excel 文件到此处上传</p>
          </Upload.Dragger>

          <Steps
            current={step}
            items={[{ title: "准备" }, { title: "上传中" }, { title: "完成" }]}
            style={{ maxWidth: 600 }}
          />
        </Space>
      </Card>

      {result && (
        <Result
          status={result.failureCount ? "warning" : "success"}
          title="导入完成"
          subTitle={`成功 ${result.successCount} 条，失败 ${result.failureCount} 条，合计 ${result.totalCount} 条`}
        />
      )}
    </div>
  );
}
