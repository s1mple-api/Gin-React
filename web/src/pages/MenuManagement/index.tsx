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
  AxiosError,
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

interface ErrorResponse {
  message?: string;
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
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      message.error(axiosError.response?.data?.message || "获取菜单失败");
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
    try {
      const res = await deleteMenu(id);
      if (res.code === 200) {
        message.success("删除成功");
        fetchMenus();
      } else {
        message.error(res.message);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      message.error(axiosError.response?.data?.message || "删除失败");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData: CreateMenuData = {
        ...values,
        parentId: values.parentId || null,
      };

      if (editingItem) {
        const res = await updateMenu(editingItem.id, submitData);
        if (res.code === 200) {
          message.success("修改成功");
          fetchMenus();
        } else {
          message.error(res.message);
        }
      } else {
        const res = await createMenu(submitData);
        if (res.code === 200) {
          message.success("添加成功");
          fetchMenus();
        } else {
          message.error(res.message);
        }
      }
      setModalVisible(false);
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      message.error(axiosError.response?.data?.message || "操作失败");
    }
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

  const buildTreeData = (items: MenuItem[]): TreeNode[] => {
    return items.map((item) => ({
      key: item.id,
      title: item.name,
      children: item.children ? buildTreeData(item.children) : undefined,
    }));
  };

  const treeData = buildTreeData(data);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增菜单
        </Button>
        <Button
          icon={<ReloadOutlined />}
          style={{ marginLeft: 8 }}
          onClick={fetchMenus}
        >
          刷新
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        defaultExpandAllRows
        loading={loading}
      />
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
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item
            name="path"
            label="路由路径"
            rules={[{ required: true, message: "请输入路由路径" }]}
          >
            <Input placeholder="请输入路由路径" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Select placeholder="请选择图标" options={iconOptions} />
          </Form.Item>
          <Form.Item name="parentId" label="父级菜单">
            <TreeSelect
              style={{ width: "100%" }}
              placeholder="请选择父级菜单"
              treeData={treeData}
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <Input type="number" placeholder="请输入排序" />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
