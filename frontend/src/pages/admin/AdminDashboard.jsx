import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Code2, CheckCircle } from 'lucide-react';
import { getAdminDashboard } from '../../lib/api';

export default function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
  });

  if (isLoading) return <p className="text-muted">Loading admin dashboard...</p>;
  if (isError) return <p className="text-red-400">Could not load dashboard.</p>;

  const cards = [
    { label: 'Total Users', value: data.totalUsers, icon: Users },
    { label: 'Active Users', value: data.activeUsers, icon: UserCheck },
    { label: 'Total Problems', value: data.totalProblems, icon: Code2 },
    { label: 'Solved Problems', value: data.solvedProblems, icon: CheckCircle },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-text">Admin Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Overview of all registered users and their DSA activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div className="card" key={label}>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted">{label}</p>
              <Icon size={19} className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-text mt-4">{value}</p>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-text">Recently registered users</h2>
          <Link to="/admin/users" className="text-accent text-sm hover:underline">
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted border-b border-border">
              <tr>
                <th className="py-3">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Problems</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.users.slice(0, 8).map((user) => (
                <tr key={user.id} className="border-b border-border/60">
                  <td className="py-3 text-text">{user.name}</td>
                  <td className="text-muted">{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user._count.problems}</td>
                  <td className={user.isActive ? 'text-green-400' : 'text-red-400'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </td>
                </tr>
              ))}
              {!data.users.length && (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-muted">
                    No registered users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}