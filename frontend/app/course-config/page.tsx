'use client';

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Spin,
  Row,
  Col,
  Divider,
  message,
  App,
  DatePicker,
  Space,
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { sessionApi } from '@/services/api';
import dayjs from 'dayjs';

export default function CourseConfig() {
  const { message: msg } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  // 加载课程设置
  const loadConfig = async () => {
    if (!currentSession?.id) {
      msg.warning('请先选择课程');
      return;
    }

    setLoading(true);
    try {
      const response = await sessionApi.getSessionConfig(currentSession.id);
      if (response.data?.code === 200 || response.data?.code === 0) {
        const config = response.data.data;
        if (config) {
          // 转换 courseDate 为 dayjs 对象
          const formData = {
            ...config,
            courseDate: config.courseDate ? dayjs(config.courseDate) : null,
          };
          form.setFieldsValue(formData);
          msg.success('课程设置加载成功');
        } else {
          form.resetFields();
          msg.info('课程设置为空，请填写');
        }
      } else {
        msg.error(response.data?.message || '加载课程设置失败');
      }
    } catch (error) {
      console.error('Failed to load course config:', error);
      msg.error('加载课程设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存课程设置
  const handleSave = async (values: any) => {
    if (!currentSession?.id) {
      msg.warning('请先选择课程');
      return;
    }

    setSaving(true);
    try {
      // 转换 dayjs 对象为字符串
      const config = {
        ...values,
        courseDate: values.courseDate ? values.courseDate.format('YYYY-MM-DD') : null,
      };

      const response = await sessionApi.saveSessionConfig(currentSession.id, config);
      if (response.data?.code === 200 || response.data?.code === 0) {
        msg.success('课程设置保存成功');
        // 重新加载数据
        loadConfig();
      } else {
        msg.error(response.data?.message || '保存课程设置失败');
      }
    } catch (error) {
      console.error('Failed to save course config:', error);
      msg.error('保存课程设置失败');
    } finally {
      setSaving(false);
    }
  };

  if (!isHydrated) {
    return <Spin />;
  }

  if (!currentSession?.id) {
    return (
      <Card style={{ marginTop: '20px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>请先选择课程</p>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card title={`课程设置 - ${currentSession?.sessionCode || '未命名'}`}>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            autoComplete="off"
          >
            {/* 讲师信息区 */}
            <Divider orientation="left">讲师信息</Divider>
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="讲师1"
                  name="teacher1Name"
                  rules={[{ required: true, message: '请输入讲师1的名字' }]}
                >
                  <Input placeholder="请输入讲师1的名字" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="讲师2（可选，用于双性课程）"
                  name="teacher2Name"
                >
                  <Input placeholder="请输入讲师2的名字（可选）" />
                </Form.Item>
              </Col>
            </Row>

            {/* 课程基本信息区 */}
            <Divider orientation="left">课程基本信息</Divider>
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="课程日期"
                  name="courseDate"
                >
                  <DatePicker style={{ width: '100%' }} placeholder="请选择课程开始日期" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="课程地点"
                  name="location"
                >
                  <Input placeholder="请输入课程地点" />
                </Form.Item>
              </Col>
            </Row>

            {/* 课程类型区 */}
            <Divider orientation="left">课程类型</Divider>
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="课程性别类型"
                  name="courseGenderType"
                  rules={[{ required: true, message: '请选择课程性别类型' }]}
                >
                  <Select placeholder="请选择课程性别类型">
                    <Select.Option value="single">单性课程</Select.Option>
                    <Select.Option value="co-ed">双性课程</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="座位编号方式"
                  name="seatNumberingType"
                >
                  <Select placeholder="请选择座位编号方式">
                    <Select.Option value="sequential">顺序编号</Select.Option>
                    <Select.Option value="odd">奇数编号</Select.Option>
                    <Select.Option value="even">偶数编号</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* 禅堂配置区 */}
            <Divider orientation="left">禅堂配置（A/B区域分离）</Divider>
            <Row gutter={24}>
              <Col xs={24}>
                <p style={{ color: '#999', marginBottom: '16px' }}>
                  禅堂A区域配置（用于男性或主要区域）
                </p>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="禅堂A区宽度（座位数/行）"
                  name="meditationHallAWidth"
                >
                  <InputNumber
                    min={1}
                    max={100}
                    placeholder="请输入禅堂A区宽度"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="禅堂A区行数"
                  name="meditationHallARows"
                >
                  <InputNumber
                    min={1}
                    max={100}
                    placeholder="请输入禅堂A区行数"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24}>
                <p style={{ color: '#999', marginBottom: '16px' }}>
                  禅堂B区域配置（用于女性或附加区域，可选）
                </p>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="禅堂B区宽度（座位数/行）"
                  name="meditationHallBWidth"
                >
                  <InputNumber
                    min={1}
                    max={100}
                    placeholder="请输入禅堂B区宽度"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="禅堂B区行数"
                  name="meditationHallBRows"
                >
                  <InputNumber
                    min={1}
                    max={100}
                    placeholder="请输入禅堂B区行数"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* 按钮区 */}
            <Divider />
            <Row gutter={16} justify="center">
              <Col>
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={loadConfig}
                  loading={loading}
                >
                  重新加载
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  htmlType="submit"
                  loading={saving}
                >
                  保存设置
                </Button>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
