import axios, { AxiosError } from "axios";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
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
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
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

export { AxiosError };
export default api;
