'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Upload, Empty, Spin, App } from 'antd';
import { UserAddOutlined, DeleteOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import { Student } from '@/types';
import { studentApi } from '@/services/api';

export default function Students() {
  const { message } = App.useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [form] = Form.useForm();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

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

  // 加载学员数据
  const loadStudents = async () => {
    if (!currentSession?.id) return;

    setLoading(true);
    try {
      const response = await studentApi.getStudents(currentSession.id);
      if (response.data?.code === 200 || response.data?.code === 0) {
        // ListData 对象的 list 字段
        const data = response.data.data;
        const studentList = (data && data.list) ? data.list : [];
        setStudents(studentList);
      } else {
        message.error(response.data?.message || '加载学员失败');
      }
    } catch (error) {
      console.error('Failed to load students:', error);
      message.error('加载学员失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 当会期改变时加载学员数据
  useEffect(() => {
    if (isHydrated) {
      loadStudents();
    }
  }, [currentSession?.id, isHydrated]);

  if (!currentSession) {
    return (
      <div>
        <div className="page-header">
          <h1>学员管理</h1>
        </div>
        <Empty description="请先选择课程会期" style={{ marginTop: 50 }} />
      </div>
    );
  }

  const columns = [
    {
      title: '编号',
      dataIndex: 'studentNumber',
      key: 'studentNumber',
      width: 80,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
      render: (gender: string) => (gender === 'M' ? '男' : '女'),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 60,
    },
    {
      title: '身份证',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 120,
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
    },
    {
      title: '手机',
      dataIndex: 'phone',
      key: 'phone',
      width: 100,
    },
    {
      title: '10日',
      dataIndex: 'course10dayTimes',
      key: 'course10dayTimes',
      width: 60,
      render: (val: number) => val || 0,
    },
    {
      title: '四念住',
      dataIndex: 'course4mindfulnessTimes',
      key: 'course4mindfulnessTimes',
      width: 60,
      render: (val: number) => val || 0,
    },
    {
      title: '20日',
      dataIndex: 'course20dayTimes',
      key: 'course20dayTimes',
      width: 60,
      render: (val: number) => val || 0,
    },
    {
      title: '30日',
      dataIndex: 'course30dayTimes',
      key: 'course30dayTimes',
      width: 60,
      render: (val: number) => val || 0,
    },
    {
      title: '45日',
      dataIndex: 'course45dayTimes',
      key: 'course45dayTimes',
      width: 60,
      render: (val: number) => val || 0,
    },
    {
      title: '服务',
      dataIndex: 'serviceTimes',
      key: 'serviceTimes',
      width: 60,
      render: (val: number) => val || 0,
    },
    {
      title: '学员类型',
      dataIndex: 'studentType',
      key: 'studentType',
      width: 80,
      render: (type: string, record: Student) => {
        // 根据修学总数判断学员类型
        // 法师类型通过手动设置
        if (type === 'monk') {
          return '法师';
        }
        // 修学总数 > 0 为旧生，否则为新生
        const studyTimes = record.studyTimes || 0;
        return studyTimes > 0 ? '旧生' : '新生';
      },
    },
    {
      title: '练习',
      dataIndex: 'practice',
      key: 'practice',
      width: 120,
    },
    {
      title: '同期人员',
      dataIndex: 'fellowList',
      key: 'fellowList',
      width: 120,
    },
    {
      title: '愿意服务',
      dataIndex: 'willingToServe',
      key: 'willingToServe',
      width: 80,
    },
    {
      title: '证件地址',
      dataIndex: 'idAddress',
      key: 'idAddress',
      width: 150,
    },
    {
      title: '直系亲属电话',
      dataIndex: 'emergencyPhone',
      key: 'emergencyPhone',
      width: 120,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Student) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    form.setFieldsValue(student);
    setEditModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该学员吗？',
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        try {
          const response = await studentApi.deleteStudent(id);
          if (response.data?.code === 200 || response.data?.code === 0) {
            message.success('学员已删除');
            loadStudents();
          } else {
            message.error(response.data?.message || '删除失败');
          }
        } catch (error) {
          console.error('Failed to delete student:', error);
          message.error('删除失败，请重试');
        }
      },
    });
  };

  const handleImportClose = () => {
    setImportModalVisible(false);
    setImportFile(null);
  };

  const handleImportFileChange = (info: any) => {
    const file = info.fileList[0]?.originFileObj;
    setImportFile(file || null);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      message.warning('请先选择文件');
      return;
    }

    if (!currentSession?.id) {
      message.warning('请先选择课程会期');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('sessionId', currentSession.id.toString());

      const response = await fetch(`http://localhost:8080/api/students/import-excel?sessionId=${currentSession.id}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.code === 200 || result.code === 0) {
        message.success(`导入成功，共 ${result.data} 条学员`);
        handleImportClose();
        loadStudents();
      } else {
        message.error(result.message || '导入失败');
      }
    } catch (error) {
      console.error('Failed to import students:', error);
      message.error('导入失败，请检查网络连接');
    } finally {
      setImporting(false);
    }
  };

  const handleEditClose = () => {
    setEditModalVisible(false);
    setSelectedStudent(null);
    form.resetFields();
  };

  const handleEditSubmit = async (values: any) => {
    if (!selectedStudent) return;

    try {
      const response = await studentApi.updateStudent(selectedStudent.id, values);
      if (response.data?.code === 200 || response.data?.code === 0) {
        message.success('学员信息已更新');
        handleEditClose();
        loadStudents();
      } else {
        message.error(response.data?.message || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update student:', error);
      message.error('更新失败，请重试');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>学员管理</h1>
        <p className="description">管理课程中的学员信息，支持 Excel 批量导入</p>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setImportModalVisible(true)}
        >
          导入学员 (Excel)
        </Button>
        <Button icon={<UserAddOutlined />}>
          手动添加
        </Button>
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={students}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 名学员`,
          }}
          locale={{
            emptyText: '暂无学员数据，请导入或手动添加',
          }}
        />
      </Spin>

      {/* 导入弹窗 */}
      <Modal
        title="导入学员"
        open={importModalVisible}
        onCancel={handleImportClose}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="选择 Excel 文件">
            <Upload
              accept=".xlsx,.xls"
              maxCount={1}
              beforeUpload={() => false}
              onChange={handleImportFileChange}
            >
              <Button icon={<UploadOutlined />}>
                {importFile ? importFile.name : '选择文件'}
              </Button>
            </Upload>
          </Form.Item>
          <Form.Item label="格式要求">
            <div style={{ fontSize: '12px', color: '#666' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>支持格式：</strong>按照学员登记表的标准格式，包含以下列（从第6行开始为数据）：
              </p>
              <ul style={{ marginBottom: '8px' }}>
                <li><strong>列0：编号</strong>（可选）</li>
                <li><strong>列1：姓名</strong>（必填）</li>
                <li><strong>列2：身份证号码</strong>（可选）</li>
                <li><strong>列3：年龄</strong>（必填）</li>
                <li><strong>列4：城市</strong>（可选）</li>
                <li><strong>列5：手机</strong>（可选）</li>
                <li><strong>列6：10日课程参修次数</strong>（可选）</li>
                <li><strong>列7：四念住课程参修次数</strong>（可选）</li>
                <li><strong>列8：20日课程参修次数</strong>（可选）</li>
                <li><strong>列9：30日课程参修次数</strong>（可选）</li>
                <li><strong>列10：45日课程参修次数</strong>（可选）</li>
                <li><strong>列11：服务次数</strong>（可选）</li>
                <li><strong>列12：练习（每周时长）</strong>（可选）</li>
                <li><strong>列13：同期人员</strong>（可选）</li>
                <li><strong>列14：是否愿意服务</strong>（可选）</li>
                <li><strong>列15：证件地址</strong>（可选）</li>
                <li><strong>列16：居住地址</strong>（可选）</li>
                <li><strong>列17：直系亲属电话</strong>（可选）</li>
              </ul>
              <p style={{ marginBottom: '4px' }}>
                <strong>多 sheet 说明：</strong>
              </p>
              <ul>
                <li>支持同时上传包含"男众"和"女众"两个 sheet 的 Excel 文件</li>
                <li>系统将根据 sheet 名称自动判断性别：包含"男"→男众，包含"女"→女众</li>
                <li>所有 sheet 必须使用相同的列结构和格式</li>
              </ul>
            </div>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              block
              onClick={handleImportSubmit}
              loading={importing}
              disabled={!importFile}
            >
              {importing ? '导入中...' : '导入'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑学员信息"
        open={editModalVisible}
        onCancel={handleEditClose}
        okText="保存"
        cancelText="取消"
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          {/* 基本信息 */}
          <Form.Item name="studentNumber" label="编号">
            <Input />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
            <Select options={[
              { value: 'M', label: '男' },
              { value: 'F', label: '女' },
            ]} />
          </Form.Item>
          <Form.Item name="age" label="年龄" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号码">
            <Input />
          </Form.Item>
          <Form.Item name="city" label="城市">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号码">
            <Input />
          </Form.Item>

          {/* 课程信息 */}
          <div style={{ marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>
            课程参修信息
          </div>
          <Form.Item name="course10dayTimes" label="10日课程">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="course4mindfulnessTimes" label="四念住课程">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="course20dayTimes" label="20日课程">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="course30dayTimes" label="30日课程">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="course45dayTimes" label="45日课程">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="serviceTimes" label="服务次数">
            <Input type="number" />
          </Form.Item>

          {/* 其他信息 */}
          <div style={{ marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>
            其他信息
          </div>
          <Form.Item name="practice" label="练习（每周时长）">
            <Input />
          </Form.Item>
          <Form.Item name="fellowList" label="同期人员">
            <Input />
          </Form.Item>
          <Form.Item name="willingToServe" label="是否愿意服务">
            <Input />
          </Form.Item>
          <Form.Item name="idAddress" label="证件地址">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="specialNotes" label="居住地址">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="emergencyPhone" label="直系亲属电话">
            <Input />
          </Form.Item>
          <Form.Item name="studentType" label="学员类型" rules={[{ required: true }]}>
            <Select options={[
              { value: 'monk', label: '法师' },
              { value: 'old_student', label: '旧生' },
              { value: 'new_student', label: '新生' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
