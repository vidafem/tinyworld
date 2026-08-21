"use client";

import React from "react";
import ModernModal from "./ModernModal";
import AppButton from "./AppButton";
import { AlertCircle, AlertTriangle, HelpCircle, CheckCircle } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  variant?: "danger" | "warning" | "info" | "success";
  theme?: any;
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type,
  variant = "danger",
  theme,
  loading = false,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmDialogProps) {
  const handleClose = onCancel || onClose || (() => {});
  const effectiveDescription = description || message || "";
  const effectiveType = type || variant;
  const iconMap = {
    danger: <AlertCircle size={24} className="text-red-500" />,
    warning: <AlertTriangle size={24} className="text-amber-500" />,
    info: <HelpCircle size={24} className="text-sky-500" />,
    success: <CheckCircle size={24} className="text-emerald-500" />,
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      theme={theme}
      hideCloseButton
    >
      <div className="flex flex-col items-center text-center py-2">
        {/* Icon Container */}
        <div className="p-4 rounded-3xl bg-stone-100 dark:bg-stone-800/80 mb-4 flex items-center justify-center shadow-inner">
          {iconMap[effectiveType]}
        </div>

        {/* Title */}
        <h3 className="text-lg font-black font-outfit text-stone-800 dark:text-stone-100 mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs font-medium font-quicksand text-stone-500 dark:text-stone-400 mb-6 leading-relaxed px-2">
          {effectiveDescription}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <AppButton
            variant="secondary"
            size="md"
            className="flex-1 py-3"
            onClick={handleClose}
            disabled={loading}
          >
            {cancelText}
          </AppButton>

          <AppButton
            variant={effectiveType === "danger" ? "danger" : "primary"}
            size="md"
            theme={theme}
            className="flex-1 py-3"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </AppButton>
        </div>
      </div>
    </ModernModal>
  );
}
