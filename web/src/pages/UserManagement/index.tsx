import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Popconfirm,
  message,
  Tag,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  type User,
  type CreateUserData,
  type Role,
} from "../../api";

interface RoleOption {
  value: number;
  label: string;
}

export default function UserManagement() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      if (res.code === 200) {
        setData(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await getRoles();
      if (res.code === 200) {
        setRoleOptions(
          (res.data || []).map((role: Role) => ({
            value: role.id,
            label: role.name,
          })),
        );
      }
    } catch {
      // 错误已由拦截器处理
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const filteredData = data.filter(
    (item) =>
      item.username.includes(searchText) ||
      item.name.includes(searchText) ||
      item.email.includes(searchText),
  );

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldValue("status", true);
    form.setFieldValue("role_id", roleOptions[0]?.value);
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    await deleteUser(id);
    message.success("删除成功");
    fetchUsers();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();

    if (editingItem) {
      await updateUser(editingItem.id, values);
      message.success("修改成功");
    } else {
      await createUser(values as CreateUserData);
      message.success("添加成功");
    }
    setModalVisible(false);
    fetchUsers();
  };

  const columns = [
    {
      title: "头像",
      dataIndex: "avatar",
      key: "avatar",
      width: 70,
      render: (_: string | undefined, record: User) => (
        <Avatar
          icon={<UserOutlined />}
          src={record.avatar || null}
          style={{ backgroundColor: "#1890ff" }}
        />
      ),
    },
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
      width: 120,
    },
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 100,
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      width: 180,
    },
    {
      title: "手机号",
      dataIndex: "phone",
      key: "phone",
      width: 130,
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      width: 100,
      render: (role: { name: string } | undefined) => {
        if (!role) return "-";
        const colorMap: Record<string, string> = {
          超级管理员: "red",
          管理员: "orange",
          普通用户: "blue",
          访客: "default",
        };
        return <Tag color={colorMap[role.name]}>{role.name}</Tag>;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (status: boolean) => (
        <Tag color={status ? "green" : "red"}>{status ? "启用" : "禁用"}</Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除?"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
          <Button
            icon={<ReloadOutlined />}
            style={{ marginLeft: 8 }}
            onClick={fetchUsers}
          >
            刷新
          </Button>
        </div>
        <Input.Search
          placeholder="搜索用户名、姓名、邮箱"
          onSearch={setSearchText}
          style={{ width: 300 }}
          allowClear
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={loading}
      />
      <Modal
        title={editingItem ? "编辑用户" : "新增用户"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input disabled={!!editingItem} />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: "请输入姓名" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: !editingItem, message: "请输入密码" }]}
          >
            <Input.Password placeholder={editingItem ? "不修改请留空" : ""} />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效邮箱" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: "请输入手机号" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role_id"
            label="角色"
            rules={[{ required: true, message: "请选择角色" }]}
          >
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
