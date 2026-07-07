"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles } from "lucide-react";

interface BabyPhotoCollageProps {
  images: string[];
  theme: any;
  onImageClick: (images: string[], index: number) => void;
}

// ── Patterns desktop (4:3 aspect) — 6 photos each ──────────────────
const PATTERNS_DESK = [
  [[0,0,55,58],[55,0,45,29],[55,29,45,29],[0,58,33,42],[33,58,34,42],[67,58,33,42]],
  [[0,0,33,45],[33,0,34,45],[67,0,33,45],[0,45,55,55],[55,45,22,55],[77,45,23,55]],
  [[0,0,22,100],[22,0,56,50],[22,50,28,50],[50,50,28,50],[78,0,22,50],[78,50,22,50]],
  [[0,0,100,40],[0,40,25,60],[25,40,25,60],[50,40,25,60],[75,40,25,60],[50,0,50,40]],
  [[0,0,33,60],[33,0,34,40],[67,0,33,55],[0,60,33,40],[33,40,34,60],[67,55,33,45]],
  [[0,0,50,35],[50,0,50,35],[0,35,35,65],[65,35,35,65],[35,35,30,32],[35,67,30,33]],
  [[0,0,45,40],[45,0,55,30],[0,40,30,60],[30,30,40,40],[30,70,40,30],[70,30,30,70]],
  [[0,0,50,33],[50,0,50,33],[0,33,50,34],[50,33,50,34],[0,67,50,33],[50,67,50,33]],
];

// ── Patterns mobile (3:4 aspect — taller than wide) ─────────────────
const PATTERNS_MOB = [
  [[0,0,100,35],[0,35,50,30],[50,35,50,30],[0,65,33,35],[33,65,34,35],[67,65,33,35]],
  [[0,0,40,100],[40,0,60,50],[40,50,30,50],[70,50,30,50],[40,0,30,50],[70,0,30,50]],
  [[0,0,100,33],[0,33,50,34],[50,33,50,34],[0,67,33,33],[33,67,34,33],[67,67,33,33]],
  [[0,0,60,45],[60,0,40,30],[60,30,40,30],[0,45,50,30],[50,45,50,30],[0,75,100,25]],
  [[0,0,55,40],[45,0,55,28],[0,40,45,30],[55,28,45,32],[0,70,50,30],[50,60,50,40]],
  [[0,0,100,22],[0,22,35,56],[35,22,65,56],[65,22,35,56],[0,78,50,22],[50,78,50,22]],
  [[0,0,60,30],[40,0,60,25],[0,30,45,35],[45,25,55,35],[0,65,55,35],[55,60,45,40]],
  [[0,0,50,33],[50,0,50,33],[0,33,50,34],[50,33,50,34],[0,67,50,33],[50,67,50,33]],
];

const INTERVAL = 8000; // Duration of each layout configuration
const STEP_MS = 100; // Progress bar tick step

export default function BabyPhotoCollage({ images, theme, onImageClick }: BabyPhotoCollageProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sync isMobile breakpoint dynamically
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const patterns = isMobile ? PATTERNS_MOB : PATTERNS_DESK;

  // Helper to select 6 images from the pool
  const selectSixImages = (pool: string[]): string[] => {
    if (pool.length === 0) return [];
    
    // Case 1: Less than 6 images -> Pad to 6 repeating elements randomly
    if (pool.length < 6) {
      const arr = [...pool];
      while (arr.length < 6) {
        arr.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      return arr;
    }
    
    // Case 2: 6 or more images -> Shuffle and select 6 random ones
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  };

  // Build initial images set when the active stage images change
  useEffect(() => {
    if (images.length > 0) {
      setCurrentImages(selectSixImages(images));
      setCurrentPatternIndex(0);
      setProgress(0);
    }
  }, [images]);

  // Handle timer ticks for progress bar and transition morphing
  useEffect(() => {
    if (paused || images.length === 0) return;

    const intervalId = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (STEP_MS / INTERVAL) * 100;
        if (next >= 100) {
          // Transition: update pattern index AND shuffle images
          setCurrentPatternIndex((prevIdx) => (prevIdx + 1) % patterns.length);
          setCurrentImages(selectSixImages(images));
          return 0;
        }
        return next;
      });
    }, STEP_MS);

    return () => clearInterval(intervalId);
  }, [paused, images, patterns.length]);

  const goToPattern = (index: number) => {
    const len = patterns.length;
    const newIdx = ((index % len) + len) % len;
    setCurrentPatternIndex(newIdx);
    setCurrentImages(selectSixImages(images));
    setProgress(0);
  };

  const nextPattern = () => goToPattern(currentPatternIndex + 1);
  const prevPattern = () => goToPattern(currentPatternIndex - 1);
  const togglePause = () => setPaused((prev) => !prev);

  // CSS positioning percentage mapper
  const rectToCSS = (rect: number[]) => {
    const [xp, yp, wp, hp] = rect;
    const GAP = 5; // spacing in pixels
    const halfGap = GAP / 2;
    return {
      left: `calc(${xp}% + ${halfGap}px)`,
      top: `calc(${yp}% + ${halfGap}px)`,
      width: `calc(${wp}% - ${GAP}px)`,
      height: `calc(${hp}% - ${GAP}px)`,
    };
  };

  if (images.length === 0) {
    return (
      <div className={`py-12 bg-white/40 rounded-3xl border border-dashed ${theme.borderAccent} text-center flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full`}>
        <Sparkles className={`w-8 h-8 ${theme.text} opacity-20 mb-2 animate-pulse`} />
        <p className={`text-xs md:text-sm ${theme.text} opacity-50 font-black uppercase tracking-widest`}>
          PROXIMAMENTE HABRAN FOTOS, ESPERALAS
        </p>
      </div>
    );
  }

  const currentPattern = patterns[currentPatternIndex];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 select-none relative z-20">
      
      {/* ── Collage Stage Wrapper ── */}
      <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white/30 backdrop-blur-md p-1.5">
        <div 
          className={`w-full relative overflow-hidden rounded-2xl bg-black/5 transition-all duration-500 ${
            isMobile ? "aspect-[3/4]" : "aspect-[4/3]"
          }`}
        >
          {currentImages.map((src, i) => {
            const rect = currentPattern[i] || [0, 0, 100, 100];
            return (
              <div
                key={i}
                onClick={() => onImageClick(currentImages, i)}
                className="absolute rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] group bg-gray-100"
                style={{
                  ...rectToCSS(rect),
                  transition: "left 2.6s cubic-bezier(0.77, 0, 0.175, 1), top 2.6s cubic-bezier(0.77, 0, 0.175, 1), width 2.6s cubic-bezier(0.77, 0, 0.175, 1), height 2.6s cubic-bezier(0.77, 0, 0.175, 1)",
                  willChange: "left, top, width, height"
                }}
              >
                <AnimatePresence>
                  <motion.img 
                    key={src}
                    src={src} 
                    alt="" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                  />
                </AnimatePresence>
                
                {/* Subtle overlay tap/hover effect */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 group-active:bg-black/10 transition-colors pointer-events-none z-10" />
              </div>
            );
          })}
        </div>

        {/* ── Progress Line ── */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5 overflow-hidden">
          <div 
            className="h-full rounded-r transition-all duration-100 ease-linear"
            style={{ 
              width: `${progress}%`,
              backgroundColor: theme.hex || "#7cb9c4" 
            }}
          />
        </div>
      </div>

      {/* ── Controls Row ── */}
      <div className="flex items-center justify-center gap-3.5 flex-wrap mt-1">
        
        {/* Left Arrow */}
        <button
          onClick={prevPattern}
          type="button"
          className={`w-9 h-9 rounded-full bg-white hover:bg-gray-50 ${theme.text} shadow-md border border-gray-100/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer`}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        {/* Dots Navigation indicator */}
        <div className="flex gap-2 items-center px-4 py-2 bg-white/70 backdrop-blur-md rounded-full shadow-inner border border-gray-100/30">
          {patterns.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToPattern(i)}
              className="w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                backgroundColor: i === currentPatternIndex ? theme.hex : "rgba(0, 0, 0, 0.15)",
                transform: i === currentPatternIndex ? "scale(1.25)" : "scale(1)",
                boxShadow: i === currentPatternIndex ? `0 0 8px ${theme.hex}80` : "none"
              }}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={nextPattern}
          type="button"
          className={`w-9 h-9 rounded-full bg-white hover:bg-gray-50 ${theme.text} shadow-md border border-gray-100/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer`}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>

        {/* Pause/Play Button */}
        <button
          onClick={togglePause}
          type="button"
          className={`w-9 h-9 rounded-full bg-white hover:bg-gray-50 ${theme.text} shadow-md border border-gray-100/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer`}
        >
          {paused ? (
            <Play size={14} fill="currentColor" strokeWidth={2.5} className="ml-0.5" />
          ) : (
            <Pause size={14} fill="currentColor" strokeWidth={2.5} />
          )}
        </button>
      </div>

    </div>
  );
}
