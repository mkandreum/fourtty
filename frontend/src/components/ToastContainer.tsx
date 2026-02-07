import React from 'react';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-[42px] left-0 w-full z-[100] flex flex-col items-center pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full pointer-events-auto"
                    >
                        <div className={`
                            w-full p-2 md:p-3 shadow-md flex items-center justify-between border-b transition-colors duration-200
                            ${toast.type === 'success' ? 'bg-[var(--toast-success-bg)] border-[var(--toast-success-border)] text-[var(--toast-success-text)]' : ''}
                            ${toast.type === 'error' ? 'bg-[var(--toast-error-bg)] border-[var(--toast-error-border)] text-[var(--toast-error-text)]' : ''}
                            ${toast.type === 'info' ? 'bg-[var(--toast-info-bg)] border-[var(--toast-info-border)] text-[var(--toast-info-text)]' : ''}
                            ${!['success', 'error', 'info'].includes(toast.type) ? 'bg-[var(--toast-success-bg)] border-[var(--toast-success-border)] text-[var(--toast-success-text)]' : ''}
                        `}>
                            <div className="max-w-[980px] mx-auto w-full flex items-center gap-3 px-2">
                                {toast.type === 'success' && <CheckCircle size={16} className="shrink-0" />}
                                {toast.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
                                {toast.type === 'info' && <Info size={16} className="shrink-0" />}

                                <span className="text-[12px] md:text-[13px] font-bold flex-1">
                                    {toast.message}
                                </span>

                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="hover:opacity-70 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
