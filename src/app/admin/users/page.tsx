'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAuthReady } from '@/lib/auth/ensure-auth-ready';
import AddUserModal from '@/components/AddUserModal';
import EditUserModal from '@/components/EditUserModal';
import DepartmentTab from '@/components/dashboard/DepartmentTab';
import { TopHeader } from '@/components/layout';
import { 
  Search, 
  UserPlus, 
  Shield, 
  Users, 
  Lock, 
  GitMerge,
  MoreHorizontal,
  Download,
  Check,
  Building,
  Loader2
} from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils';

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: number | string;
  roleLabel?: string;
  isActive?: boolean;
  lastActive?: string;
  departmentId?: string;
  organizationId?: string;
};

const tabs = [
  { id: 'users', label: 'User List', icon: Users },
  { id: 'departments', label: 'Departments', icon: Building },
  { id: 'rbac', label: 'RBAC Assignment', icon: Lock },
  { id: 'merge', label: 'Identity Merge', icon: GitMerge },
];

export default function UserRBACPage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isSavingRBAC, setIsSavingRBAC] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<AdminUser | null>(null);
  const [confirmStatusUser, setConfirmStatusUser] = useState<AdminUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authReady = await ensureAuthReady();
      if (!authReady) { router.replace('/login'); return; }
      const res = await fetch('/api/admin/users?page_size=100');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load users');
      }
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const tab = sp.get('tab');
      if (tab && ['users', 'departments', 'rbac', 'merge'].includes(tab)) {
        setActiveTab(tab as 'users' | 'departments' | 'rbac' | 'merge');
      }
    } catch {
      // ignore on server/prerender
    }
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        String(user.roleLabel || user.role || '').toLowerCase().includes(query)
      );
    });
  }, [searchQuery, users]);

  const getRoleBadgeClass = (roleLabel?: string) => {
    const label = (roleLabel || '').toLowerCase();
    if (label.includes('system') || label.includes('admin')) return 'bg-red-500 text-white';
    if (label.includes('manager')) return 'bg-gray-200 text-gray-700';
    if (label.includes('tech')) return 'bg-blue-100 text-blue-700';
    if (label.includes('tenant')) return 'bg-orange-500 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  function formatLastActive(iso?: string | null) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      const diff = Date.now() - d.getTime();
      if (isNaN(diff) || diff < 0) return d.toLocaleString();
      const sec = Math.floor(diff / 1000);
      if (sec < 60) return 'just now';
      if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
      if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
      return d.toLocaleDateString();
    } catch {
      return '-';
    }
  }

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          is_active: !user.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update status');
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete user');
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleSaveRBAC = async () => {
    setIsSavingRBAC(true);
    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      addToast('RBAC Matrix updated successfully', { type: 'success' });
    } catch {
      addToast('Failed to save changes', { type: 'error' });
    } finally {
      setIsSavingRBAC(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader title="User & RBAC" />

      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User & Identity Management</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage personnel lifecycles, RBAC matrices, and identity merging.
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus className="w-4 h-4" />
            Add Personnel
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'users' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* RBAC Security Level Card */}
              <div className="bg-[#1e2a4a] rounded-xl p-5 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">RBAC Security Level</p>
                    <h3 className="text-2xl font-bold">Strict (L3)</h3>
                  </div>
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <div>
                    <span className="text-gray-400">Scopes Defined</span>
                  </div>
                  <span className="font-semibold">142</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <div>
                    <span className="text-gray-400">Roles</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
              </div>

              {/* Active Tech Staff Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500 mb-2">Active Tech Staff</p>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">24</p>
                  <p className="text-sm text-gray-500 mt-1">Field Technicians Online</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-green-600">92% Availability</span>
                  </div>
                </div>
              </div>

              {/* Pending Verifications Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500 mb-2">Pending Verifications</p>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-500">5</p>
                  <p className="text-sm text-gray-500 mt-1">Guest Accounts pending review</p>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2">
                    Go to Merge Tool
                  </button>
                </div>
              </div>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Table Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                    Filter Role
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 text-sm text-red-600 border-b border-gray-100">{error}</div>
              )}

              {/* Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      User
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Contact
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Role
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Last Active
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                        Loading users...
                      </td>
                    </tr>
                  )}
                  {!isLoading && filteredUsers.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                        No users found.
                      </td>
                    </tr>
                  )}
                  {!isLoading && filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium',
                              user.isActive ? 'bg-blue-600' : 'bg-gray-400'
                            )}
                          >
                            {(user.fullName || user.email || 'U')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.fullName || user.email}</p>
                            <p className="text-sm text-gray-500">{user.roleLabel || user.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.phone || '-'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded-full',
                            getRoleBadgeClass(user.roleLabel)
                          )}
                        >
                          {user.roleLabel || user.role || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              user.isActive ? 'bg-green-500' : 'bg-yellow-500'
                            )}
                          ></span>
                          <span
                            className={cn(
                              'text-sm capitalize',
                              user.isActive ? 'text-green-600' : 'text-yellow-600'
                            )}
                          >
                            {user.isActive ? 'active' : 'inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-500">
                          {formatLastActive(user.lastActive || ((user as unknown as Record<string, unknown>).last_active as string | undefined))}
                        </span>
                      </td>
                      <td className="px-4 py-4 relative">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          onClick={() => setActionUserId((prev) => (prev === user.id ? null : user.id))}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {actionUserId === user.id && (
                          <div className="absolute right-4 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-10">
                              <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowEditModal(true);
                                  setActionUserId(null);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                onClick={() => {
                                  setConfirmStatusUser(user);
                                  setActionUserId(null);
                                }}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                                onClick={() => {
                                  setConfirmDeleteUser(user);
                                  setActionUserId(null);
                                }}
                              >
                                Delete
                              </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <AddUserModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={(u) => {
            const uu = u as Record<string, unknown>;
            const newUser: AdminUser = {
              id: String(uu.id ?? ''),
              fullName: String(uu.fullName ?? uu.email ?? '-'),
              email: String(uu.email ?? ''),
              phone: uu.phone == null ? undefined : String(uu.phone),
              role: uu.role as number | string | undefined,
              roleLabel: uu.roleLabel == null ? (typeof uu.role === 'string' ? String(uu.role) : undefined) : String(uu.roleLabel),
              isActive: (() => {
                if (typeof uu.isActive === 'boolean') return uu.isActive as boolean;
                if (typeof uu.is_active === 'boolean') return uu.is_active as boolean;
                return true;
              })(),
              lastActive: (uu.lastActive ?? uu.last_login_at ?? uu.lastLoginAt) as string | undefined,
              departmentId: (uu.departmentId ?? uu.department_id ?? uu.organizationId) as string | undefined,
              organizationId: uu.organizationId as string | undefined,
            };
            setUsers((prev) => [newUser, ...prev]);
          }}
        />

        <EditUserModal
          open={showEditModal}
          user={editingUser}
          onClose={() => setShowEditModal(false)}
          onSaved={(u) => {
            setUsers((prev) => prev.map((p) => (p.id === u.id ? u : p)));
            setShowEditModal(false);
            setEditingUser(null);
          }}
        />

        {activeTab === 'departments' && <DepartmentTab />}

        {activeTab === 'rbac' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Role-Based Access Control (RBAC) Matrix</h3>
              <p className="text-sm text-gray-500">Click on the permissions table to toggle scopes for specific roles. Changes are audited.</p>
            </div>
            
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-sm font-semibold text-gray-700 pb-4 pr-8">Permission Scope</th>
                    <th className="text-center text-sm font-semibold text-gray-700 pb-4 px-6">System Admin</th>
                    <th className="text-center text-sm font-semibold text-gray-700 pb-4 px-6">Manager</th>
                    <th className="text-center text-sm font-semibold text-gray-700 pb-4 px-6">Sale</th>
                    <th className="text-center text-sm font-semibold text-gray-700 pb-4 px-6">Tech</th>
                  </tr>
                </thead>
                <tbody>
                  {/* View Financial Reports */}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 pr-8">
                      <div>
                        <p className="text-sm font-medium text-gray-900">View Financial Reports</p>
                        <p className="text-xs text-gray-500 mt-0.5">finance.read</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                  </tr>

                  {/* Approve Payouts */}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 pr-8">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Approve Payouts</p>
                        <p className="text-xs text-gray-500 mt-0.5">finance.write</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                  </tr>

                  {/* Dispatch Tickets */}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 pr-8">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Dispatch Tickets</p>
                        <p className="text-xs text-gray-500 mt-0.5">ticket.assign</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                  </tr>

                  {/* Process Tickets (Mobile) */}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 pr-8">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Process Tickets (Mobile)</p>
                        <p className="text-xs text-gray-500 mt-0.5">ticket.execute</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Onboard Staff */}
                  <tr>
                    <td className="py-4 pr-8">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Onboard Staff</p>
                        <p className="text-xs text-gray-500 mt-0.5">user.create</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded bg-gray-100"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleSaveRBAC}
                  disabled={isSavingRBAC}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#1e2a4a] rounded-lg hover:bg-[#2a3a5a] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isSavingRBAC && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSavingRBAC ? 'Saving Changes...' : 'Save Matrix Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'merge' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identity Merge Tool */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Identity Merge Tool (B2C)</h3>
                <p className="text-sm text-gray-500">Merge &apos;Guest Accounts&apos; into &apos;Official Accounts&apos; based on phone number matching. This preserves history while upgrading the user.</p>
              </div>
              
              <div className="p-6">
                {/* Conflict Detected Badge */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                    CONFLICT DETECTED
                  </span>
                  <button className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                    Ignore
                  </button>
                </div>

                <p className="text-sm font-semibold text-gray-900 mb-4">Phone: 0909***123</p>

                {/* Two Profile Cards with merge icon */}
                <div className="relative mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Guest Profile */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 mb-3">GUEST PROFILE</p>
                      <h4 className="text-base font-bold text-gray-900 mb-1">Nguyen Van A</h4>
                      <p className="text-xs text-gray-500 mb-2">Last active: Yesterday</p>
                      <p className="text-xs text-gray-600">Tickets: <span className="font-semibold">1</span></p>
                    </div>

                    {/* Official Profile */}
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <p className="text-xs font-semibold text-blue-600 mb-3">OFFICIAL PROFILE</p>
                      <h4 className="text-base font-bold text-gray-900 mb-1">Nguyễn Văn An</h4>
                      <p className="text-xs text-gray-500 mb-2">Registered: Today</p>
                      <p className="text-xs text-gray-600">Verified: <span className="font-semibold">SMS OTP</span></p>
                    </div>
                  </div>
                  
                  {/* Merge Icon - positioned absolutely in the center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center shadow-md">
                      <GitMerge className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <button className="w-full px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  Confirm Merge & Sync History
                </button>
              </div>
            </div>

            {/* Merge History Log */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Merge History Log</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {/* History Entry 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Merged Guest (0912***) into User #882</p>
                      <p className="text-xs text-gray-500 mt-0.5">10 mins ago • System Auto</p>
                    </div>
                  </div>

                  {/* History Entry 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Merged Guest (0968***) into User #121</p>
                      <p className="text-xs text-gray-500 mt-0.5">2 hours ago • Admin</p>
                    </div>
                  </div>

                  {/* History Entry 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Conflict resolved manually for User #991</p>
                      <p className="text-xs text-gray-500 mt-0.5">1 day ago • Manager</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmDeleteUser}
        title="Delete user"
        description={`Delete ${confirmDeleteUser?.fullName || confirmDeleteUser?.email || 'this user'}? This action cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => setConfirmDeleteUser(null)}
        onConfirm={async () => {
          if (confirmDeleteUser) {
            await handleDeleteUser(confirmDeleteUser.id);
            setConfirmDeleteUser(null);
          }
        }}
      />

      <ConfirmModal
        open={!!confirmStatusUser}
        title={confirmStatusUser?.isActive ? 'Deactivate user' : 'Activate user'}
        description={`Are you sure you want to ${confirmStatusUser?.isActive ? 'deactivate' : 'activate'} ${confirmStatusUser?.fullName || confirmStatusUser?.email || 'this user'}?`}
        confirmLabel={confirmStatusUser?.isActive ? 'Deactivate' : 'Activate'}
        onClose={() => setConfirmStatusUser(null)}
        onConfirm={async () => {
          if (confirmStatusUser) {
            await handleToggleStatus(confirmStatusUser);
            setConfirmStatusUser(null);
          }
        }}
      />
    </div>
  );
}
