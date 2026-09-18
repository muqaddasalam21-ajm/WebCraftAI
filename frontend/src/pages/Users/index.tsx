import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit3, ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, History, FolderKanban, ShoppingBag, Bell, Activity } from 'lucide-react';
import { User, UserRole, UserStatus } from '../../types';
import { Badge, BadgeVariant } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { userService } from '../../services/userService';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Activity History Modal
  const [activityUser, setActivityUser] = useState<User | null>(null);
  const [activityData, setActivityData] = useState<{
    orders: any[];
    projects: any[];
    notifications: any[];
    auditLogs: any[];
  } | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getUsers({
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        page,
        limit: 8
      });
      setUsers(data.users);
      setTotalUsers(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter, sortBy, page]);

  const handleOpenActivity = async (user: User) => {
    setActivityUser(user);
    setIsActivityModalOpen(true);
    setIsLoadingActivity(true);
    setActivityData(null);
    try {
      const res = await userService.getUserDetails(user.id);
      setActivityData(res.activity);
    } catch (err: any) {
      console.error('Failed to load user activity:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSaving(true);
    setError(null);
    try {
      await userService.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status,
        phone: editingUser.profile?.phone
      });
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Error updating user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;
    setIsSaving(true);
    setError(null);
    try {
      await userService.deleteUser(deletingUser.id);
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Error deleting user.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleVariant = (role: UserRole): BadgeVariant => {
    switch (role) {
      case 'Admin': return 'primary';
      case 'Manager': return 'info';
      case 'Vendor': return 'warning';
      case 'User': return 'neutral';
      default: return 'neutral';
    }
  };

  const getStatusVariant = (status: UserStatus): BadgeVariant => {
    return status === 'Active' ? 'success' : 'danger';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">User Management &amp; RBAC</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated platform accounts, assign security roles, and inspect real user lifecycle history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl outline-none"
          >
            <option value="All">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="vendor">Vendor</option>
            <option value="user">User (Customer)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Joined Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-semibold">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading persistent database records...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-semibold">
                  No user records match your search query or filters.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-pink text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{user.name}</p>
                        <p className="text-[11px] text-slate-400 font-normal">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={getRoleVariant(user.role)} size="sm">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={getStatusVariant(user.status)} size="sm">
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {user.joinedDate || 'Recent'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenActivity(user)}
                      className="p-1.5 text-brand-700 hover:text-brand-800 hover:bg-brand-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      title="View real account activity and lifecycle history"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Activity</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeletingUser(user);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({totalUsers} total users)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(p => p + 1)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Real Account Activity & History Modal */}
      {isActivityModalOpen && activityUser && (
        <Modal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          title={`Account Activity: ${activityUser.name}`}
          subtitle={`Real Persistent Activity Ledger · ${activityUser.email} (${activityUser.role})`}
        >
          <div className="space-y-5 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
            {isLoadingActivity ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mx-auto mb-2" />
                <span className="text-slate-500 font-semibold">Fetching persistent activity records...</span>
              </div>
            ) : activityData ? (
              <>
                {/* User Summary Box */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Orders</span>
                    <span className="text-base font-black text-slate-900">{activityData.orders?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Projects</span>
                    <span className="text-base font-black text-slate-900">{activityData.projects?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Notifications</span>
                    <span className="text-base font-black text-slate-900">{activityData.notifications?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Audit Events</span>
                    <span className="text-base font-black text-slate-900">{activityData.auditLogs?.length || 0}</span>
                  </div>
                </div>

                {/* 1. Projects */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-xs">
                    <FolderKanban className="w-4 h-4 text-brand-600" />
                    Associated Projects ({activityData.projects?.length || 0})
                  </h4>
                  {activityData.projects && activityData.projects.length > 0 ? (
                    <div className="space-y-1.5">
                      {activityData.projects.map((p: any) => (
                        <div key={p.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-slate-900">{p.projectNumber}</span>
                            <span className="text-slate-600 ml-2 font-semibold">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-semibold">{p.progress}%</span>
                            <Badge variant={p.status === 'COMPLETED' ? 'success' : 'info'} size="sm">
                              {p.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic p-2 bg-slate-50 rounded-lg">No projects linked to this user.</p>
                  )}
                </div>

                {/* 2. Orders */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-xs">
                    <ShoppingBag className="w-4 h-4 text-brand-600" />
                    Orders History ({activityData.orders?.length || 0})
                  </h4>
                  {activityData.orders && activityData.orders.length > 0 ? (
                    <div className="space-y-1.5">
                      {activityData.orders.map((o: any) => (
                        <div key={o.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-slate-900">{o.orderNumber}</span>
                            <span className="text-slate-600 ml-2 capitalize">({o.type.replace('_', ' ')})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">${o.amount}</span>
                            <Badge variant={o.paymentStatus === 'PAID' ? 'success' : 'warning'} size="sm">
                              {o.paymentStatus}
                            </Badge>
                            <Badge variant="neutral" size="sm">{o.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic p-2 bg-slate-50 rounded-lg">No orders placed by this user.</p>
                  )}
                </div>

                {/* 3. Audit Events Timeline */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-xs">
                    <History className="w-4 h-4 text-brand-600" />
                    Audit Logs &amp; Events ({activityData.auditLogs?.length || 0})
                  </h4>
                  {activityData.auditLogs && activityData.auditLogs.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {activityData.auditLogs.map((l: any) => (
                        <div key={l.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-brand-700">{l.action}</span>
                            <span className="text-slate-400 text-[10px]">{new Date(l.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5">{l.details}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic p-2 bg-slate-50 rounded-lg">No audit events recorded for this user.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-center py-4">No activity data available.</p>
            )}

            <div className="pt-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsActivityModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit User Account"
          subtitle={`Modifying record ID: ${editingUser.id}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Vendor">Vendor</option>
                  <option value="User">User (Customer)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Confirmation Modal */}
      {isDeleteModalOpen && deletingUser && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm User Account Deletion"
          subtitle="Irreversible Database Operation"
        >
          <div className="space-y-4 py-2 text-xs">
            <p className="text-slate-600">
              Are you sure you want to permanently delete the account for{' '}
              <strong>{deletingUser.name} ({deletingUser.email})</strong>?
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-semibold">
              ⚠️ Warning: This will permanently remove their database entry. The platform will block deletion if this is the only remaining Administrator.
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isSaving}
                onClick={handleDeleteSubmit}
              >
                Permanently Delete User
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
