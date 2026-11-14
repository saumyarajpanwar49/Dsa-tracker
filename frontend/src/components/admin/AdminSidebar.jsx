import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
  ];

  return (
    <aside className="w-64 shrink-0 h-full flex flex-col bg-card border-r border-border">
      <div className="p-5 border-b border-border">
        <h1 className="font-bold text-accent text-lg">KONOHA DSA</h1>
        <p className="text-xs text-muted mt-1">Administrator Panel</p>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-text hover:bg-tag-bg'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-sm text-text font-medium truncate">{user?.name}</p>
        <p className="text-xs text-muted truncate">{user?.email}</p>

        <button
          onClick={handleLogout}
          className="mt-4 flex items-center gap-2 text-sm text-muted hover:text-danger"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </aside>
  );
}