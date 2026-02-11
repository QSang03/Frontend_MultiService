"use client";

import React, { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { UserPlus } from "lucide-react";
import { UserRole } from '@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/auth_pb.js';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (user: Record<string, unknown>) => void;
};

export default function AddUserModal({ open, onClose, onCreated }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

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
        // ignore
      } finally {
        if (mounted) setIsLoadingDepartments(false);
      }
    };

    loadDepartments();
    return () => {
      mounted = false;
    };
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    setEmailError(null);
    setPhoneError(null);
    setRoleError(null);
    if (!email) return setError("Email is required");
    if (!role) return setError("Role is required");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          full_name: fullName,
          phone,
          role: role ? Number(role) : undefined,
          department_id: departmentId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "Create failed";
        // Map common DB/proto errors to field-level errors
        if (typeof msg === 'string') {
          const lower = msg.toLowerCase();
          if (lower.includes('users_email_key') || lower.includes('email')) {
            setEmailError('Email already exists');
          }
          if (lower.includes('users_phone_key') || lower.includes('phone')) {
            setPhoneError('Phone number already exists');
          }
          if (lower.includes('role unspecified') || lower.includes('role')) {
            setRoleError('Role is required or not allowed');
          }
        }
        setError(msg);
        return;
      }

      if (data.user && onCreated) onCreated(data.user);
      // close modal
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Add New Personnel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(null); }} error={emailError || undefined} />
            <Input label="Phone Number" value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }} error={phoneError || undefined} />
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
                    // UserRole contains both name->number and number->name mappings; filter numeric values
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
              {roleError && <p className="mt-1 text-sm text-red-600">{roleError}</p>}
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

          <p className="text-sm text-gray-500">An invitation email will be sent.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={onClose} size="md">Cancel</Button>
            <Button leftIcon={<UserPlus />} onClick={submit} isLoading={isSubmitting} size="md">Create User</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
