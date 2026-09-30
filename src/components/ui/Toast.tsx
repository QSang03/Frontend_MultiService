"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type Toast = {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
};

type ToastType = 'success' | 'error' | 'info';

type ToastContextValue = {
  addToast: (
    arg1: string,
    arg2?: { type?: ToastType; duration?: number } | ToastType | string
  ) => string;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const toast = {
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type: 'success' } }));
    }
  },
  error: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type: 'error' } }));
    }
  },
  info: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type: 'info' } }));
    }
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    arg1: string,
    arg2?: { type?: ToastType; duration?: number } | ToastType | string
  ) => {
    let message = arg1;
    let type: ToastType = 'info';
    let duration = 3500;

    const isKnownType = (v: unknown): v is ToastType => v === 'success' || v === 'error' || v === 'info';

    if (isKnownType(arg1) && typeof arg2 === 'string') {
      type = arg1;
      message = arg2;
    } else if (typeof arg2 === 'string' && isKnownType(arg2)) {
      type = arg2;
    } else if (typeof arg2 === 'object' && arg2 !== null) {
      if (arg2.type) type = arg2.type;
      if (arg2.duration) duration = arg2.duration;
    }

    const id = String(Date.now() + Math.random());
    const toastItem: Toast = { id, message, type, duration };
    setToasts((s) => [...s, toastItem]);
    return id;
  }, []);

  useEffect(() => {
    const handleAppToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: ToastType; duration?: number }>;
      if (customEvent.detail?.message) {
        addToast(customEvent.detail.message, customEvent.detail.type || 'info');
      }
    };
    window.addEventListener('app-toast', handleAppToast);
    return () => window.removeEventListener('app-toast', handleAppToast);
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = setTimeout(() => setVisible(true), 10);
    const dismiss = setTimeout(() => {
      setVisible(false);
      setTimeout(onRemove, 300);
    }, toast.duration ?? 3500);
    return () => { clearTimeout(enter); clearTimeout(dismiss); };
  }, [toast.duration, onRemove]);

  const configs = {
    success: { bg: 'bg-emerald-600', icon: <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> },
    error:   { bg: 'bg-red-600',     icon: <AlertCircle   className="w-4 h-4 flex-shrink-0" /> },
    info:    { bg: 'bg-gray-800',    icon: <Info          className="w-4 h-4 flex-shrink-0" /> },
  };
  const cfg = configs[toast.type ?? 'info'];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm transition-all duration-300 ${cfg.bg} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ minWidth: '260px', maxWidth: '360px' }}
    >
      {cfg.icon}
      <span className="flex-1 leading-relaxed">{toast.message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onRemove, 300); }}
        className="opacity-60 hover:opacity-100 transition-opacity ml-1 mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ToastProvider;
