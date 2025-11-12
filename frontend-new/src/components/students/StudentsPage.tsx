"use client";

import { useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Upload,
  UploadProps,
  Popconfirm,
} from "antd";
import { UploadOutlined, EditOutlined, DeleteOutlined, UserAddOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Student } from "@/types/domain";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { useStudents, useStudentMutations } from "@/hooks/queries";
import { studentApi } from "@/services/api";

export function StudentsPage() {
  const { message } = App.useApp();
  const { currentSession } = useAppContext();
  const { data: students, isLoading, refetch } = useStudents(currentSession?.id);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [form] = Form.useForm<Student>();
  const [fileList, setFileList] = useState<File | null>(null);
  const { update, remove } = useStudentMutations(currentSession?.id ?? 0);

  const parseStudentNumber = (value?: string | null) => {
    if (!value) return { num: Number.MAX_SAFE_INTEGER, suffix: "" };
    const match = value.match(/^(\d+)([A-Za-z])?/);
    const num = match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
    const suffix = match?.[2] ?? "";
    return { num, suffix };
  };

  const sortedStudents = useMemo(() => {
    if (!students) return [];
    return [...students].sort((a, b) => {
      const left = parseStudentNumber(a.studentNumber);
      const right = parseStudentNumber(b.studentNumber);
      if (left.num !== right.num) {
        return left.num - right.num;
      }
      return left.suffix.localeCompare(right.suffix);
    });
  }, [students]);

  if (!currentSession) {
    return (
      <Card>
        <PageHeader title="学员管理" description="请选择课程会期后进行学员管理" />
        <Empty description="未选择课程会期" />
      </Card>
    );
  }

  const columns: ColumnsType<Student> = [
    {
      title: "编号",
      dataIndex: "studentNumber",
      width: 90,
      sorter: (a, b) => {
        const left = parseStudentNumber(a.studentNumber);
        const right = parseStudentNumber(b.studentNumber);
        if (left.num !== right.num) {
          return left.num - right.num;
        }
        return left.suffix.localeCompare(right.suffix);
      },
      defaultSortOrder: "ascend",
    },
    { title: "姓名", dataIndex: "name", width: 120 },
    {
      title: "性别",
      dataIndex: "gender",
      width: 70,
      render: (gender: Student["gender"]) => (gender === "M" ? "男" : "女"),
    },
    { title: "手机号", dataIndex: "phone", width: 140 },
    {
      title: "学员类型",
      dataIndex: "studentType",
      width: 100,
      render: (type: Student["studentType"], record) => {
        if (type === "monk") return "法师";
        const totalPractice = record.studyTimes ?? record.totalPractices ?? 0;
        return totalPractice > 0 ? "旧生" : "新生";
      },
    },
    {
      title: "操作",
      fixed: "right",
      width: 160,
      render: (_, record) => (
        <Space size="middle">
          <Button
            size="small"
            icon={<EditOutlined />}
            type="link"
            onClick={() => {
              setSelectedStudent(record);
              form.setFieldsValue(record);
              setEditModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该学员？"
            onConfirm={() => {
              remove.mutate(record.id, {
                onSuccess: () => {
                  message.success("学员已删除");
                  refetch();
                },
              });
            }}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      setFileList(file);
      return false;
    },
    maxCount: 1,
  };

  const handleSubmitEdit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedStudent) {
        await update.mutateAsync({ id: selectedStudent.id, payload: values });
        message.success("学员信息已更新");
      } else {
        await studentApi.createStudent({ ...values, sessionId: currentSession.id, centerId: currentSession.centerId });
        message.success("学员已创建");
      }
      setEditModalOpen(false);
      setSelectedStudent(null);
      form.resetFields();
      refetch();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  const handleImport = async () => {
    if (!fileList) {
      message.warning("请选择文件");
      return;
    }

    try {
      await studentApi.importStudentsExcel(currentSession.id, fileList);
      message.success("导入成功");
      setImportModalOpen(false);
      setFileList(null);
      refetch();
    } catch (error) {
      console.error(error);
      message.error("导入失败");
    }
  };

  return (
    <>
      <PageHeader
        title="学员管理"
        description="导入、编辑与维护禅修学员信息"
        extra={
          <Space>
            <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
              导入 Excel
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => {
                setSelectedStudent(null);
                form.resetFields();
                setEditModalOpen(true);
              }}
            >
              手动添加
            </Button>
          </Space>
        }
      />

      <Card>
        <Table<Student>
          rowKey="id"
          columns={columns}
          dataSource={sortedStudents}
          loading={isLoading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title={selectedStudent ? "编辑学员" : "新增学员"}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedStudent(null);
        }}
        onOk={handleSubmitEdit}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: "请输入姓名" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="性别" name="gender" rules={[{ required: true, message: "请选择性别" }]}>
            <Select
              options={[
                { value: "M", label: "男" },
                { value: "F", label: "女" },
              ]}
            />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="学员类型" name="studentType">
            <Select
              options={[
                { value: "monk", label: "法师" },
                { value: "old_student", label: "旧生" },
                { value: "new_student", label: "新生" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="导入学员 Excel"
        open={importModalOpen}
        onCancel={() => {
          setImportModalOpen(false);
          setFileList(null);
        }}
        onOk={handleImport}
        okText="开始导入"
      >
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
        <p style={{ marginTop: 12, color: "#888" }}>支持 .xlsx/.xls，每次导入前请确保模板列顺序一致。</p>
      </Modal>
    </>
  );
}
