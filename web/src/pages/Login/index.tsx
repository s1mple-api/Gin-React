import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { login, type LoginData } from "../../api";
import { AxiosError } from "axios";

interface LoginForm {
  username: string;
  password: string;
}

interface ErrorResponse {
  message?: string;
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      const res = await login(values as LoginData);
      if (res.code === 200) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        message.success("登录成功");
        navigate("/menu-management");
      } else {
        message.error(res.message || "登录失败");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      message.error(
        axiosError.response?.data?.message || "登录失败，请检查网络",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card
        style={{ width: 400 }}
        bordered={false}
        styles={{ body: { padding: 40 } }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>
            后台管理系统
          </h1>
          <p style={{ color: "#666" }}>Admin System</p>
        </div>
        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名: admin" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码: admin123"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44, fontSize: 16 }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
