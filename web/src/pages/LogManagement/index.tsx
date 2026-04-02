import { useState, useEffect } from "react";
import {
  Table,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Tag,
  Button,
  message,
  Statistic,
  Row,
  Col,
  type TablePaginationConfig,
} from "antd";
import {
  ReloadOutlined,
  LoginOutlined,
  LogoutOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { getLogs, getLogStats, type Log, type LogStats } from "../../api";
import { AxiosError } from "axios";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface ErrorResponse {
  message?: string;
}

const actionOptions = [
  { value: "", label: "全部" },
  { value: "登录", label: "登录" },
  { value: "登出", label: "登出" },
  { value: "创建菜单", label: "创建菜单" },
  { value: "更新菜单", label: "更新菜单" },
  { value: "删除菜单", label: "删除菜单" },
  { value: "创建角色", label: "创建角色" },
  { value: "更新角色", label: "更新角色" },
  { value: "删除角色", label: "删除角色" },
  { value: "创建用户", label: "创建用户" },
  { value: "更新用户", label: "更新用户" },
  { value: "删除用户", label: "删除用户" },
  { value: "修改密码", label: "修改密码" },
];

export default function LogManagement() {
  const [data, setData] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    action: "",
    username: "",
    start_date: "",
    end_date: "",
  });

  const fetchStats = async () => {
    try {
      const res = await getLogStats();
      if (res.code === 200) {
        setStats(res.data);
      }
    } catch {
      console.error("获取统计数据失败");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getLogs({
        action: filters.action || undefined,
        username: filters.username || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (res.code === 200) {
        setData(res.data.list);
        setPagination((prev) => ({
          ...prev,
          total: res.data.total,
        }));
      }
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      message.error(axiosError.response?.data?.message || "获取日志失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleDateChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
  ) => {
    if (dates && dates[0] && dates[1]) {
      setFilters({
        ...filters,
        start_date: dates[0].format("YYYY-MM-DD"),
        end_date: dates[1].format("YYYY-MM-DD"),
      });
    } else {
      setFilters({
        ...filters,
        start_date: "",
        end_date: "",
      });
    }
    setPagination({ ...pagination, current: 1 });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "登录":
        return <LoginOutlined />;
      case "登出":
        return <LogoutOutlined />;
      default:
        return <EditOutlined />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "登录":
        return "green";
      case "登出":
        return "orange";
      default:
        return "blue";
    }
  };

  const columns = [
    {
      title: "时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "用户",
      dataIndex: "username",
      key: "username",
      width: 120,
    },
    {
      title: "操作",
      dataIndex: "action",
      key: "action",
      width: 120,
      render: (action: string) => (
        <Tag icon={getActionIcon(action)} color={getActionColor(action)}>
          {action}
        </Tag>
      ),
    },
    {
      title: "请求方式",
      dataIndex: "method",
      key: "method",
      width: 100,
      render: (method: string) => (
        <Tag
          color={
            method === "POST" ? "green" : method === "PUT" ? "blue" : "red"
          }
        >
          {method}
        </Tag>
      ),
    },
    {
      title: "路径",
      dataIndex: "path",
      key: "path",
      ellipsis: true,
    },
    {
      title: "IP地址",
      dataIndex: "ip",
      key: "ip",
      width: 140,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (status: number) => (
        <Tag color={status === 200 ? "success" : "error"}>
          {status === 200 ? "成功" : "失败"}
        </Tag>
      ),
    },
    {
      title: "消息",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日登录"
              value={stats?.today_logins || 0}
              prefix={<LoginOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日登出"
              value={stats?.today_logouts || 0}
              prefix={<LogoutOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日操作"
              value={stats?.today_operations || 0}
              prefix={<EditOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="日志总数"
              value={stats?.total_logs || 0}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="操作类型"
            value={filters.action}
            onChange={(value) => handleFilterChange("action", value)}
            options={actionOptions}
            style={{ width: 120 }}
            allowClear
          />
          <Input.Search
            placeholder="用户名"
            onSearch={(value) => handleFilterChange("username", value)}
            style={{ width: 150 }}
            allowClear
          />
          <RangePicker onChange={handleDateChange} />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchData();
              fetchStats();
            }}
          >
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
}
