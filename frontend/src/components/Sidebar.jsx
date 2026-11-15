import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  useTopics,
  useCreateTopic,
  useDeleteTopic,
} from '../hooks/useProblems';
import { useAuth } from '../context/AuthContext';

import {
  LayoutDashboard,
  FolderOpen,
  ListTodo,
  BookOpen,
  Map,
  Brain,
  CalendarCheck,
  BarChart3,
  Plus,
  ChevronRight,
  Loader2,
  Trash2,
  LogOut,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/topics', label: 'Topics', icon: FolderOpen },
  { to: '/problems', label: 'All Problems', icon: ListTodo },
  { to: '/question-bank', label: 'Question Bank', icon: BookOpen },
  { to: '/roadmap', label: 'Smart Roadmap', icon: Map },
  { to: '/weakness', label: 'Weakness Analysis', icon: Brain },
  { to: '/revision', label: 'Smart Revision', icon: CalendarCheck },
  { to: '/analytics', label: 'Progress Analytics', icon: BarChart3 },
];

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const [newTopic, setNewTopic] = useState('');
  const [showInput, setShowInput] = useState(false);

  const { user, logout } = useAuth();
  const { data: topicsData } = useTopics();
  const createTopic = useCreateTopic();
  const deleteTopic = useDeleteTopic();
  const navigate = useNavigate();

  const topics = topicsData?.topics || [];

  const handleAddTopic = async (event) => {
    event.preventDefault();
    if (!newTopic.trim()) return;

    try {
      await createTopic.mutateAsync(newTopic.trim());
      setNewTopic('');
      setShowInput(false);
    } catch (error) {
      console.error('Could not create topic:', error);
    }
  };

  const handleDeleteTopic = async (event, topic) => {
    event.stopPropagation();

    try {
      await deleteTopic.mutateAsync(topic);
    } catch (error) {
      console.error('Could not delete topic:', error);
    }
  };

  async function handleLogout() {
    onClose();
    await logout();
    navigate('/login');
  }

  const openTopic = (topic) => {
    navigate(`/topics/${encodeURIComponent(topic)}`);
    onClose();
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-[100dvh] w-[min(82vw,300px)] shrink-0 flex-col
          border-r border-[#333333] bg-[#111111]
          transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-64 lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between border-b border-[#333333] px-5 py-4">
          <span className="font-mono text-base font-bold tracking-wider text-[#FFD700]">
            KONOHA DSA
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-white hover:bg-[#292929] lg:hidden"
          >
            <X size={21} />
          </button>
        </div>

        <div className="border-b border-[#333333] px-5 py-3">
          <p className="truncate text-sm font-semibold text-white">
            {user?.name}
          </p>
          <p className="truncate text-xs text-zinc-400">
            {user?.email}
          </p>
          <span className="text-xs text-[#FFD700]">
            {user?.role}
          </span>
        </div>

        <nav className="space-y-1 px-3 py-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? 'bg-[#FFD700]/10 text-[#FFD700]'
                    : 'text-zinc-300 hover:bg-[#252525] hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 pb-2 pt-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Topics
          </p>
        </div>

        <div className="mt-1 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {topics.map((topic) => (
            <div
              key={topic}
              className="group flex items-center rounded-lg hover:bg-[#252525]"
            >
              <button
                onClick={() => openTopic(topic)}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:text-white"
              >
                <span className="truncate">{topic}</span>
                <ChevronRight size={14} className="shrink-0" />
              </button>

              <button
                onClick={(event) => handleDeleteTopic(event, topic)}
                disabled={deleteTopic.isPending}
                title="Delete topic"
                aria-label={`Delete ${topic}`}
                className="mr-1 rounded p-2 text-zinc-400 hover:text-red-400 disabled:opacity-50 lg:opacity-0 lg:group-hover:opacity-100"
              >
                {deleteTopic.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-[#333333] px-3 py-3">
          {showInput ? (
            <form onSubmit={handleAddTopic} className="flex gap-2">
              <input
                autoFocus
                value={newTopic}
                onChange={(event) => setNewTopic(event.target.value)}
                placeholder="Topic name..."
                className="min-w-0 flex-1 rounded-lg border border-[#454545] bg-[#222222] px-3 py-2 text-sm text-white outline-none focus:border-[#FFD700]"
                disabled={createTopic.isPending}
              />

              <button
                type="submit"
                disabled={createTopic.isPending}
                className="rounded-lg bg-[#FFD700] px-3 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                {createTopic.isPending ? '...' : 'Add'}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-[#252525] hover:text-[#FFD700]"
            >
              <Plus size={15} />
              Add custom topic
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

