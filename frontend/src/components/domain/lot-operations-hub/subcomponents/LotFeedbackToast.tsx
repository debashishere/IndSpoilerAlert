import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { FeedbackToastState } from '../types/lotOperations.types';

interface LotFeedbackToastProps {
  toast: FeedbackToastState | null;
}

export const LotFeedbackToast: React.FC<LotFeedbackToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-[1100] px-5 py-3 rounded-lg text-white shadow-xl flex items-center gap-2 font-semibold text-xs transition-all animate-in fade-in slide-in-from-bottom-2 ${
        toast.type === 'error' ? 'bg-red-500' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
      }`}
    >
      {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
      <span>{toast.message}</span>
    </div>
  );
};
