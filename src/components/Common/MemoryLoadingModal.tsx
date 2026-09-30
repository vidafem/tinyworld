"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart } from "lucide-react";

interface MemoryLoadingModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  theme?: any;
}

const CUTE_PHRASES = [
  "Optimizando cada fotito con cariño...",
  "Guardando este momento especial en la nube...",
  "Sellando una sonrisa para el futuro...",
  "Haciendo magia con tus recuerdos...",
  "¡Casi listo! Quedará hermoso..."
];

export default function MemoryLoadingModal({
  isOpen,
  title = "Subiendo tus fotitos mágicas...",
  subtitle,
  theme,
}: MemoryLoadingModalProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Rotar frases lindas cada 2.5 segundos mientras carga
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % CUTE_PHRASES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isOpen]);

  const activeSubtitle = subtitle || CUTE_PHRASES[phraseIndex];
  const accentColor = theme?.hex || "#ec4899";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          {/* Fondo oscuro con desenfoque de cristal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
          />

          {/* Tarjeta del Modal Centrada */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white/95 rounded-[3rem] p-7 md:p-9 max-w-sm w-full shadow-2xl border-4 border-white/80 flex flex-col items-center text-center overflow-hidden z-10"
            style={{
              boxShadow: `0 25px 50px -12px ${accentColor}33, 0 0 0 1px rgba(255,255,255,0.7)`
            }}
          >
            {/* Destellos de fondo animados */}
            <div className="absolute top-3 right-5 text-amber-400 opacity-60 animate-bounce">
              <Sparkles size={20} />
            </div>
            <div className="absolute bottom-4 left-6 text-pink-400 opacity-50 animate-pulse">
              <Heart size={16} fill="currentColor" />
            </div>

            {/* Contenedor del GIF Vg1.gif con flotación animada */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 1.5, -1.5, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.8,
                ease: "easeInOut",
              }}
              className="relative my-2"
            >
              {/* Halo de luz de color temático */}
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-40 scale-125"
                style={{ backgroundColor: accentColor }}
              />

              {/* Imagen GIF */}
              <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full bg-gradient-to-b from-white via-pink-50/50 to-pink-100/40 p-2 shadow-inner border-2 border-white flex items-center justify-center overflow-hidden">
                <img
                  src="/images/preggers/Vg1.gif"
                  alt="Cargando recuerdo..."
                  className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
                />
              </div>
            </motion.div>

            {/* Título de Carga */}
            <h3 className="text-xl md:text-2xl font-black text-stone-800 tracking-tight leading-snug mt-3">
              {title}
            </h3>

            {/* Subtítulo dinámico con transición suave */}
            <AnimatePresence mode="wait">
              <motion.p
                key={activeSubtitle}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-xs md:text-sm font-semibold text-stone-500 mt-2 px-3 min-h-[40px] flex items-center justify-center leading-relaxed"
              >
                {activeSubtitle}
              </motion.p>
            </AnimatePresence>

            {/* Barra de Progreso Indeterminada Animada */}
            <div className="w-full max-w-[200px] h-2 bg-stone-100 rounded-full mt-4 overflow-hidden relative shadow-inner">
              <motion.div
                className="absolute top-0 bottom-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, #38bdf8, ${accentColor}, #f472b6)`,
                }}
                animate={{
                  left: ["-100%", "100%"],
                  width: ["50%", "70%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.6,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Nota de pie tierna */}
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-4 opacity-75">
              TinyWorld · Guardando Recuerdos
            </span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
