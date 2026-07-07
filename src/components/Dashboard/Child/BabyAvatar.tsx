"use client";

import { Baby } from "lucide-react";
import { motion } from "framer-motion";

interface BabyAvatarProps {
  gender?: string;
  coverImage?: string;
  name?: string;
  className?: string;
  iconClassName?: string;
  size?: "sm" | "md" | "md-lg" | "lg" | "xl";
  style?: React.CSSProperties;
}

export default function BabyAvatar({
  gender,
  coverImage,
  name,
  className = "",
  iconClassName = "",
  size = "md",
  style,
}: BabyAvatarProps) {
  const sizeClasses = {
    sm: "w-10 h-10 border-[2px]",
    md: "w-20 h-20 border-[4px]",
    "md-lg": "w-24 h-24 md:w-28 md:h-28 border-[5px]",
    lg: "w-32 h-32 md:w-40 md:h-40 border-[6px] md:border-[8px]",
    xl: "w-40 h-40 md:w-48 md:h-48 border-[8px]",
  };

  const babyIconSizes = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    "md-lg": "w-18 h-18 md:w-20 md:h-20",
    lg: "w-24 h-24 md:w-32 md:h-32",
    xl: "w-32 h-32 md:w-36 md:h-36",
  };

  const isGirl = gender?.toLowerCase() === "girl" || gender?.toLowerCase() === "niña" || gender?.toLowerCase() === "female" || gender?.toLowerCase() === "femenino";
  const isBoy = gender?.toLowerCase() === "boy" || gender?.toLowerCase() === "niño" || gender?.toLowerCase() === "male" || gender?.toLowerCase() === "masculino";

  const hasCoverImage = coverImage && coverImage !== "null" && coverImage !== "undefined" && coverImage.trim() !== "";

  return (
    <div style={style} className={`relative flex items-center justify-center rounded-full bg-white shadow-lg overflow-hidden ${sizeClasses[size]} ${className}`}>
      {hasCoverImage ? (
        <img
          src={coverImage}
          alt={name || "Baby Avatar"}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div className="relative w-full h-full flex items-center justify-center rounded-full bg-inherit">
          <svg 
            viewBox="0 0 100 100" 
            className={`${babyIconSizes[size]} ${iconClassName}`}
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {/* Hair curl loop on top: ponytail loop for girls, simple cute curl for boys/neutral */}
            {isGirl ? (
              <path d="M 50 31 C 50 19, 58 13, 50 9 C 43 5, 42 16, 48 18" />
            ) : (
              <path d="M 50 29 Q 47 20 53 16 Q 57 13 54 9" />
            )}

            {/* Left Ear */}
            <path d="M 23 50 A 6 6 0 0 0 23 62" />

            {/* Right Ear */}
            <path d="M 77 50 A 6 6 0 0 1 77 62" />

            {/* Head / Face outline */}
            <circle cx="50" cy="56" r="27" fill="white" strokeWidth="4.5" />

            {/* Arched smiling closed eyes (⌒ ⌒) */}
            <path d="M 35 53 Q 40 47 45 53" />
            <path d="M 55 53 Q 60 47 65 53" />

            {/* Happy curved smile */}
            <path d="M 41 67 Q 50 75 59 67" />

            {/* Bow tied directly on the hair loop (Only if isGirl) */}
            {isGirl && (
              <g className="text-pink-400">
                {/* Left bow wing */}
                <path d="M 48 20 C 37 10, 36 28, 48 20 Z" fill="white" stroke="currentColor" strokeWidth="3.5" />
                {/* Right bow wing */}
                <path d="M 52 20 C 63 10, 64 28, 52 20 Z" fill="white" stroke="currentColor" strokeWidth="3.5" />
                {/* Center Knot */}
                <circle cx="50" cy="20" r="4.5" fill="white" stroke="currentColor" strokeWidth="3.5" />
              </g>
            )}

            {/* Cute blue bowtie at the bottom of the face (Only if isBoy) */}
            {isBoy && (
              <g className="text-blue-400">
                {/* Left bow wing */}
                <path d="M 48 83 C 37 75, 36 91, 48 83 Z" fill="white" stroke="currentColor" strokeWidth="3.5" />
                {/* Right bow wing */}
                <path d="M 52 83 C 63 75, 64 91, 52 83 Z" fill="white" stroke="currentColor" strokeWidth="3.5" />
                {/* Center Knot */}
                <circle cx="50" cy="83" r="4.5" fill="white" stroke="currentColor" strokeWidth="3.5" />
              </g>
            )}
          </svg>
        </div>
      )}
    </div>
  );
}

