import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTopics, useCreateTopic, useDeleteTopic } from '../hooks/useProblems';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderOpen,
  ListTodo,
  Plus,
  ChevronRight,
  Loader2,
  Trash2,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/topics', label: 'Topics', icon: FolderOpen },
  { to: '/problems', label: 'All Problems', icon: ListTodo },
];

export default function Sidebar() {
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
    await logout();
    navigate('/login');
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-card border-r border-border">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <span className="font-bold text-accent text-base tracking-wider font-mono">
          KONOHA DSA
        </span>
      </div>

      <div className="px-5 py-3 border-b border-border">
        <p className="text-sm text-text font-medium truncate">{user?.name}</p>
        <p className="text-xs text-muted truncate">{user?.email}</p>
        <span className="text-xs text-accent">{user?.role}</span>
      </div>

      <nav className="px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-text hover:bg-tag-bg'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 pt-3 pb-1">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">
          Topics
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5 mt-1">
        {topics.map((topic) => (
          <div
            key={topic}
            className="flex items-center group rounded-lg hover:bg-tag-bg"
          >
            <button
              onClick={() => navigate(`/topics/${encodeURIComponent(topic)}`)}
              className="flex-1 flex items-center justify-between px-3 py-1.5 text-sm text-muted group-hover:text-text"
            >
              <span className="truncate">{topic}</span>
              <ChevronRight size={13} className="opacity-0 group-hover:opacity-100" />
            </button>

            <button
              onClick={(event) => handleDeleteTopic(event, topic)}
              disabled={deleteTopic.isPending}
              title="Delete topic"
              className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 text-muted hover:text-danger rounded"
            >
              {deleteTopic.isPending
                ? <Loader2 size={12} className="animate-spin" />
                : <Trash2 size={12} />}
            </button>
          </div>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-border">
        {showInput ? (
          <form onSubmit={handleAddTopic} className="flex gap-2">
            <input
              autoFocus
              value={newTopic}
              onChange={(event) => setNewTopic(event.target.value)}
              placeholder="Topic name..."
              className="input-field flex-1 py-1.5"
              disabled={createTopic.isPending}
            />
            <button type="submit" className="btn-primary px-3 py-1.5">
              {createTopic.isPending ? '...' : 'Add'}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-accent rounded-lg hover:bg-tag-bg"
          >
            <Plus size={14} />
            Add custom topic
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-danger"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </aside>
  );
}