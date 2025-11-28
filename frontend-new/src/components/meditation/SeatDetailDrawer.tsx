"use client";

import { useEffect, useState } from "react";
import { Drawer, Form, Button, Descriptions, Select, Space, Tag, message as antdMessage } from "antd";
import type { MeditationSeat, Student } from "@/types/domain";
import { meditationSeatApi } from "@/services/api";

interface SeatDetailDrawerProps {
  seat: MeditationSeat | null;
  open: boolean;
  students: Student[];
  onClose: () => void;
  onUpdate: () => void;
}

/**
 * 座位详情抽屉（外层包装）
 * 负责根据 seat/open 决定是否渲染内部带表单的内容，
 * 避免在 seat 为空时渲染依赖 seat 的 UI 或逻辑。
 */
export function SeatDetailDrawer({ seat, open, students, onClose, onUpdate }: SeatDetailDrawerProps) {
  if (!open || !seat) {
    return null;
  }

  return (
    <SeatDetailDrawerContent
      seat={seat}
      open={open}
      students={students}
      onClose={onClose}
      onUpdate={onUpdate}
    />
  );
}

interface SeatDetailDrawerContentProps extends Omit<SeatDetailDrawerProps, "seat"> {
  seat: MeditationSeat;
}

/**
 * 座位详情抽屉内部实现
 * 此组件假定 seat 一定非空，并在其中使用 Form.useForm。
 */
function SeatDetailDrawerContent({ seat, open, students, onClose, onUpdate }: SeatDetailDrawerContentProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = antdMessage.useMessage();

  useEffect(() => {
    form.setFieldsValue({
      studentId: seat.studentId,
    });
  }, [seat, form]);

  const handleAssign = async () => {
    const values = await form.validateFields();

    if (!values.studentId) {
      messageApi.warning('请选择学员');
      return;
    }

    setLoading(true);
    try {
      await meditationSeatApi.assignSeat(seat.id, values.studentId);
      messageApi.success('分配成功');
      onUpdate();
      onClose();
    } catch (error) {
      messageApi.error('分配失败');
      console.error('Assign seat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!seat.studentId) {
      messageApi.warning('该座位未分配学员');
      return;
    }

    setLoading(true);
    try {
      // 分配 null 表示取消分配
      await meditationSeatApi.assignSeat(seat.id, null);
      messageApi.success('已取消分配');
      onUpdate();
      onClose();
    } catch (error) {
      messageApi.error('取消分配失败');
      console.error('Unassign seat error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤可分配的学员（同性别、未分配座位）
  const availableStudents = students.filter(
    (student) => student.gender === seat.gender && student.status !== 'assigned_seat',
  );

  const currentStudent = students.find((s) => s.id === seat.studentId);

  const getSeatStatusTag = () => {
    if (seat.status === 'available') {
      return <Tag color="default">空座位</Tag>;
    }
    if (seat.status === 'allocated') {
      return <Tag color="success">已分配</Tag>;
    }
    if (seat.status === 'reserved') {
      return <Tag color="warning">保留</Tag>;
    }
    return null;
  };

  return (
    <>
      {contextHolder}
      <Drawer
        title="座位详情"
        open={open}
        onClose={onClose}
        width={400}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>取消</Button>
            {!!seat.studentId && (
              <Button danger onClick={handleUnassign} loading={loading}>
                取消分配
              </Button>
            )}
            <Button type="primary" onClick={handleAssign} loading={loading}>
              保存
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="座位编号">
              {seat.seatNumber}
            </Descriptions.Item>
            <Descriptions.Item label="区域">
              {seat.regionCode}
            </Descriptions.Item>
            <Descriptions.Item label="位置">
              第 {seat.rowIndex + 1} 排 第 {seat.colIndex + 1} 列
            </Descriptions.Item>
            <Descriptions.Item label="性别">
              {seat.gender === 'M'
                ? '男众'
                : seat.gender === 'F'
                  ? '女众'
                  : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">{getSeatStatusTag()}</Descriptions.Item>
          </Descriptions>

          {currentStudent && (
            <Descriptions column={1} bordered size="small" title="当前学员">
              <Descriptions.Item label="姓名">{currentStudent.name}</Descriptions.Item>
              <Descriptions.Item label="学员类型">
                {currentStudent.studentType === 'old_student' ? '旧生' : '新生'}
              </Descriptions.Item>
              <Descriptions.Item label="电话">{currentStudent.phone || '-'}</Descriptions.Item>
            </Descriptions>
          )}

          <Form form={form} layout="vertical">
            <Form.Item
              label="选择学员"
              name="studentId"
              help={`当前区域可分配学员数: ${availableStudents.length}`}
            >
              <Select
                showSearch
                placeholder="搜索学员姓名或编号"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={availableStudents.map((student) => ({
                  label: `${student.name} (${student.studentType === 'old_student' ? '旧生' : '新生'})`,
                  value: student.id,
                }))}
              />
            </Form.Item>
          </Form>
        </Space>
      </Drawer>
    </>
  );
}
