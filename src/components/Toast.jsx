import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', description, duration = 5000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, description }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto p-4 rounded-[14px] shadow-lg border flex items-start gap-3 transition-all duration-200 animate-fade-in ${
              toast.type === 'success'
                ? 'bg-white border-brand-sage/40 text-brand-dark'
                : toast.type === 'error'
                ? 'bg-white border-brand-terracotta/40 text-brand-dark'
                : 'bg-white border-[#152A32]/15 text-brand-dark'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 size={18} className="text-brand-sage" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-brand-terracotta" />}
              {toast.type === 'info' && <Info size={18} className="text-brand-dark/60" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{toast.message}</p>
              {toast.description && (
                <p className="text-xs text-brand-dark/70 mt-1 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-brand-dark/40 hover:text-brand-dark p-0.5 rounded transition-colors shrink-0"
              aria-label="Закрити сповіщення"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
