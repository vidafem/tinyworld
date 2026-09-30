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
  // Color del sistema según el tema activo del niño
  const systemColor = theme?.hex || "#38bdf8";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 select-none pointer-events-auto">
          {/* Fondo oscuro difuminado sin recuadros ni tarjetas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-stone-950/65 backdrop-blur-md"
          />

          {/* Contenido flotante libre */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
          >
            {/* 1. GIF Suelto (un poquitito más grande y con flotación suave) */}
            <motion.div
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.4,
                ease: "easeInOut",
              }}
              className="relative w-56 h-56 md:w-64 md:h-64 flex items-center justify-center pointer-events-none"
            >
              <img
                src="/images/preggers/Vg1.gif"
                alt="Cargando..."
                className="w-full h-full object-contain filter drop-shadow-2xl scale-110"
              />
            </motion.div>

            {/* 2. Barra de Progreso sobre el GIF (compensando el margen transparente de la imagen) */}
            <div className="-mt-8 md:-mt-10 relative z-20 w-52 md:w-60 h-2.5 bg-white/20 backdrop-blur-md rounded-full overflow-hidden shadow-lg border border-white/25">
              <motion.div
                className="absolute top-0 bottom-0 rounded-full"
                style={{
                  backgroundColor: systemColor,
                  boxShadow: `0 0 14px ${systemColor}, 0 0 4px ${systemColor}`,
                }}
                animate={{
                  left: ["-100%", "100%"],
                  width: ["45%", "65%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* 3. Frase abajo de la barra de carga */}
            <p className="text-white/95 text-xs md:text-sm font-bold tracking-wide drop-shadow-md mt-3.5 px-2">
              {subtitle || "optimizando y preparando las imágenes..."}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
