"use client";

import { useEffect } from "react";
import {
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  InputNumber,
  Divider,
  Row,
  Col,
  Alert,
  Typography,
} from "antd";
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
  const courseGenderType = Form.useWatch("courseGenderType", form);
  const isCoEdCourse = courseGenderType === "co-ed";
  const seatNumberingType = Form.useWatch("seatNumberingType", form);

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
          <Form.Item
            name="courseGenderType"
            label="课程性别类型"
            rules={[{ required: true, message: "请选择课程性别类型" }]}
            tooltip="决定禅堂区域是否需要按性别分区"
          >
            <Select
              options={[
                { value: "single", label: "单性课程" },
                { value: "co-ed", label: "双性课程" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="seatNumberingType"
            label="座位编号方式"
            tooltip="顺序用于单性课程，奇/偶编号用于区分两性禅堂"
          >
            <Select
              options={[
                { value: "sequential", label: "顺序编号" },
                { value: "odd", label: "奇数编号" },
                { value: "even", label: "偶数编号" },
              ]}
            />
          </Form.Item>

          <Divider orientation="left">禅堂配置</Divider>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              isCoEdCourse
                ? "双性课程需同时配置A/B区，B区用于另一性别座位"
                : "单性课程仅需配置A区，B区可留空"
            }
            description={
              seatNumberingType === "odd"
                ? "当前选择奇数编号，请确保另一性别使用偶数编号的区域"
                : seatNumberingType === "even"
                  ? "当前选择偶数编号，请为奇数编号区域准备对等列数/行数"
                  : "建议先确定列数再估算行数，确保总座位满足学员数量"
            }
          />
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            A 区通常用于主要性别或禅堂主体区域，请根据预期学员数量估算列数与行数。
          </Typography.Paragraph>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="meditationHallAWidth"
                label="禅堂A区列数"
                rules={[{ required: true, message: "请输入A区列数" }]}
                tooltip="用于主要性别禅堂列数"
              >
                <InputNumber min={1} max={200} style={{ width: "100%" }} placeholder="例如 12 列" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="meditationHallARows"
                label="禅堂A区行数"
                rules={[{ required: true, message: "请输入A区行数" }]}
                tooltip="用于主要性别禅堂行数"
              >
                <InputNumber min={1} max={200} style={{ width: "100%" }} placeholder="例如 18 行" />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Paragraph type="secondary" style={{ margin: "12px 0" }}>
            {isCoEdCourse
              ? "B 区用于另一性别或扩展区域，列数行数应与 A 区容量匹配。"
              : "若暂时只举办单性课程，可将 B 区留空，未来可随时补充。"}
          </Typography.Paragraph>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="meditationHallBWidth"
                label="禅堂B区列数"
                rules={
                  isCoEdCourse
                    ? [{ required: true, message: "双性课程需填写B区列数" }]
                    : []
                }
                tooltip={isCoEdCourse ? "用于另一性别禅堂列数" : "单性课程可留空"}
              >
                <InputNumber min={1} max={200} style={{ width: "100%" }} placeholder="例如 10 列" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="meditationHallBRows"
                label="禅堂B区行数"
                rules={
                  isCoEdCourse
                    ? [{ required: true, message: "双性课程需填写B区行数" }]
                    : []
                }
                tooltip={isCoEdCourse ? "用于另一性别禅堂行数" : "单性课程可留空"}
              >
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
