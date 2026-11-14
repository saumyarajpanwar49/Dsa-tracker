import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, updateUserRole, updateUserStatus } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  if (isLoading) return <p className="text-muted">Loading users...</p>;
  if (isError) return <p className="text-red-400">Could not load users.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">User Management</h1>
        <p className="text-sm text-muted mt-1">
          View users, manage access, and assign administrator roles.
        </p>
      </div>

      {(statusMutation.isError || roleMutation.isError) && (
        <p className="text-sm text-red-400">
          {statusMutation.error?.response?.data?.error ||
            roleMutation.error?.response?.data?.error ||
            'Action failed'}
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-muted border-b border-border">
            <tr>
              <th className="py-3 pr-4">User</th>
              <th className="pr-4">Role</th>
              <th className="pr-4">Problems</th>
              <th className="pr-4">Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((item) => {
              const isSelf = item.id === currentUser.id;

              return (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="py-4 pr-4">
                    <p className="font-medium text-text">{item.name}</p>
                    <p className="text-xs text-muted">{item.email}</p>
                  </td>

                  <td className="pr-4">{item.role}</td>
                  <td className="pr-4">{item._count.problems}</td>

                  <td className={`pr-4 ${item.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </td>

                  <td>
                    <div className="flex flex-wrap gap-2">
                      {!isSelf && (
                        <>
                          <button
                            className="btn-secondary text-xs"
                            disabled={roleMutation.isPending}
                            onClick={() =>
                              roleMutation.mutate({
                                id: item.id,
                                role: item.role === 'ADMIN' ? 'USER' : 'ADMIN',
                              })
                            }
                          >
                            {item.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
                          </button>

                          <button
                            className="btn-secondary text-xs"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                id: item.id,
                                isActive: !item.isActive,
                              })
                            }
                          >
                            {item.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                      {isSelf && (
                        <span className="text-xs text-muted">Your account</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!users.length && (
          <p className="text-center text-muted py-8">No users found.</p>
        )}
      </div>
    </div>
  );
}