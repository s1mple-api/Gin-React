import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import Login from '../pages/Login'
import MenuManagement from '../pages/MenuManagement'
import RoleManagement from '../pages/RoleManagement'
import UserManagement from '../pages/UserManagement'
import LogManagement from '../pages/LogManagement'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/menu-management" replace />,
      },
      {
        path: 'menu-management',
        element: <MenuManagement />,
      },
      {
        path: 'role-management',
        element: <RoleManagement />,
      },
      {
        path: 'user-management',
        element: <UserManagement />,
      },
      {
        path: 'log-management',
        element: <LogManagement />,
      },
    ],
  },
])

export default router
