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
  const systemColor = theme?.hex || "#ec4899";

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
            className="absolute inset-0 bg-stone-950/70 backdrop-blur-md"
          />

          {/* Contenido flotante completamente libre (sin tarjeta ni cuadro cerrado) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
          >
            {/* 1. GIF Suelto y Grande (sin círculos ni bordes, recortado para destacar la ilustración) */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "easeInOut",
              }}
              className="relative w-56 h-56 md:w-72 md:h-72 flex items-center justify-center mb-4"
            >
              <img
                src="/images/preggers/Vg1.gif"
                alt="Cargando..."
                className="w-full h-full object-contain filter drop-shadow-2xl pointer-events-none select-none"
              />
            </motion.div>

            {/* 2. Barra de Carga del Color del Sistema */}
            <div className="w-56 md:w-64 h-2.5 bg-white/20 backdrop-blur-md rounded-full overflow-hidden relative shadow-inner mb-3">
              <motion.div
                className="absolute top-0 bottom-0 rounded-full"
                style={{
                  backgroundColor: systemColor,
                  boxShadow: `0 0 14px ${systemColor}`,
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

            {/* 3. Frase abajo de la barra */}
            <p className="text-white/95 text-xs md:text-sm font-extrabold tracking-wide drop-shadow-md">
              {subtitle || "optimizando y preparando las imágenes..."}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
