import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTopics, useCreateTopic, useDeleteTopic } from '../hooks/useProblems';
import {
  LayoutDashboard,
  FolderOpen,
  ListTodo,
  Plus,
  ChevronRight,
  BookOpen,
  Loader2,
  Trash2,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/topics', label: 'Topics', icon: FolderOpen },
  { to: '/problems', label: 'All Problems', icon: ListTodo },
];

export default function Sidebar() {
  const [newTopic, setNewTopic] = useState('');
  const [showInput, setShowInput] = useState(false);

  const { data: topicsData } = useTopics();
  const createTopic = useCreateTopic();
  const deleteTopic = useDeleteTopic();
  const navigate = useNavigate();

  const topics = topicsData?.topics || [];
  const customTopics = new Set(topicsData?.custom || []);

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    await createTopic.mutateAsync(newTopic.trim());
    setNewTopic('');
    setShowInput(false);
  };

  const handleDeleteTopic = async (e, topic) => {
    e.stopPropagation();
    await deleteTopic.mutateAsync(topic);
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-card border-r border-border">
      {/* Konoha Leaf Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <svg
          viewBox="0 0 100 100"
          className="w-6 h-6 text-accent fill-none stroke-current stroke-[8]"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Konoha Swirl Spiral Logo */}
          <path d="M 50 35 C 38 35, 33 45, 38 52 C 43 59, 57 59, 62 52 C 67 45, 62 30, 48 24 C 34 18, 18 28, 22 48 C 26 68, 52 78, 68 70 C 80 64, 88 44, 80 30" />
          <path d="M 22 48 L 10 42" />
          <path d="M 80 30 L 90 32" />
        </svg>
        <span className="font-bold text-text text-base tracking-wider font-mono">KONOHA DSA</span>
      </div>

      {/* Nav */}
      <nav className="px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
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
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">Topics</p>
      </div>

      {/* Topics list */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5 mt-1">
        {topics.map((topic) => (
          <div
            key={topic}
            className="flex items-center group rounded-lg hover:bg-tag-bg transition-all duration-150"
          >
            <button
              onClick={() => navigate(`/topics/${encodeURIComponent(topic)}`)}
              className="flex-1 flex items-center justify-between px-3 py-1.5 text-sm text-muted group-hover:text-text"
            >
              <span className="truncate">{topic}</span>
              <ChevronRight
                size={13}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              />
            </button>

            {/* Trash — visible on hover for every topic */}
            <button
              onClick={(e) => handleDeleteTopic(e, topic)}
              disabled={deleteTopic.isPending}
              title="Delete topic"
              className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 text-muted hover:text-danger hover:bg-danger/10 rounded transition-all"
            >
              {deleteTopic.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Add custom topic */}
      <div className="px-3 py-3 border-t border-border">
        {showInput ? (
          <form onSubmit={handleAddTopic} className="flex gap-2">
            <input
              autoFocus
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Topic name..."
              className="input-field flex-1 py-1.5"
              disabled={createTopic.isPending}
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-accent text-bg rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors"
              disabled={createTopic.isPending}
            >
              {createTopic.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-accent rounded-lg hover:bg-tag-bg transition-all"
          >
            <Plus size={14} />
            Add custom topic
          </button>
        )}
      </div>
    </aside>
  );
}
