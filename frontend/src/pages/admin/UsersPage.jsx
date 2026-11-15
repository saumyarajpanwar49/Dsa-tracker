import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminUsers,
  updateUserRole,
  updateUserStatus,
  updateUserPermanentAccess,
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  });

  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateUserStatus(id, isActive),
    onSuccess: refreshUsers,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onSuccess: refreshUsers,
  });

  const permanentAccessMutation = useMutation({
    mutationFn: ({ id, enabled }) =>
      updateUserPermanentAccess(id, enabled),
    onSuccess: refreshUsers,
  });

  const mutationError =
    statusMutation.error ||
    roleMutation.error ||
    permanentAccessMutation.error;

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

      {mutationError && (
        <p className="text-sm text-red-400">
          {mutationError.response?.data?.error || 'Action failed. Please try again.'}
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
              <th className="pr-4">Subscription</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((item) => {
              const isSelf = item.id === currentUser?.id;
              const isAdmin = item.role === 'ADMIN';
              const isBusy =
                statusMutation.isPending ||
                roleMutation.isPending ||
                permanentAccessMutation.isPending;

              return (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="py-4 pr-4">
                    <p className="font-medium text-text">{item.name}</p>
                    <p className="text-xs text-muted">{item.email}</p>
                  </td>

                  <td className="pr-4">{item.role}</td>

                  <td className="pr-4">
                    {item._count?.problems ?? 0}
                  </td>

                  <td className={`pr-4 ${item.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </td>

                  <td className="pr-4">
                    {isAdmin ? (
                      <span className="text-green-400">Admin access</span>
                    ) : item.hasPermanentAccess ? (
                      <span className="text-green-400">Permanent free</span>
                    ) : item.accessExpiresAt &&
                      new Date(item.accessExpiresAt) > new Date() ? (
                      <span className="text-blue-400">Paid access</span>
                    ) : item.trialStartedAt &&
                      Date.now() <
                        new Date(item.trialStartedAt).getTime() + 15 * 60 * 1000 ? (
                      <span className="text-yellow-400">Free trial</span>
                    ) : item.trialStartedAt ? (
                      <span className="text-red-400">Expired</span>
                    ) : (
                      <span className="text-muted">Legacy access</span>
                    )}
                  </td>

                  <td>
                    <div className="flex flex-wrap gap-2 min-w-48">
                      {!isSelf && (
                        <>
                          <button
                            className="btn-secondary text-xs"
                            disabled={isBusy}
                            onClick={() =>
                              roleMutation.mutate({
                                id: item.id,
                                role: isAdmin ? 'USER' : 'ADMIN',
                              })
                            }
                          >
                            {isAdmin ? 'Make User' : 'Make Admin'}
                          </button>

                          <button
                            className="btn-secondary text-xs"
                            disabled={isBusy}
                            onClick={() =>
                              statusMutation.mutate({
                                id: item.id,
                                isActive: !item.isActive,
                              })
                            }
                          >
                            {item.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          {!isAdmin && (
                            <button
                              className="btn-secondary text-xs"
                              disabled={isBusy}
                              onClick={() => {
                                const enabled = !item.hasPermanentAccess;
                                const action = enabled ? 'grant' : 'revoke';

                                if (
                                  window.confirm(
                                    `Are you sure you want to ${action} permanent free access for ${item.name}?`
                                  )
                                ) {
                                  permanentAccessMutation.mutate({
                                    id: item.id,
                                    enabled,
                                  });
                                }
                              }}
                            >
                              {item.hasPermanentAccess
                                ? 'Revoke Permanent'
                                : 'Grant Permanent'}
                            </button>
                          )}
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