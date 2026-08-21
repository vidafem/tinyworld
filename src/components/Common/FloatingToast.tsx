"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { playSuccessChime, triggerHaptic } from "@/lib/pageSound";

export interface ToastData {
  id?: string;
  type?: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

interface FloatingToastProps {
  toast: ToastData | null;
  onClose: () => void;
  theme?: {
    primaryBg?: string;
    text?: string;
    hex?: string;
    [key: string]: any;
  } | null;
}

export default function FloatingToast({ toast, onClose, theme }: FloatingToastProps) {
  useEffect(() => {
    if (!toast) return;

    if (toast.type === "success") {
      playSuccessChime();
    } else if (toast.type === "error" || toast.type === "warning") {
      triggerHaptic("warning");
    } else {
      triggerHaptic("light");
    }

    const duration = toast.duration || 3200;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const type = toast.type || "success";
  const duration = toast.duration || 3200;

  const iconMap = {
    success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
    error: <AlertCircle size={18} className="text-red-500 shrink-0" />,
    warning: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
    info: <Info size={18} className="text-sky-500 shrink-0" />,
  };

  const borderAccentMap = {
    success: "border-emerald-500/20",
    error: "border-red-500/20",
    warning: "border-amber-500/20",
    info: "border-sky-500/20",
  };

  return (
    <AnimatePresence>
      <div className="fixed top-5 inset-x-0 z-[9999] flex justify-center pointer-events-none px-4">
        <motion.div
          initial={{ opacity: 0, y: -25, scale: 0.9, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          className={`pointer-events-auto relative max-w-md w-auto overflow-hidden bg-stone-900/90 dark:bg-black/90 text-white rounded-full shadow-2xl backdrop-blur-2xl border ${borderAccentMap[type]} flex items-center gap-3 pl-4 pr-3 py-2.5`}
        >
          {/* Icon Badge */}
          <div className="p-1 rounded-full bg-white/10 flex items-center justify-center">
            {iconMap[type]}
          </div>

          {/* Message Text */}
          <p className="text-xs font-semibold tracking-wide pr-2 font-quicksand text-stone-100">
            {toast.message}
          </p>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors ml-auto shrink-0"
          >
            <X size={14} />
          </button>

          {/* Duration Progress Line */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`absolute bottom-0 left-0 h-[2px] ${
              type === "success"
                ? "bg-emerald-400"
                : type === "error"
                ? "bg-red-400"
                : type === "warning"
                ? "bg-amber-400"
                : "bg-sky-400"
            }`}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
