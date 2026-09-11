'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

export interface AIConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  summary?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const AIConfirmationModal: React.FC<AIConfirmationModalProps> = ({
  isOpen,
  title = 'Confirm AI Action',
  description = 'The AI Command Agent is about to perform a high-impact action on your behalf. Please confirm below:',
  summary = 'Confirm execution of requested action.',
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-100">{title}</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-stone-300 leading-relaxed">
          {description}
        </p>

        {/* Action Summary Card */}
        <div className="bg-stone-800/80 border border-stone-700/60 rounded-xl p-4 space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Action Requested</span>
          <p className="text-base font-medium text-stone-100">{summary}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-stone-300 hover:text-stone-100 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{cancelLabel}</span>
          </button>

          <button
            onClick={handleConfirm}
            className="flex items-center space-x-1.5 px-5 py-2 text-sm font-semibold text-stone-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
