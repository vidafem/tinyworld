"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { playSuccessChime } from "@/lib/pageSound";

interface AnimatedCheckProps {
  size?: number;
  color?: string;
  playSound?: boolean;
  className?: string;
}

export default function AnimatedCheck({
  size = 48,
  color = "#10B981", // Emerald default
  playSound = true,
  className = "",
}: AnimatedCheckProps) {
  useEffect(() => {
    if (playSound) {
      playSuccessChime();
    }
  }, [playSound]);

  // Radiating sparkle particles
  const particles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Sparkles */}
      {particles.map((deg, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [1, 0.8, 0],
            x: Math.cos((deg * Math.PI) / 180) * (size * 0.7),
            y: Math.sin((deg * Math.PI) / 180) * (size * 0.7),
          }}
          transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
          className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
          style={{ backgroundColor: color }}
        />
      ))}

      {/* SVG Circle and Checkmark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background glow circle */}
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          fill={color}
        />

        {/* Outline circle drawing */}
        <motion.circle
          cx="26"
          cy="26"
          r="23"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: -90 }}
          transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
        />

        {/* Checkmark drawing */}
        <motion.path
          d="M15 27L22.5 34.5L37 19"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
    </div>
  );
}
