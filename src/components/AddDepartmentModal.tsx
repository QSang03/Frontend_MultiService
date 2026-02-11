"use client";

import React, { useMemo, useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export type DepartmentOption = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (department: Record<string, unknown>) => void;
  departments?: DepartmentOption[];
};

export default function AddDepartmentModal({ open, onClose, onCreated, departments = [] }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedDepartments = useMemo(() => {
    return [...departments].sort((a, b) => a.name.localeCompare(b.name));
  }, [departments]);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Name is required');
    if (!code.trim()) return setError('Code is required');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          description: description.trim() || undefined,
          parent_id: parentId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Create department failed');
        return;
      }

      if (data.department && onCreated) onCreated(data.department);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create department failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Department</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Input label="Department Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Department Code" value={code} onChange={(e) => setCode(e.target.value)} />

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Parent Department (optional)</span>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
            >
              <option value="">None</option>
              {sortedDepartments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 bg-white min-h-[80px]"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={onClose} size="md">Cancel</Button>
            <Button leftIcon={<Plus />} onClick={submit} isLoading={isSubmitting} size="md">
              Create Department
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
