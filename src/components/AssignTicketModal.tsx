'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Loader2, UserPlus } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role: string | number;
}

interface AssignTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string;
  ticketTitle?: string;
  currentTechId?: string;
  currentSaleId?: string;
}

export default function AssignTicketModal({
  isOpen,
  onClose,
  onSuccess,
  ticketId,
  ticketTitle,
  currentTechId,
  currentSaleId,
}: AssignTicketModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [techId, setTechId] = useState(currentTechId || '');
  const [saleId, setSaleId] = useState(currentSaleId || '');
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [salespeople, setSalespeople] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        // Filter by role (assuming role 2 = technician, role 3 = sales or similar)
        // Adjust these filters based on your actual role system
        const techs = users.filter((u: User) => 
          u.role === 2 || u.role === 'technician' || u.role === 'tech'
        );
        const sales = users.filter((u: User) => 
          u.role === 3 || u.role === 'sales' || u.role === 'sale'
        );
        
        // If no role-based filtering works, show all users
        if (techs.length === 0 && sales.length === 0) {
          setTechnicians(users);
          setSalespeople(users);
        } else {
          setTechnicians(techs);
          setSalespeople(sales);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setTechId(currentTechId || '');
      setSaleId(currentSaleId || '');
    }
  }, [isOpen, currentTechId, currentSaleId, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          action: 'assign',
          tech_id: techId || undefined,
          sale_id: saleId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign ticket');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign ticket');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Assign Ticket</h3>
              {ticketTitle && (
                <p className="text-sm text-gray-500 truncate max-w-[250px]">{ticketTitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 p-1 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Technician */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                👨‍🔧 Assign Technician
              </span>
            </label>
            <select
              value={techId}
              onChange={(e) => setTechId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingUsers}
            >
              <option value="">-- No Technician --</option>
              {technicians.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Sales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                💼 Assign Sales Person
              </span>
            </label>
            <select
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingUsers}
            >
              <option value="">-- No Sales Person --</option>
              {salespeople.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
