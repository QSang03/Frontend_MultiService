"use client";

import React, { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { UserRole } from '@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/auth_pb.js';
import { useToast } from '@/components/ui';

type User = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: number | string;
  roleLabel?: string;
  isActive?: boolean;
  departmentId?: string;
  organizationId?: string;
};

type Department = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onSaved?: (user: User) => void;
};

export default function EditUserModal({ open, user, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setRole(String(user.role || ""));
    setDepartmentId(user.departmentId || user.organizationId || "");
    setPassword("");
    setError(null);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    const loadDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const res = await fetch('/api/admin/departments?page_size=200');
        const data = await res.json();
        if (mounted && res.ok) {
          setDepartments((data.departments || []).map((d: unknown) => {
            const dd = d as Record<string, unknown>;
            return { id: String(dd.id ?? ''), name: String(dd.name ?? '') };
          }));
        }
      } catch {
        // ignore errors; allow manual id entry or fallback
      } finally {
        if (mounted) setIsLoadingDepartments(false);
      }
    };

    loadDepartments();
    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !user?.departmentId) return;
    let mounted = true;
    const loadDepartmentName = async () => {
      try {
        const res = await fetch(`/api/admin/departments?department_id=${encodeURIComponent(user.departmentId as string)}`);
        const data = await res.json();
        if (!mounted || !res.ok || !data?.department) return;
        setDepartments((prev) => {
          const exists = prev.some((d) => d.id === data.department.id);
          if (exists) return prev;
          return [...prev, { id: data.department.id, name: data.department.name }];
        });
      } catch {
        // ignore errors
      }
    };

    loadDepartmentName();
    return () => {
      mounted = false;
    };
  }, [open, user?.departmentId]);

  const toast = useToast();

  if (!open || !user) return null;

  const submit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = { user_id: user.id };
      if (fullName) body.full_name = fullName;
      if (phone) body.phone = phone;
      if (role) body.role = Number(role);
      if (password) body.password = password;
      if (departmentId) body.department_id = departmentId;

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || 'Failed to update user';
        toast.addToast(typeof msg === 'string' ? msg : 'Failed to update user', { type: 'error' });
        throw new Error(msg);
      }

      if (data.user && onSaved) onSaved(data.user);
      toast.addToast('User updated', { type: 'success' });
      onClose();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setError(m);
      toast.addToast(m, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Personnel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">Select role</option>
                {(() => {
                  try {
                    const names = Object.keys(UserRole).filter((k) => isNaN(Number(k)));
                    return names.map((name) => {
                      const val = (UserRole as Record<string, unknown>)[name];
                      return (
                        <option key={name} value={String(val ?? '')}>
                          {name.replace(/_/g, ' ')}
                        </option>
                      );
                    });
                  } catch {
                    return null;
                  }
                })()}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Department</span>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {isLoadingDepartments && (
                <p className="mt-1 text-xs text-gray-500">Loading departments...</p>
              )}
            </label>
          </div>

          <Input label="Password (leave blank to keep current)" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={onClose} size="md">Cancel</Button>
            <Button onClick={submit} isLoading={isSubmitting} size="md">Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
