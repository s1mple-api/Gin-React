import { message } from "antd";
import axios, { AxiosError } from "axios";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

const CodeMessages: Record<number, string> = {
  200: "操作成功",
  400: "请求参数错误",
  401: "用户名或密码错误",
  403: "禁止访问",
  404: "资源不存在",
  500: "服务器错误",
};

let loadingCount = 0;
let loadingTimer: ReturnType<typeof setTimeout> | null = null;

const showLoading = () => {
  loadingCount++;
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  window.dispatchEvent(
    new CustomEvent("loading-change", { detail: { loading: true } }),
  );
};

const hideLoading = () => {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    window.dispatchEvent(
      new CustomEvent("loading-change", { detail: { loading: false } }),
    );
  }
};

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    showLoading();
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    hideLoading();
    const res = response.data as ApiResponse;
    if (res.code !== 200) {
      const errorMsg = res.message || CodeMessages[res.code] || "操作失败";
      message.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    return response.data;
  },
  (error: AxiosError) => {
    hideLoading();
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      message.error("登录已过期，请重新登录");
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      message.error("禁止访问");
    } else if (error.response?.status === 404) {
      message.error("请求的资源不存在");
    } else if (error.response?.status === 500) {
      message.error("服务器内部错误");
    } else if (error.code === "ECONNABORTED") {
      message.error("请求超时，请稍后重试");
    } else {
      message.error(error.message || "网络错误");
    }
    return Promise.reject(error);
  },
);

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    avatar?: string;
    role?: {
      name: string;
    };
  };
}

export const login = (data: LoginData) => {
  return api.post("/login", data) as Promise<ApiResponse<LoginResponse>>;
};

export const logout = () => {
  return api.post("/logout") as Promise<ApiResponse<null>>;
};

export interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: string;
  parent_id: number | null;
  sort: number;
  status: boolean;
  children?: MenuItem[];
}

export const getMenus = () => {
  return api.get("/menu/list") as Promise<ApiResponse<MenuItem[]>>;
};

export const getAllMenus = () => {
  return api.get("/menu/all") as Promise<ApiResponse<MenuItem[]>>;
};

export interface CreateMenuData {
  name: string;
  path: string;
  icon?: string;
  parentId?: number | null;
  sort?: number;
  status?: boolean;
}

export const createMenu = (data: CreateMenuData) => {
  return api.post("/menu", data) as Promise<ApiResponse<null>>;
};

export const updateMenu = (id: number, data: CreateMenuData) => {
  return api.put(`/menu/${id}`, data) as Promise<ApiResponse<null>>;
};

export const deleteMenu = (id: number) => {
  return api.delete(`/menu/${id}`) as Promise<ApiResponse<null>>;
};

export interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  status: boolean;
  menus: { id: number }[];
  created_at: string;
}

export const getRoles = () => {
  return api.get("/role/list") as Promise<ApiResponse<Role[]>>;
};

export interface CreateRoleData {
  name: string;
  code: string;
  description?: string;
  status?: boolean;
  menu_ids?: number[];
}

export const createRole = (data: CreateRoleData) => {
  return api.post("/role", data) as Promise<ApiResponse<null>>;
};

export const updateRole = (id: number, data: CreateRoleData) => {
  return api.put(`/role/${id}`, data) as Promise<ApiResponse<null>>;
};

export const deleteRole = (id: number) => {
  return api.delete(`/role/${id}`) as Promise<ApiResponse<null>>;
};

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role_id: number;
  role?: { name: string };
  status: boolean;
  created_at: string;
}

export const getUsers = () => {
  return api.get("/user/list") as Promise<ApiResponse<User[]>>;
};

export interface CreateUserData {
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  role_id: number;
  status?: boolean;
}

export const createUser = (data: CreateUserData) => {
  return api.post("/user", data) as Promise<ApiResponse<null>>;
};

export const updateUser = (id: number, data: Partial<CreateUserData>) => {
  return api.put(`/user/${id}`, data) as Promise<ApiResponse<null>>;
};

export const deleteUser = (id: number) => {
  return api.delete(`/user/${id}`) as Promise<ApiResponse<null>>;
};

export interface UserInfo {
  id: number;
  username: string;
  name: string;
  avatar?: string;
  role?: {
    name: string;
  };
}

export const getUserInfo = () => {
  return api.get("/user/info") as Promise<ApiResponse<UserInfo>>;
};

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export const changePassword = (data: ChangePasswordData) => {
  return api.post("/user/password", data) as Promise<ApiResponse<null>>;
};

export interface Log {
  id: number;
  user_id: number;
  username: string;
  action: string;
  method: string;
  path: string;
  ip: string;
  status: number;
  message: string;
  created_at: string;
  user?: {
    id: number;
    username: string;
    name: string;
  };
}

export interface LogListResponse {
  list: Log[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LogStats {
  today_logins: number;
  today_logouts: number;
  today_operations: number;
  total_logs: number;
}

export interface GetLogsParams {
  action?: string;
  username?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
}

export const getLogs = (params?: GetLogsParams) => {
  return api.get("/log/list", { params }) as Promise<
    ApiResponse<LogListResponse>
  >;
};

export const getLogStats = () => {
  return api.get("/log/stats") as Promise<ApiResponse<LogStats>>;
};

export { AxiosError };
export default api;
