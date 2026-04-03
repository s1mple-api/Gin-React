import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  theme,
  type MenuProps,
  message,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { getUserInfo, logout, type UserInfo, AxiosError } from "../api";

const { Header, Sider, Content, Footer } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [
  {
    key: "/menu-management",
    icon: <DashboardOutlined />,
    label: "菜单管理",
  },
  {
    key: "/role-management",
    icon: <SettingOutlined />,
    label: "角色管理",
  },
  {
    key: "/user-management",
    icon: <UserOutlined />,
    label: "用户管理",
  },
  {
    key: "/log-management",
    icon: <FileTextOutlined />,
    label: "日志管理",
  },
];

interface ErrorResponse {
  message?: string;
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const fetchUserInfo = async () => {
    try {
      const res = await getUserInfo();
      if (res.code === 200) {
        setUserInfo(res.data);
      } else {
        message.error(res.message || "获取用户信息失败");
      }
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      message.error(axiosError.response?.data?.message || "获取用户信息失败");
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as UserInfo;
        // 使用 requestAnimationFrame 避免在 effect 中同步调用 setState 导致的级联渲染问题
        requestAnimationFrame(() => {
          setUserInfo(parsed);
        });
      } catch {
        requestAnimationFrame(() => {
          fetchUserInfo();
        });
      }
    } else {
      requestAnimationFrame(() => {
        fetchUserInfo();
      });
    }
  }, []);

  const userMenuItems: MenuItem[] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人中心",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "系统设置",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      danger: true,
    },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  const handleUserMenuClick = async (key: string) => {
    if (key === "logout") {
      try {
        await logout();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        message.success("已退出登录");
        navigate("/login");
      } catch (error) {
        console.error("登出请求失败:", error);
        message.error("登出失败，请重试");
      }
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ background: token.colorBgContainer }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: collapsed ? 16 : 20,
            fontWeight: "bold",
            color: token.colorPrimary,
            borderBottom: `1px solid ${token.colorBorder}`,
          }}
        >
          {collapsed ? "Admin" : "后台管理系统"}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: token.colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => handleUserMenuClick(key),
            }}
            placement="bottomRight"
          >
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Avatar
                icon={<UserOutlined />}
                src={userInfo?.avatar || null}
                style={{ backgroundColor: token.colorPrimary }}
              />
              <span>{userInfo?.name || userInfo?.username || "用户"}</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: "24px 24px 0",
            padding: 24,
            minHeight: 280,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
}
