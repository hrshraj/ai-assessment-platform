import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const toastIcons = {
    success: <CheckCircle size={20} className="text-green-400" />,
    error: <AlertCircle size={20} className="text-red-400" />,
    warning: <AlertTriangle size={20} className="text-yellow-400" />,
    info: <Info size={20} className="text-blue-400" />,
};

const ToastItem = ({ toast, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border 
                ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                  toast.type === 'error' ? 'bg-red-500/10 border-red-500/20' :
                  toast.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-blue-500/10 border-blue-500/20'}`
            }
        >
            {toastIcons[toast.type]}
            <div className="flex-1">
                {toast.title && <p className="font-semibold text-white">{toast.title}</p>}
                <p className="text-sm text-gray-300">{toast.message}</p>
            </div>
            <button
                onClick={() => onClose(toast.id)}
                className="text-gray-400 hover:text-white transition-colors"
            >
                <X size={18} />
            </button>
        </motion.div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, message }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const toast = useCallback((message, options = {}) => {
        return addToast({ message, ...options });
    }, [addToast]);

    toast.success = useCallback((message, title) => {
        return addToast({ type: 'success', message, title });
    }, [addToast]);

    toast.error = useCallback((message, title) => {
        return addToast({ type: 'error', message, title });
    }, [addToast]);

    toast.warning = useCallback((message, title) => {
        return addToast({ type: 'warning', message, title });
    }, [addToast]);

    toast.info = useCallback((message, title) => {
        return addToast({ type: 'info', message, title });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toast, removeToast }}>
            {children}
            <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export default ToastContext;
