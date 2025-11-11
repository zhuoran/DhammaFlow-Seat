"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { Bed, Room } from "@/types/domain";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/state/app-context";
import { bedApi } from "@/services/api";
import { useRooms, useRoomMutations } from "@/hooks/queries";

interface GenderRoomStats {
  single: number;
  double: number;
  teacher: number;
  totalRooms: number;
}

interface RoomStats {
  female: GenderRoomStats;
  male: GenderRoomStats;
  publicRooms: string[];
}

export function RoomsPage() {
  const { currentCenter } = useAppContext();
  const { data: rooms, isLoading, refetch } = useRooms(currentCenter?.id);
  const mutation = useRoomMutations(currentCenter?.id ?? 0);
  const [filterGender, setFilterGender] = useState<string>();
  const [filterFloor, setFilterFloor] = useState<number | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [bedModalOpen, setBedModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomForm] = Form.useForm<Room>();
  const [bedForm] = Form.useForm<Bed>();
  const [bedsByRoom, setBedsByRoom] = useState<Record<number, Bed[]>>({});
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const stats: RoomStats = useMemo(() => {
    const base: RoomStats = {
      female: { single: 0, double: 0, teacher: 0, totalRooms: 0 },
      male: { single: 0, double: 0, teacher: 0, totalRooms: 0 },
      publicRooms: [],
    };
    if (!rooms) {
      return base;
    }
    return rooms.reduce<RoomStats>((acc, room) => {
      const isFemale = room.genderArea === "女";
      const isPublic = room.notes?.includes("公共") ?? false;
      const isTeacher = room.roomType === "monk" || room.roomType === "老师房";
      const target = isFemale ? acc.female : acc.male;
      if (isPublic) {
        acc.publicRooms.push(room.roomNumber);
        return acc;
      }
      target.totalRooms += 1;
      if (isTeacher) {
        target.teacher += 1;
        return acc;
      }
      if (room.capacity === 1) {
        target.single += 1;
      } else {
        target.double += 1;
      }
      return acc;
    }, base);
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms?.filter((room) => {
      if (filterGender && room.genderArea !== filterGender) return false;
      if (filterFloor !== null && room.floor !== filterFloor) return false;
      return true;
    });
  }, [rooms, filterGender, filterFloor]);

  const floorOptions = useMemo(() => {
    const floors = Array.from(new Set(rooms?.map((room) => room.floor) ?? []));
    return floors.sort((a, b) => a - b).map((floor) => ({ label: `${floor}楼`, value: floor }));
  }, [rooms]);

  if (!currentCenter) {
    return (
      <Card>
        <PageHeader title="房间管理" description="请选择禅修中心后管理房间" />
        <Alert message="未选择禅修中心" type="info" />
      </Card>
    );
  }

  const handleRoomSubmit = async () => {
    try {
      const values = await roomForm.validateFields();
      if (editingRoom) {
        await mutation.update.mutateAsync({ id: editingRoom.id, payload: values });
        message.success("房间已更新");
      } else {
        await mutation.create.mutateAsync({ ...values, centerId: currentCenter.id });
        message.success("房间已创建");
      }
      setRoomModalOpen(false);
      setEditingRoom(null);
      roomForm.resetFields();
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    try {
      await mutation.remove.mutateAsync(room.id);
      message.success("房间已删除");
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const ensureBedsLoaded = async (roomId: number) => {
    if (bedsByRoom[roomId]) return;
    const list = await bedApi.fetchBeds(roomId);
    setBedsByRoom((prev) => ({ ...prev, [roomId]: list }));
  };

  const handleAddBed = (room: Room) => {
    setSelectedRoom(room);
    bedForm.resetFields();
    setBedModalOpen(true);
  };

  const handleSaveBed = async () => {
    if (!selectedRoom) return;
    try {
      const values = await bedForm.validateFields();
      await bedApi.createBed({
        ...values,
        roomId: selectedRoom.id,
        status: values.status ?? "AVAILABLE",
      });
      message.success("床位已创建");
      const list = await bedApi.fetchBeds(selectedRoom.id);
      setBedsByRoom((prev) => ({ ...prev, [selectedRoom.id]: list }));
      setBedModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteBed = async (bed: Bed) => {
    await bedApi.deleteBed(bed.id);
    message.success("床位已删除");
    if (selectedRoom) {
      const list = await bedApi.fetchBeds(selectedRoom.id);
      setBedsByRoom((prev) => ({ ...prev, [selectedRoom.id]: list }));
    }
  };

  const columns: ColumnsType<Room> = [
    { title: "房号", dataIndex: "roomNumber", width: 100 },
    { title: "建筑", dataIndex: "building", width: 90 },
    { title: "楼层", dataIndex: "floor", width: 80 },
    { title: "容量", dataIndex: "capacity", width: 80 },
    {
      title: "性别区域",
      dataIndex: "genderArea",
      width: 100,
      render: (value: Room["genderArea"]) => <Tag color={value === "女" ? "magenta" : "blue"}>{value === "女" ? "女众" : "男众"}</Tag>,
    },
    { title: "类型", dataIndex: "roomType", width: 120 },
    { title: "备注", dataIndex: "notes" },
    {
      title: "操作",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            type="link"
            onClick={() => {
              setEditingRoom(record);
              roomForm.setFieldsValue(record);
              setRoomModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRoom(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="房间管理"
        description="维护房间与床位信息，支持按性别和楼层过滤"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRoom(null);
              roomForm.resetFields();
              setRoomModalOpen(true);
            }}
          >
            新增房间
          </Button>
        }
      />

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Alert message={`女众单间：${stats.female.single}`} type="info" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Alert message={`女众双人间：${stats.female.double}`} type="info" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Alert message={`男众单间：${stats.male.single}`} type="success" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Alert message={`男众双人间：${stats.male.double}`} type="success" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Alert message={`女众老师房：${stats.female.teacher}`} type="warning" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Alert message={`男众老师房：${stats.male.teacher}`} type="warning" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Alert message={`女众房间总数：${stats.female.totalRooms}`} type="info" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Alert message={`男众房间总数：${stats.male.totalRooms}`} type="success" />
          </Col>
        </Row>
        {stats.publicRooms.length > 0 && (
          <Alert style={{ marginTop: 16 }} type="warning" message={`公共房：${stats.publicRooms.join("，")}`} showIcon />
        )}
      </Card>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="按性别区域过滤"
            style={{ width: 200 }}
            allowClear
            value={filterGender}
            options={[
              { value: "女", label: "女众" },
              { value: "男", label: "男众" },
            ]}
            onChange={setFilterGender}
          />
          <Select
            placeholder="按楼层过滤"
            style={{ width: 200 }}
            allowClear
            value={filterFloor}
            options={floorOptions}
            onChange={(value) => setFilterFloor(value ?? null)}
          />
        </Space>

        <Table<Room>
          rowKey="id"
          columns={columns}
          dataSource={filteredRooms}
          loading={isLoading}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpand: async (expanded, record) => {
              if (expanded) {
                await ensureBedsLoaded(record.id);
                setExpandedKeys((prev) => [...prev, record.id]);
              } else {
                setExpandedKeys((prev) => prev.filter((key) => key !== record.id));
              }
            },
            expandedRowRender: (record) => {
              const beds = bedsByRoom[record.id] ?? [];
              return (
                <div>
                  <Space wrap style={{ marginBottom: 12 }}>
                    {beds.map((bed) => (
                      <Tag key={bed.id} color={bed.status === "AVAILABLE" ? "blue" : "red"}>
                        床号 {bed.bedNumber}（{bed.status === "AVAILABLE" ? "可用" : "占用"}）
                        <Button
                          size="small"
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteBed(bed)}
                        />
                      </Tag>
                    ))}
                    <Button size="small" icon={<PlusOutlined />} onClick={() => handleAddBed(record)}>
                      添加床位
                    </Button>
                  </Space>
                </div>
              );
            },
          }}
        />
      </Card>

      <Modal
        title={editingRoom ? "编辑房间" : "新增房间"}
        open={roomModalOpen}
        onCancel={() => setRoomModalOpen(false)}
        onOk={handleRoomSubmit}
        destroyOnHidden
      >
        <Form form={roomForm} layout="vertical">
          <Form.Item name="roomNumber" label="房号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="building" label="建筑" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="floor" label="楼层" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="capacity" label="容量" rules={[{ required: true }]}>
            <InputNumber min={1} max={10} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="roomType" label="房间类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "monk", label: "法师房" },
                { value: "old_student", label: "旧生房" },
                { value: "new_student", label: "新生房" },
                { value: "other", label: "其他" },
              ]}
            />
          </Form.Item>
          <Form.Item name="genderArea" label="性别区域" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "女", label: "女众" },
                { value: "男", label: "男众" },
              ]}
            />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`添加床位 - ${selectedRoom?.roomNumber ?? ""}`}
        open={bedModalOpen}
        onCancel={() => {
          setBedModalOpen(false);
          setSelectedRoom(null);
        }}
        onOk={handleSaveBed}
        destroyOnHidden
      >
        <Form form={bedForm} layout="vertical">
          <Form.Item name="bedNumber" label="床号" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="position" label="床位位置">
            <Select
              options={[
                { value: "上铺", label: "上铺" },
                { value: "下铺", label: "下铺" },
                { value: "单床", label: "单床" },
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="AVAILABLE">
            <Select
              options={[
                { value: "AVAILABLE", label: "可用" },
                { value: "OCCUPIED", label: "已占用" },
                { value: "RESERVED", label: "已预留" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
