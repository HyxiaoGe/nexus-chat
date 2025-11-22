
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: React.ReactNode;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: React.ReactNode, type?: ToastType) => void;
  success: (message: React.ReactNode) => void;
  error: (message: React.ReactNode) => void;
  info: (message: React.ReactNode) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: React.ReactNode, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto dismiss
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = (msg: React.ReactNode) => addToast(msg, 'success');
  const error = (msg: React.ReactNode) => addToast(msg, 'error');
  const info = (msg: React.ReactNode) => addToast(msg, 'info');

  return (
    <ToastContext.Provider value={{ addToast, success, error, info }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all animate-in slide-in-from-right-full fade-in duration-300
              ${toast.type === 'success' ? 'bg-white dark:bg-gray-900 border-green-500 text-green-700 dark:text-green-400' : ''}
              ${toast.type === 'error' ? 'bg-white dark:bg-gray-900 border-red-500 text-red-700 dark:text-red-400' : ''}
              ${toast.type === 'info' ? 'bg-white dark:bg-gray-900 border-blue-500 text-blue-700 dark:text-blue-400' : ''}
            `}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <div className="text-sm font-medium pr-2 text-gray-900 dark:text-gray-100">{toast.message}</div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
