'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Upload,
  Progress,
  message,
  Space,
  Statistic,
  Row,
  Col,
  Alert,
  Divider,
  Steps,
  Select,
  Empty,
} from 'antd';
import { InboxOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { importApi, centerApi } from '@/services/api';

interface ImportResult {
  successCount: number;
  failureCount: number;
  totalCount: number;
  message: string;
}

interface CenterOption {
  id: number;
  centerName: string;
}

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<number | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // 初始化：从 localStorage 获取已选中的禅修中心
  useEffect(() => {
    const storedCenter = localStorage.getItem('currentCenter');
    if (storedCenter) {
      try {
        const center = JSON.parse(storedCenter);
        setSelectedCenter(center.id);
      } catch (error) {
        console.error('Failed to parse center:', error);
      }
    }
  }, []);


  const handleDownloadTemplate = () => {
    const templatePath = '/房间床位导入模板.xlsx';
    const link = document.createElement('a');
    link.href = templatePath;
    link.download = '房间床位导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('模板下载成功');
  };

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;

    if (!selectedCenter) {
      message.error('请先选择禅修中心');
      onError?.(new Error('请先选择禅修中心'));
      return;
    }

    try {
      setUploading(true);
      setCurrentStep(1);
      const excelFile = file as File;
      const response = await importApi.importRoomsAndBeds(excelFile, selectedCenter);

      // 检查响应的code：0 或 200 都表示成功
      if (response.data?.code === 0 || response.data?.code === 200) {
        const result = response.data.data as ImportResult;
        setImportResult(result);
        setCurrentStep(2);
        message.success(result.message);
        onSuccess?.(response.data, file as any);
      } else {
        const errorMsg = response.data?.msg || response.data?.message || '导入失败';
        message.error(errorMsg);
        onError?.(new Error(errorMsg));
      }
    } catch (error: any) {
      const errorMsg = '导入失败: ' + (error.message || '未知错误');
      message.error(errorMsg);
      onError?.(error);
      setCurrentStep(0);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setImportResult(null);
    setCurrentStep(0);
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    accept: '.xlsx,.xls',
    customRequest: handleUpload,
    disabled: !selectedCenter || uploading,
  };

  // 如果未选中中心，显示提示
  if (!selectedCenter) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="请先选择禅修中心"
          description="请从顶部菜单栏选择要操作的禅修中心，然后再访问此页面"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Empty description="暂无禅修中心选择" style={{ marginTop: 50 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card title="房间数据导入" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 显示已选中的禅修中心 */}
          <Alert
            message={`当前禅修中心已选择`}
            description="系统已自动识别您在顶部菜单栏选择的禅修中心。房间和床位数据将导入到该中心。"
            type="info"
            showIcon
          />

          <Divider />

          {/* 第一步: 下载模板 */}
          <div>
            <h3>第一步: 下载导入模板</h3>
            <Alert
              message="请按照模板格式准备您的数据，模板包含详细说明和示例"
              type="info"
              style={{ marginBottom: '16px' }}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载导入模板
            </Button>
          </div>

          <Divider />

          {/* 第二步: 上传文件 */}
          <div>
            <h3>第二步: 上传Excel文件</h3>
            <Alert
              message="支持 .xlsx 和 .xls 格式，单个文件不超过 10MB"
              type="info"
              style={{ marginBottom: '16px' }}
            />
            <Upload.Dragger {...uploadProps} style={{ padding: '24px' }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 .xlsx 和 .xls 格式的 Excel 文件
              </p>
            </Upload.Dragger>
          </div>

          {/* 导入进度步骤 */}
          {currentStep > 0 && (
            <>
              <Divider />
              <div>
                <h3>导入进度</h3>
                <Steps
                  current={currentStep}
                  items={[
                    { title: '准备上传' },
                    { title: '上传中', description: '正在上传文件...' },
                    { title: '完成', description: '导入成功' },
                  ]}
                />
              </div>
            </>
          )}

          {/* 导入结果 */}
          {importResult && (
            <>
              <Divider />
              <div>
                <h3>导入结果</h3>
                <Alert
                  message={importResult.message}
                  type={importResult.failureCount === 0 ? 'success' : 'warning'}
                  style={{ marginBottom: '16px' }}
                />
                <Row gutter={24}>
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="成功"
                      value={importResult.successCount}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="失败"
                      value={importResult.failureCount}
                      valueStyle={{
                        color: importResult.failureCount > 0 ? '#ff4d4f' : '#52c41a',
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="总数"
                      value={importResult.totalCount}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
                <Button
                  type="primary"
                  style={{ marginTop: '16px' }}
                  onClick={handleReset}
                >
                  重新导入
                </Button>
              </div>
            </>
          )}
        </Space>
      </Card>

      {/* 使用说明 */}
      <Card title="使用说明">
        <ol style={{ lineHeight: '1.8' }}>
          <li>
            <strong>选择禅修中心:</strong> 从下拉菜单中选择您要导入数据的禅修中心
          </li>
          <li>
            <strong>下载模板:</strong> 点击"下载导入模板"按钮，获取标准 Excel 模板
          </li>
          <li>
            <strong>填充数据:</strong> 按照模板说明填写房间信息，每行代表一个房间
            <ul>
              <li>楼层: 一楼/二楼/三楼等</li>
              <li>房间号: 如 B101、A216（建筑+房号）</li>
              <li>房间类型: 义工房/学员房/老师房/其他</li>
              <li>性别区域: 男/女</li>
              <li>容量: 床位数量（1-4张）</li>
              <li>备注: 可选，记录房间特殊信息</li>
            </ul>
          </li>
          <li>
            <strong>上传文件:</strong> 拖拽或点击选择您填充好的 Excel 文件，系统会自动导入
          </li>
          <li>
            <strong>查看结果:</strong> 导入完成后，查看成功/失败统计，系统会自动为每个房间生成床位
          </li>
        </ol>

        <Alert
          message="提示"
          description="系统会根据您指定的容量自动生成床位。例如：容量为 2 时，会自动生成 1 张下铺和 1 张上铺。"
          type="info"
          style={{ marginTop: '16px' }}
        />
      </Card>
    </div>
  );
}
