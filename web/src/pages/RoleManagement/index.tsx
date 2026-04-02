import { useState } from "react";
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
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  status: boolean;
  menus: string[];
  createTime: string;
}

const initialData: Role[] = [
  {
    id: 1,
    name: "超级管理员",
    code: "super_admin",
    description: "拥有所有权限",
    status: true,
    menus: ["menu_management", "role_management", "user_management"],
    createTime: "2024-01-01 10:00:00",
  },
  {
    id: 2,
    name: "普通用户",
    code: "user",
    description: "普通用户权限",
    status: true,
    menus: ["menu_management"],
    createTime: "2024-01-15 10:00:00",
  },
  {
    id: 3,
    name: "访客",
    code: "guest",
    description: "只读权限",
    status: false,
    menus: [],
    createTime: "2024-02-01 10:00:00",
  },
];

const allMenus = [
  { key: "menu_management", title: "菜单管理" },
  { key: "role_management", title: "角色管理" },
  { key: "user_management", title: "用户管理" },
  { key: "order_list", title: "订单列表" },
  { key: "order_stats", title: "订单统计" },
];

export default function RoleManagement() {
  const [data, setData] = useState<Role[]>(initialData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);

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
    setSelectedMenus(record.menus);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    setData(data.filter((item) => item.id !== id));
    message.success("删除成功");
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingItem) {
      setData(
        data.map((item) =>
          item.id === editingItem.id
            ? { ...item, ...values, menus: selectedMenus }
            : item,
        ),
      );
      message.success("修改成功");
    } else {
      setData([
        ...data,
        {
          ...values,
          id: Date.now(),
          menus: selectedMenus,
          createTime: new Date().toLocaleString("zh-CN"),
        },
      ]);
      message.success("添加成功");
    }
    setModalVisible(false);
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
      dataIndex: "createTime",
      key: "createTime",
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
        <Button icon={<ReloadOutlined />} style={{ marginLeft: 8 }}>
          刷新
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{ pageSize: 10 }}
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
