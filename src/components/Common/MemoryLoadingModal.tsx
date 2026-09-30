"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MemoryLoadingModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  theme?: any;
}

export default function MemoryLoadingModal({
  isOpen,
  subtitle = "optimizando y preparando las imágenes...",
  theme,
}: MemoryLoadingModalProps) {
  const accentColor = theme?.hex || "#ec4899";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 select-none">
          {/* Fondo difuminado oscuro sin cuadros */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-stone-950/65 backdrop-blur-md"
          />

          {/* Contenido flotante completamente libre (sin tarjeta ni cuadro cerrado) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 flex flex-col items-center text-center max-w-xs w-full"
          >
            {/* 1. GIF Suelto (sin círculo, sin bordes, flotando libremente) */}
            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "easeInOut",
              }}
              className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center mb-5"
            >
              <img
                src="/images/preggers/Vg1.gif"
                alt="Cargando..."
                className="w-full h-full object-contain filter drop-shadow-2xl pointer-events-none"
              />
            </motion.div>

            {/* 2. Barra de Carga */}
            <div className="w-52 md:w-60 h-2 bg-white/20 backdrop-blur-md rounded-full overflow-hidden relative shadow-inner mb-3">
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
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* 3. Frase abajo de la barra de carga */}
            <p className="text-white text-xs md:text-sm font-bold tracking-wide drop-shadow-md">
              {subtitle || "optimizando y preparando las imágenes..."}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
