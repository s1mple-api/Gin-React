import { useState } from 'react'
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
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons'

interface User {
  id: number
  username: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: string
  status: boolean
  createTime: string
}

const initialData: User[] = [
  {
    id: 1,
    username: 'admin',
    name: '管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    role: 'super_admin',
    status: true,
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 2,
    username: 'user1',
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138001',
    role: 'user',
    status: true,
    createTime: '2024-01-15 10:00:00',
  },
  {
    id: 3,
    username: 'user2',
    name: '李四',
    email: 'lisi@example.com',
    phone: '13800138002',
    role: 'user',
    status: false,
    createTime: '2024-02-01 10:00:00',
  },
  {
    id: 4,
    username: 'guest',
    name: '王五',
    email: 'wangwu@example.com',
    phone: '13800138003',
    role: 'guest',
    status: true,
    createTime: '2024-02-15 10:00:00',
  },
]

const roleOptions = [
  { value: 'super_admin', label: '超级管理员' },
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '普通用户' },
  { value: 'guest', label: '访客' },
]

export default function UserManagement() {
  const [data, setData] = useState<User[]>(initialData)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')

  const filteredData = data.filter(
    (item) =>
      item.username.includes(searchText) ||
      item.name.includes(searchText) ||
      item.email.includes(searchText)
  )

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldValue('status', true)
    form.setFieldValue('role', 'user')
    setModalVisible(true)
  }

  const handleEdit = (record: User) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = (id: number) => {
    setData(data.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (editingItem) {
      setData(
        data.map((item) =>
          item.id === editingItem.id ? { ...item, ...values } : item
        )
      )
      message.success('修改成功')
    } else {
      setData([
        ...data,
        {
          ...values,
          id: Date.now(),
          createTime: new Date().toLocaleString('zh-CN'),
        },
      ])
      message.success('添加成功')
    }
    setModalVisible(false)
  }

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 70,
      render: (_: string | undefined, record: User) => (
        <Avatar
          icon={<UserOutlined />}
          src={record.avatar}
          style={{ backgroundColor: '#1890ff' }}
        />
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          super_admin: 'red',
          admin: 'orange',
          user: 'blue',
          guest: 'default',
        }
        const labelMap: Record<string, string> = {
          super_admin: '超级管理员',
          admin: '管理员',
          user: '普通用户',
          guest: '访客',
        }
        return <Tag color={colorMap[role]}>{labelMap[role]}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: boolean) => (
        <Tag color={status ? 'green' : 'red'}>{status ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
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
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增用户
          </Button>
          <Button
            icon={<ReloadOutlined />}
            style={{ marginLeft: 8 }}
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
      />
      <Modal
        title={editingItem ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingItem} />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色" options={roleOptions} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
