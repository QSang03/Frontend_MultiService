'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AddDepartmentModal from '@/components/AddDepartmentModal';
import EditDepartmentModal from '@/components/EditDepartmentModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { cn } from '@/utils';
import { MoreHorizontal, Plus, Search, Building } from 'lucide-react';

export type DepartmentDto = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string | null;
  parentName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function DepartmentTab() {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionDepartmentId, setActionDepartmentId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentDto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DepartmentDto | null>(null);

  const loadDepartments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/departments?page_size=100');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load departments');
      }
      setDepartments(data.departments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  const departmentsById = useMemo(() => {
    const map = new Map<string, DepartmentDto>();
    departments.forEach((d) => map.set(d.id, d));
    return map;
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.code || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q)
      );
    });
  }, [departments, searchQuery]);

  const handleDelete = async (departmentId: string) => {
    try {
      const res = await fetch(`/api/admin/departments?department_id=${encodeURIComponent(departmentId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete department');
      }
      setDepartments((prev) => prev.filter((d) => d.id !== departmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  return (
    <>
      <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Internal Department Structure</h2>
        <p className="text-gray-500 text-sm mt-1">
              Manage organizational units and assign managers.
        </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1e2a4a] rounded-xl p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-1">Departments</p>
                <h3 className="text-2xl font-bold">{departments.length}</h3>
              </div>
              <Building className="w-8 h-8 text-green-400" />
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <div>
                <span className="text-gray-400">Active Units</span>
              </div>
              <span className="font-semibold">{departments.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">Hierarchy Coverage</p>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{departments.filter((d) => !d.parentId).length}</p>
              <p className="text-sm text-gray-500 mt-1">Top-level Departments</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">Recently Updated</p>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-500">
                {departments.filter((d) => d.updatedAt || d.createdAt).length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Departments with timestamps</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 text-sm text-red-600 border-b border-gray-100">{error}</div>
          )}

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Department
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Code
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Parent
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Description
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Updated
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
                    Loading departments...
                  </td>
                </tr>
              )}
              {!isLoading && filteredDepartments.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                    No departments found.
                  </td>
                </tr>
              )}
              {!isLoading && filteredDepartments.map((dep) => (
                <tr key={dep.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-blue-600">
                        {dep.name?.[0]?.toUpperCase() || 'D'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{dep.name}</p>
                        <p className="text-sm text-gray-500">ID: {dep.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">{dep.code || '-'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn('text-sm', dep.parentId ? 'text-gray-900' : 'text-gray-500')}>
                      {dep.parentName || (dep.parentId ? departmentsById.get(dep.parentId)?.name || dep.parentId : '-')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">
                      {dep.description ? dep.description : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500">{formatDate(dep.updatedAt || dep.createdAt)}</span>
                  </td>
                  <td className="px-4 py-4 relative">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      onClick={() => setActionDepartmentId((prev) => (prev === dep.id ? null : dep.id))}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {actionDepartmentId === dep.id && (
                      <div className="absolute right-4 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-10">
                        <button
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                          onClick={() => {
                            setEditingDepartment(dep);
                            setShowEditModal(true);
                            setActionDepartmentId(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                          onClick={() => {
                            setConfirmDelete(dep);
                            setActionDepartmentId(null);
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

      <AddDepartmentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        onCreated={(department) => {
          const d = department as Record<string, unknown>;
          const newDept: DepartmentDto = {
            id: String(d.id ?? d.departmentId ?? d.department_id ?? ''),
            name: String(d.name ?? ''),
            code: d.code == null ? undefined : String(d.code),
            description: d.description == null ? undefined : String(d.description),
            parentId: (d.parentId ?? d.parent_id ?? null) as string | null | undefined,
            parentName: (d.parentName ?? d.parent_name ?? null) as string | null | undefined,
            createdAt: d.createdAt as string | undefined,
            updatedAt: d.updatedAt as string | undefined,
          };
          setDepartments((prev) => [newDept, ...prev]);
        }}
      />

      <EditDepartmentModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDepartment(null);
        }}
        department={editingDepartment}
        departments={departments.map((dn) => ({ id: dn.id, name: dn.name }))}
        onUpdated={(department) => {
          const d = department as Record<string, unknown>;
          const updated: DepartmentDto = {
            id: String(d.id ?? d.departmentId ?? d.department_id ?? ''),
            name: String(d.name ?? ''),
            code: d.code == null ? undefined : String(d.code),
            description: d.description == null ? undefined : String(d.description),
            parentId: (d.parentId ?? d.parent_id ?? null) as string | null | undefined,
            parentName: (d.parentName ?? d.parent_name ?? null) as string | null | undefined,
            createdAt: d.createdAt as string | undefined,
            updatedAt: d.updatedAt as string | undefined,
          };
          setDepartments((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        }}
      />

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Department"
        description={`Delete ${confirmDelete?.name || ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await handleDelete(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </>
  );
}
