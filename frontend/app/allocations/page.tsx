'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Progress, Statistic, Row, Col, Empty, Spin, Alert, App } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, AlertOutlined, ReloadOutlined } from '@ant-design/icons';
import { allocationApi, studentApi } from '@/services/api';

export default function Allocations() {
  const { message } = App.useApp();
  const [allocating, setAllocating] = useState(false);
  const [allocated, setAllocated] = useState(false);
  const [allocationResult, setAllocationResult] = useState<any>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 初始化：从 localStorage 读取当前会期
  useEffect(() => {
    const stored = localStorage.getItem('currentSession');
    if (stored) {
      setCurrentSession(JSON.parse(stored));
    }
    setIsHydrated(true);
  }, []);

  // 初始化时获取学员数量
  useEffect(() => {
    if (isHydrated && currentSession?.id) {
      loadStudentCount();
    }
  }, [currentSession?.id, isHydrated]);

  const loadStudentCount = async () => {
    try {
      const response = await studentApi.countStudents(currentSession.id);
      if (response.data?.code === 200 || response.data?.code === 0) {
        setStudentCount(response.data.data || 0);
      }
    } catch (error) {
      console.error('Failed to load student count:', error);
    }
  };

  if (!currentSession) {
    return (
      <div>
        <div className="page-header">
          <h1>房间分配</h1>
        </div>
        <Empty description="请先选择课程会期" style={{ marginTop: 50 }} />
      </div>
    );
  }

  const handleAutoAllocate = async () => {
    if (studentCount === 0) {
      message.warning('请先导入学员信息');
      return;
    }

    setAllocating(true);

    try {
      const response = await allocationApi.autoAllocate(currentSession.id);

      if (response.data?.code === 200 || response.data?.code === 0) {
        setAllocationResult(response.data.data);
        setAllocated(true);
        message.success('房间分配完成！');
      } else {
        message.error(response.data?.message || '分配失败');
      }
    } catch (error) {
      console.error('Failed to allocate:', error);
      message.error('分配失败，请重试');
    } finally {
      setAllocating(false);
    }
  };

  const handleClear = async () => {
    try {
      const response = await allocationApi.clearAllocations(currentSession.id);

      if (response.data?.code === 200 || response.data?.code === 0) {
        setAllocated(false);
        setAllocationResult(null);
        message.success('分配已清除');
      } else {
        message.error(response.data?.message || '清除失败');
      }
    } catch (error) {
      console.error('Failed to clear allocations:', error);
      message.error('清除失败，请重试');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>房间分配</h1>
        <p className="description">
          自动分配房间床位给学员，系统会根据学员类型、性别和分配规则进行智能分配
        </p>
      </div>

      {allocated && (
        <Alert
          message="分配成功"
          description="房间分配已完成，请检查冲突并进行必要的调整"
          type="success"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[24, 24]}>
        {/* 分配按钮区 */}
        <Col xs={24} md={12}>
          <Card title="一键分配" variant="borderless">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <p>点击下方按钮开始自动分配房间。系统会：</p>
                <ul>
                  <li>根据学员类型（法师/旧生/新生）优先分配</li>
                  <li>考虑性别分离的要求</li>
                  <li>保护同伴关系</li>
                  <li>检测和报告冲突</li>
                </ul>
              </div>

              {!allocating && !allocated && (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleAutoAllocate}
                  block
                  disabled={studentCount === 0}
                >
                  开始自动分配 ({studentCount} 名学员)
                </Button>
              )}

              {allocating && (
                <div style={{ textAlign: 'center' }}>
                  <Spin />
                  <p style={{ marginTop: 16 }}>
                    分配进行中...
                  </p>
                </div>
              )}

              {allocated && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleOutlined />}
                    disabled
                    block
                  >
                    分配完成
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleClear} block>
                    清除分配
                  </Button>
                </Space>
              )}
            </Space>
          </Card>
        </Col>

        {/* 统计信息区 */}
        <Col xs={24} md={12}>
          <Card title="分配统计" variant="borderless">
            {allocating && (
              <div>
                <Spin />
                <p style={{ marginTop: 16, textAlign: 'center', color: '#8c8c8c' }}>
                  正在分配中...
                </p>
              </div>
            )}

            {allocated && allocationResult && (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="已分配"
                    value={allocationResult.statistics?.allocatedStudents || 0}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="待分配"
                    value={allocationResult.statistics?.unallocatedStudents || 0}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="冲突数"
                    value={0}
                    prefix={<AlertOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="成功率"
                    value={
                      allocationResult.statistics?.totalStudents > 0
                        ? (
                            (allocationResult.statistics.allocatedStudents /
                              allocationResult.statistics.totalStudents) *
                            100
                          ).toFixed(1)
                        : 0
                    }
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>
            )}

            {!allocating && !allocated && (
              <p style={{ color: '#8c8c8c' }}>
                {studentCount === 0 ? '请先导入学员信息' : '分配前请确保已导入所有学员信息'}
              </p>
            )}
          </Card>
        </Col>
      </Row>

      {/* 分配规则说明 */}
      <Card title="分配规则" style={{ marginTop: 24 }} variant="borderless">
        <div>
          <h4>优先级顺序：</h4>
          <ol>
            <li>法师 (Monks)</li>
            <li>旧生 (Old Students)</li>
            <li>新生 (New Students)</li>
          </ol>

          <h4 style={{ marginTop: 16 }}>性别分离规则：</h4>
          <p>如果是混合性别课程，男性和女性学员会被分配到不同的房间</p>

          <h4 style={{ marginTop: 16 }}>同伴保护：</h4>
          <p>指定为同伴的学员会被优先分配到同一房间</p>
        </div>
      </Card>

      {allocated && (
        <Card title="后续操作" style={{ marginTop: 24 }} variant="borderless">
          <Space>
            <Button
              type="primary"
              onClick={() => (window.location.href = '/allocations/conflicts')}
            >
              查看冲突
            </Button>
            <Button
              onClick={() => (window.location.href = '/allocations/details')}
            >
              查看详情
            </Button>
            <Button
              onClick={() => (window.location.href = '/reports')}
            >
              生成报表
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}
