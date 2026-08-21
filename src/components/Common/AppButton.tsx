"use client";

import React, { useRef, useState } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { playSoftPop, playActionSnap, playSuccessChime, triggerHaptic } from "@/lib/pageSound";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "frosted" | "glass" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "pill";

export interface AppButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  theme?: {
    primaryBg?: string;
    hoverBg?: string;
    text?: string;
    textActive?: string;
    borderAccent?: string;
    bgLight?: string;
    hex?: string;
    [key: string]: any;
  } | null;
  loading?: boolean;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  sound?: "pop" | "snap" | "chime" | "none";
  haptic?: "light" | "medium" | "success" | "none";
  glare?: boolean;
  children?: React.ReactNode;
}

export default function AppButton({
  variant = "primary",
  size = "md",
  theme,
  loading = false,
  disabled = false,
  icon,
  endIcon,
  sound = "pop",
  haptic = "light",
  glare = false,
  children,
  className = "",
  onClick,
  style,
  ...rest
}: AppButtonProps) {
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    if (haptic === "light") triggerHaptic("light");
    else if (haptic === "medium") triggerHaptic("medium");
    else if (haptic === "success") triggerHaptic("success");

    if (sound === "pop") playSoftPop();
    else if (sound === "snap") playActionSnap();
    else if (sound === "chime") playSuccessChime();

    if (onClick) onClick(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!glare || disabled || loading || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlarePos({ x, y, opacity: 0.25 });
  };

  const handleMouseLeave = () => {
    if (glare) {
      setGlarePos((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  // Base size styles
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-[11px] font-bold rounded-xl gap-1.5 tracking-wider uppercase",
    md: "px-5 py-2.5 text-xs font-bold rounded-2xl gap-2 tracking-wide",
    lg: "px-7 py-3.5 text-sm font-black rounded-2xl gap-2.5 tracking-wide shadow-lg",
    pill: "px-6 py-2 text-xs font-bold rounded-full gap-2",
    icon: "p-2.5 rounded-2xl aspect-square flex items-center justify-center",
  }[size];

  // Theme-aware variant styling
  let variantClasses = "";
  let dynamicStyle: any = { ...style };

  const themeHex = theme?.hex || "#8C7A6B";
  const themePrimaryBg = theme?.primaryBg || "bg-[#8C7A6B]";
  const themeHoverBg = theme?.hoverBg || "hover:bg-[#8C7A6B]/90";
  const themeText = theme?.text || "text-[#8C7A6B]";

  switch (variant) {
    case "primary":
      variantClasses = `${themePrimaryBg} ${themeHoverBg} text-white shadow-md border-t border-white/25 active:shadow-sm`;
      if (themeHex) {
        dynamicStyle = {
          ...dynamicStyle,
          boxShadow: `0 8px 20px -4px ${themeHex}40, inset 0 1px 0 rgba(255,255,255,0.25)`,
        };
      }
      break;
    case "secondary":
      variantClasses = "bg-white/85 dark:bg-stone-900/85 hover:bg-white text-stone-700 dark:text-stone-200 border border-stone-200/60 dark:border-stone-800 shadow-sm backdrop-blur-md";
      break;
    case "frosted":
      variantClasses = `bg-white/70 dark:bg-black/40 hover:bg-white/90 text-stone-800 dark:text-stone-100 border border-white/60 dark:border-white/10 shadow-sm backdrop-blur-xl ${themeText}`;
      break;
    case "ghost":
      variantClasses = `bg-transparent hover:bg-black/5 dark:hover:bg-white/5 ${themeText}`;
      break;
    case "outline":
      variantClasses = `bg-transparent border border-current ${themeText} hover:bg-current/10`;
      break;
    case "danger":
      variantClasses = "bg-red-500 hover:bg-red-600 text-white shadow-md border-t border-white/20 active:shadow-sm";
      dynamicStyle = {
        ...dynamicStyle,
        boxShadow: "0 8px 20px -4px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
      };
      break;
    case "glass":
      variantClasses = "bg-white/40 dark:bg-stone-900/40 hover:bg-white/60 border border-white/50 dark:border-white/10 text-stone-800 dark:text-stone-200 backdrop-blur-md shadow-sm";
      break;
  }

  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={buttonRef}
      whileTap={!isDisabled ? { scale: 0.95 } : undefined}
      whileHover={!isDisabled ? { y: -1.5, transition: { duration: 0.15 } } : undefined}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={isDisabled}
      className={`relative overflow-hidden inline-flex items-center justify-center select-none cursor-pointer transition-colors duration-200 font-quicksand disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${sizeClasses} ${variantClasses} ${className}`}
      style={dynamicStyle}
      {...rest}
    >
      {/* Glare effect */}
      {glare && !isDisabled && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 65%)`,
            opacity: glarePos.opacity,
          }}
        />
      )}

      {/* Loading state or regular icons and children */}
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin shrink-0" size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
          <span className="opacity-90">{children || "Cargando..."}</span>
        </div>
      ) : (
        <>
          {icon && <span className="shrink-0 flex items-center">{icon}</span>}
          {children && <span>{children}</span>}
          {endIcon && <span className="shrink-0 flex items-center">{endIcon}</span>}
        </>
      )}
    </motion.button>
  );
}
