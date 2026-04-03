import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Popconfirm,
  message,
  Tag,
  Transfer,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getAllMenus,
  type Role,
  type CreateRoleData,
  type MenuItem,
} from "../../api";

interface Menu {
  key: string;
  title: string;
}

export default function RoleManagement() {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await getRoles();
      if (res.code === 200) {
        setData(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    try {
      const res = await getAllMenus();
      if (res.code === 200) {
        const menuList: Menu[] = [];
        const flattenMenus = (menus: MenuItem[]) => {
          menus.forEach((menu) => {
            menuList.push({ key: String(menu.id), title: menu.name });
            if (menu.children) {
              flattenMenus(menu.children);
            }
          });
        };
        flattenMenus(res.data || []);
        setAllMenus(menuList);
      }
    } catch {
      // 错误已由拦截器处理
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchMenus();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldValue("status", true);
    setSelectedMenus([]);
    setModalVisible(true);
  };

  const handleEdit = (record: Role) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setSelectedMenus(record.menus?.map((m) => String(m.id)) || []);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    await deleteRole(id);
    message.success("删除成功");
    fetchRoles();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const submitData: CreateRoleData = {
      ...values,
      menu_ids: selectedMenus.map((id) => Number(id)),
    };

    if (editingItem) {
      await updateRole(editingItem.id, submitData);
      message.success("修改成功");
    } else {
      await createRole(submitData);
      message.success("添加成功");
    }
    setModalVisible(false);
    fetchRoles();
  };

  const handleMenuChange = (targetKeys: React.Key[]) => {
    setSelectedMenus(targetKeys as string[]);
  };

  const columns = [
    {
      title: "角色名称",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "角色编码",
      dataIndex: "code",
      key: "code",
      width: 150,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
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
      render: (_: unknown, record: Role) => (
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
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增角色
        </Button>
        <Button
          icon={<ReloadOutlined />}
          style={{ marginLeft: 8 }}
          onClick={fetchRoles}
        >
          刷新
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={loading}
      />
      <Modal
        title={editingItem ? "编辑角色" : "新增角色"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: "请输入角色名称" }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="角色编码"
            rules={[{ required: true, message: "请输入角色编码" }]}
          >
            <Input placeholder="请输入角色编码" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item label="分配权限">
            <Transfer
              dataSource={allMenus}
              titles={["可选权限", "已选权限"]}
              targetKeys={selectedMenus}
              onChange={handleMenuChange}
              render={(item) => item.title}
              listStyle={{ width: 200, height: 200 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
