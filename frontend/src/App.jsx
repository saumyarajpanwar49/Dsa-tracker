import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import AdminSidebar from './components/admin/AdminSidebar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';

import TopicsPage from './pages/TopicsPage';
import TopicView from './pages/TopicView';
import AllProblems from './pages/AllProblems';

function UserLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/topics/:topic" element={<TopicView />} />
          <Route path="/problems" element={<AllProblems />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}