"use client";

import { useEffect } from "react";
import { App, Button, Card, Empty, Form, Input, DatePicker, Select, Space, InputNumber, Divider, Row, Col } from "antd";
import dayjs from "dayjs";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { sessionApi } from "@/services/api";

type CourseConfigForm = {
  teacher1Name?: string;
  teacher2Name?: string;
  courseDate?: dayjs.Dayjs;
  location?: string;
  courseGenderType?: string;
  seatNumberingType?: string;
  meditationHallAWidth?: number;
  meditationHallARows?: number;
  meditationHallBWidth?: number;
  meditationHallBRows?: number;
};

export function CourseConfigPage() {
  const { currentSession } = useAppContext();
  const [form] = Form.useForm<CourseConfigForm>();
  const { message } = App.useApp();

  useEffect(() => {
    const load = async () => {
      if (!currentSession) return;
      try {
        const config = await sessionApi.fetchSessionConfig(currentSession.id);
        if (!config) {
          form.resetFields();
          form.setFieldsValue({
            coursePlans: [
              {
                courseType: "10日课",
              },
            ],
          });
          return;
        }
        const record = config as CourseConfigForm & Record<string, unknown>;
        form.setFieldsValue({
          ...record,
          courseDate: typeof record.courseDate === "string" ? dayjs(record.courseDate) : undefined,
        });
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, [currentSession, form]);

  if (!currentSession) {
    return (
      <Card>
        <PageHeader title="课程配置" description="请选择课程会期后配置讲师与禅堂信息" />
        <Empty />
      </Card>
    );
  }

  const handleSubmit = async (values: CourseConfigForm) => {
    try {
      await sessionApi.saveSessionConfig(currentSession.id, {
        ...values,
        courseDate: values.courseDate?.format("YYYY-MM-DD"),
      });
      message.success("课程设置已保存");
    } catch (error) {
      console.error(error);
      message.error("保存失败");
    }
  };

  return (
    <div>
      <PageHeader title="课程设置" description={`当前会期：${currentSession.courseType}`} />
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="teacher1Name" label="讲师 1" rules={[{ required: true, message: "请输入讲师姓名" }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="teacher2Name" label="讲师 2">
            <Input />
          </Form.Item>
          <Form.Item name="courseDate" label="课程日期">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="location" label="课程地点">
            <Input />
          </Form.Item>
          <Form.Item name="courseGenderType" label="课程性别类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "single", label: "单性课程" },
                { value: "co-ed", label: "双性课程" },
              ]}
            />
          </Form.Item>
          <Form.Item name="seatNumberingType" label="座位编号方式">
            <Select
              options={[
                { value: "sequential", label: "顺序编号" },
                { value: "odd", label: "奇数编号" },
                { value: "even", label: "偶数编号" },
              ]}
            />
          </Form.Item>

          <Divider orientation="left">禅堂配置</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="meditationHallAWidth" label="禅堂A区列数">
                <InputNumber min={1} max={200} style={{ width: "100%" }} placeholder="例如 12 列" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="meditationHallARows" label="禅堂A区行数">
                <InputNumber min={1} max={200} style={{ width: "100%" }} placeholder="例如 18 行" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="meditationHallBWidth" label="禅堂B区列数">
                <InputNumber min={1} max={200} style={{ width: "100%" }} placeholder="例如 10 列" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="meditationHallBRows" label="禅堂B区行数">
                <InputNumber min={1} max={200} style={{ width: "100%" }} placeholder="例如 15 行" />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
