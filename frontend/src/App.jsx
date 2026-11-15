import { useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Menu } from 'lucide-react';

import Sidebar from './components/Sidebar';
import AdminSidebar from './components/admin/AdminSidebar';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SubscriptionGuard from './components/SubscriptionGuard';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SubscriptionPage from './pages/SubscriptionPage';

import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';

import TopicsPage from './pages/TopicsPage';
import TopicView from './pages/TopicView';
import AllProblems from './pages/AllProblems';
import QuestionBank from './pages/QuestionBank';

import RoadmapPage from './pages/RoadmapPage';
import WeaknessPage from './pages/WeaknessPage';
import RevisionPage from './pages/RevisionPage';
import AnalyticsPage from './pages/AnalyticsPage';

function UserLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#080808] text-white">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#333333] bg-[#111111] px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="rounded-lg border border-[#444444] bg-[#222222] p-2 text-[#FFD700] hover:bg-[#303030]"
          >
            <Menu size={21} />
          </button>

          <span className="font-mono text-sm font-bold tracking-wider text-[#FFD700]">
            KONOHA DSA
          </span>
        </header>

        <main className="min-w-0 w-full flex-1 p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6">
        <Outlet />
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
        <Route
          path="/subscription"
          element={<SubscriptionPage />}
        />

        <Route element={<UserLayout />}>
          <Route element={<SubscriptionGuard />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/topics/:topic" element={<TopicView />} />
            <Route path="/problems" element={<AllProblems />} />
            <Route path="/question-bank" element={<QuestionBank />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/weakness" element={<WeaknessPage />} />
            <Route path="/revision" element={<RevisionPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
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
