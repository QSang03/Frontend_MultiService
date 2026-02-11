"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Toast = {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
};

type ToastContextValue = {
  addToast: (message: string, opts?: { type?: Toast['type']; duration?: number }) => string;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, opts?: { type?: Toast['type']; duration?: number }) => {
    const id = String(Date.now() + Math.random());
    const toast: Toast = { id, message, type: opts?.type || 'info', duration: opts?.duration ?? 3000 };
    setToasts((s) => [...s, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div aria-live="polite" className="fixed top-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const id = setTimeout(() => onRemove(), toast.duration ?? 3000);
    return () => clearTimeout(id);
  }, [toast.duration, onRemove]);

  const bg = toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800';

  return (
    <div className={`${bg} text-white px-4 py-2 rounded shadow-md max-w-xs`}>{toast.message}</div>
  );
};

export default ToastProvider;
