"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { playActionSnap, triggerHaptic } from "@/lib/pageSound";

export interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  theme?: {
    primaryBg?: string;
    text?: string;
    borderAccent?: string;
    bgLight?: string;
    hex?: string;
    [key: string]: any;
  } | null;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  children: React.ReactNode;
  hideCloseButton?: boolean;
}

export default function ModernModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  theme,
  maxWidth = "md",
  children,
  hideCloseButton = false,
}: ModernModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      playActionSnap();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 400) {
      triggerHaptic("medium");
      onClose();
    }
  };

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    full: "max-w-4xl",
  }[maxWidth];

  const themeBorder = theme?.borderAccent || "border-stone-200/50";
  const themeText = theme?.text || "text-stone-800";
  const themeBgLight = theme?.bgLight || "bg-stone-100/50";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-xl"
          />

          {/* Modal Container: Bottom Sheet on Mobile / Centered Card on Desktop */}
          {isMobile ? (
            <motion.div
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={handleDragEnd}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="relative w-full bg-white dark:bg-stone-900 rounded-t-[2.5rem] shadow-2xl border-t border-white/40 dark:border-stone-800 z-10 max-h-[90vh] flex flex-col overflow-hidden pb-8"
            >
              {/* Drag Handle Indicator */}
              <div className="w-full flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
              </div>

              {/* Header */}
              {(title || !hideCloseButton) && (
                <div className="px-6 py-3 flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80">
                  <div className="flex items-center gap-3">
                    {icon && (
                      <div className={`p-2.5 rounded-2xl ${themeBgLight} ${themeText}`}>
                        {icon}
                      </div>
                    )}
                    <div>
                      {title && <div className={`font-black font-outfit text-base ${themeText}`}>{title}</div>}
                      {subtitle && <p className="text-[11px] text-stone-400 font-medium font-quicksand">{subtitle}</p>}
                    </div>
                  </div>
                  {!hideCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              {/* Content Scrollable */}
              <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-100px)]">
                {children}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.94, y: 10, filter: "blur(6px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`relative w-full ${maxWidthClasses} bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border ${themeBorder} z-10 overflow-hidden flex flex-col max-h-[85vh]`}
              style={{
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              {/* Header */}
              {(title || !hideCloseButton) && (
                <div className="px-8 pt-7 pb-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-3.5">
                    {icon && (
                      <div className={`p-3 rounded-2xl ${themeBgLight} ${themeText}`}>
                        {icon}
                      </div>
                    )}
                    <div>
                      {title && <div className={`font-black font-outfit text-xl ${themeText}`}>{title}</div>}
                      {subtitle && <p className="text-xs text-stone-400 font-medium font-quicksand mt-0.5">{subtitle}</p>}
                    </div>
                  </div>
                  {!hideCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors hover:scale-105"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              {/* Content Scrollable */}
              <div className="px-8 py-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                {children}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
