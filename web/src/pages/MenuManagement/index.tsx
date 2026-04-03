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
  TreeSelect,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  getAllMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  type MenuItem,
  type CreateMenuData,
} from "../../api";

const iconOptions = [
  { value: "UserOutlined", label: "用户" },
  { value: "SettingOutlined", label: "设置" },
  { value: "MenuOutlined", label: "菜单" },
  { value: "TeamOutlined", label: "团队" },
  { value: "ShoppingCartOutlined", label: "购物车" },
  { value: "FileTextOutlined", label: "文档" },
  { value: "DashboardOutlined", label: "仪表盘" },
];

interface TreeNode {
  key: number;
  title: string;
  children?: TreeNode[];
}

export default function MenuManagement() {
  const [data, setData] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form] = Form.useForm();

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await getAllMenus();
      if (res.code === 200) {
        setData(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldValue("status", true);
    form.setFieldValue("sort", 1);
    setModalVisible(true);
  };

  const handleEdit = (record: MenuItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      parentId: record.parent_id,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    await deleteMenu(id);
    message.success("删除成功");
    fetchMenus();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const submitData: CreateMenuData = {
      ...values,
      parentId: values.parentId || null,
    };

    if (editingItem) {
      await updateMenu(editingItem.id, submitData);
      message.success("修改成功");
    } else {
      await createMenu(submitData);
      message.success("添加成功");
    }
    setModalVisible(false);
    fetchMenus();
  };

  const columns = [
    {
      title: "菜单名称",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "图标",
      dataIndex: "icon",
      key: "icon",
      width: 100,
      render: (icon: string) => <Tag color="blue">{icon}</Tag>,
    },
    {
      title: "路径",
      dataIndex: "path",
      key: "path",
    },
    {
      title: "排序",
      dataIndex: "sort",
      key: "sort",
      width: 80,
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
      title: "操作",
      key: "action",
      width: 150,
      render: (_: unknown, record: MenuItem) => (
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

  const buildTreeData = (menus: MenuItem[]): TreeNode[] => {
    return menus.map((menu) => ({
      key: menu.id,
      title: menu.name,
      children: menu.children ? buildTreeData(menu.children) : undefined,
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增菜单
        </Button>
        <Button icon={<ReloadOutlined />} style={{ marginLeft: 8 }} onClick={fetchMenus}>
          刷新
        </Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      <Modal
        title={editingItem ? "编辑菜单" : "新增菜单"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="菜单名称"
            rules={[{ required: true, message: "请输入菜单名称" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="path"
            label="路径"
            rules={[{ required: true, message: "请输入路径" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Select options={iconOptions} />
          </Form.Item>
          <Form.Item name="parentId" label="上级菜单">
            <TreeSelect
              treeData={[{ key: 0, title: "无", children: buildTreeData(data) }]}
              placeholder="请选择上级菜单"
              allowClear
            />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
