'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op function if no provider (for safety)
    return {
      showToast: (message: string, type?: ToastType) => {
        console.log(`[Toast] ${type || 'info'}: ${message}`);
      },
      toasts: [],
    };
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toasts }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onRemove, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onRemove]);

  const colors = {
    success: 'bg-green-600/90 border-green-500 text-white',
    error: 'bg-red-600/90 border-red-500 text-white',
    info: 'bg-blue-600/90 border-blue-500 text-white',
    warning: 'bg-yellow-600/90 border-yellow-500 text-white',
  };

  const icons = {
    success: <CheckCircle size={16} className="shrink-0" />,
    error: <AlertCircle size={16} className="shrink-0" />,
    info: <Info size={16} className="shrink-0" />,
    warning: <AlertCircle size={16} className="shrink-0" />,
  };

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-lg pointer-events-auto animate-in slide-in-from-right-5 fade-in duration-300 ${colors[toast.type]}`}
    >
      {icons[toast.type]}
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onRemove} className="ml-2 hover:opacity-70 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
};

export default ToastProvider;

