"use client";

import React, { useState, useEffect, use } from "react";
import { ChevronLeft, Star, Lock, PartyPopper, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import AppButton from "@/components/Common/AppButton";
import confetti from "canvas-confetti";
import FloatingToast, { ToastData } from "@/components/Common/FloatingToast";
import { motion } from "framer-motion";

interface MilestoneMapProps {
  params: Promise<{ id: string }>;
}

const MILESTONES = [
  { id: 1, title: "1er Mes", subtitle: "Conociendo el mundo" },
  { id: 2, title: "Primeras Sonrisas", subtitle: "Alegrando corazones" },
  { id: 3, title: "Descubre sus Manos", subtitle: "El mundo a su alcance" },
  { id: 4, title: "Se da la Vuelta", subtitle: "Nuevas perspectivas" },
  { id: 5, title: "6 Meses", subtitle: "Medio año de magia" },
  { id: 6, title: "Primeros Sabores", subtitle: "Descubriendo comidas" },
  { id: 7, title: "Primeros Gateos", subtitle: "Explorando la casa" },
  { id: 8, title: "Se pone de Pie", subtitle: "Alcanzando las estrellas" },
  { id: 9, title: "Primeras Palabras", subtitle: "Escuchando su voz" },
  { id: 10, title: "1 Año Mágico", subtitle: "Su primera gran vuelta al sol" },
];

export default function MilestoneMapPage({ params }: MilestoneMapProps) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [unlockedNodes, setUnlockedNodes] = useState<number[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const resolvedParams = use(params);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    loadChild(resolvedParams.id);
    loadProgress();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [resolvedParams.id]);

  async function loadChild(id: string) {
    const { data } = await supabase.from("children").select("*").eq("id", id).single();
    if (data) setChild(data);
  }

  function loadProgress() {
    const saved = localStorage.getItem(`milestones_${resolvedParams.id}`);
    if (saved) {
      setUnlockedNodes(JSON.parse(saved));
    }
  }

  const toggleNode = (id: number) => {
    // Si ya está desbloqueado, lo bloqueamos (undo) y todos los posteriores
    if (unlockedNodes.includes(id)) {
      const newNodes = unlockedNodes.filter(n => n < id);
      setUnlockedNodes(newNodes);
      localStorage.setItem(`milestones_${resolvedParams.id}`, JSON.stringify(newNodes));
      setToast({ type: "info", message: "Progreso revertido" });
      return;
    }

    // Si no está desbloqueado, lo desbloqueamos si es el siguiente
    const isNext = unlockedNodes.length === 0 ? id === 1 : id === unlockedNodes[unlockedNodes.length - 1] + 1;
    
    if (isNext) {
      const newNodes = [...unlockedNodes, id];
      setUnlockedNodes(newNodes);
      localStorage.setItem(`milestones_${resolvedParams.id}`, JSON.stringify(newNodes));
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#84CC78', '#74C6C8', '#EAA641']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#84CC78', '#74C6C8', '#EAA641']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;
  
  const mapHeight = MILESTONES.length * 150 + 100;

  // Renderizamos de abajo (inicio) hacia arriba
  return (
    <div className={`min-h-screen ${theme.bg} bg-texture flex flex-col`}>
      <FloatingToast toast={toast} onClose={() => setToast(null)} />
      
      <header className="px-4 py-3 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/60 shadow-sm">
        <div className="flex items-center gap-3">
          <AppButton
            variant="secondary"
            size="icon"
            onClick={() => router.push(`/dashboard/child/${child.id}`)}
            icon={<ChevronLeft size={20} className={theme.text} />}
          />
          <h1 className={`font-outfit font-black ${theme.text} text-lg md:text-xl tracking-tight`}>
            Camino Mágico 🗺️
          </h1>
        </div>
      </header>

      {/* Contenedor desplazable que inicia desde abajo */}
      <main className="flex-1 w-full max-w-2xl mx-auto py-12 px-4 relative flex flex-col-reverse items-center justify-start overflow-hidden">
        
        {/* Etiqueta Inicio en la parte inferior */}
        <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-full shadow-lg border-2 border-[#EAA641] mb-8 font-black uppercase tracking-widest text-sm flex items-center gap-2 text-[#EAA641] z-20">
          <Star size={18} fill="currentColor" />
          ¡El comienzo de la aventura!
        </div>

        {/* Path SVG dibujado dinámicamente */}
        <div className="absolute left-1/2 -translate-x-1/2 w-[240px] z-0" style={{ height: mapHeight, bottom: 80 }}>
          <svg width="100%" height="100%" overflow="visible">
            {/* Línea de fondo (gris punteada) */}
            <path
              d={`M 120 ${mapHeight} ${MILESTONES.map((_, i) => {
                const y = mapHeight - (i + 1) * 150;
                const x = i % 2 === 0 ? 220 : 20;
                const prevX = i === 0 ? 120 : (i - 1) % 2 === 0 ? 220 : 20;
                return `C ${prevX} ${y + 75}, ${x} ${y + 75}, ${x} ${y}`;
              }).join(' ')}`}
              fill="transparent"
              stroke="#E5E7EB"
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray="10 20"
            />
            {/* Línea de progreso rellenada */}
            <motion.path
              d={`M 120 ${mapHeight} ${MILESTONES.slice(0, unlockedNodes.length).map((_, i) => {
                const y = mapHeight - (i + 1) * 150;
                const x = i % 2 === 0 ? 220 : 20;
                const prevX = i === 0 ? 120 : (i - 1) % 2 === 0 ? 220 : 20;
                return `C ${prevX} ${y + 75}, ${x} ${y + 75}, ${x} ${y}`;
              }).join(' ')}`}
              fill="transparent"
              stroke="#74C6C8" // Turquesa bonito
              strokeWidth="12"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
        </div>

        {/* Nodos interactivos */}
        <div className="relative w-full max-w-[400px] z-10" style={{ height: mapHeight }}>
          {MILESTONES.map((node, index) => {
            const isUnlocked = unlockedNodes.includes(node.id);
            const isNext = unlockedNodes.length === 0 ? index === 0 : node.id === unlockedNodes[unlockedNodes.length - 1] + 1;
            
            const xPos = index % 2 === 0 ? 'right-0 md:-right-8' : 'left-0 md:-left-8';
            const yPos = mapHeight - (index + 1) * 150 - 40;

            return (
              <motion.div
                key={node.id}
                className={`absolute ${xPos}`}
                style={{ top: yPos }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative group cursor-pointer flex items-center justify-center" onClick={() => (isNext || isUnlocked) && toggleNode(node.id)}>
                  
                  {/* Tooltip moderno */}
                  <div className={`absolute ${index % 2 === 0 ? 'right-full mr-6' : 'left-full ml-6'} w-36 md:w-48 bg-white/95 backdrop-blur-sm border-2 ${isUnlocked ? 'border-[#74C6C8]' : 'border-stone-200'} rounded-2xl p-4 shadow-xl pointer-events-none z-20`}>
                    <h3 className={`font-black text-xs md:text-sm ${isUnlocked ? 'text-[#0D6E70]' : 'text-stone-400'}`}>
                      {node.title}
                    </h3>
                    <p className="text-[9px] md:text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-tight mt-1">
                      {isUnlocked ? node.subtitle : 'Desbloquea para ver'}
                    </p>
                  </div>

                  {/* Icono de deshacer si está desbloqueado y es hover */}
                  {isUnlocked && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-rose-400 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <Undo2 size={14} />
                    </div>
                  )}

                  {/* Nodo principal */}
                  <motion.div 
                    whileHover={(isNext || isUnlocked) ? { scale: 1.1 } : {}}
                    whileTap={(isNext || isUnlocked) ? { scale: 0.9 } : {}}
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-full shadow-2xl flex items-center justify-center transition-colors duration-500 relative ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-[#74C6C8] to-[#168B8D] border-4 border-white text-white' 
                        : isNext 
                          ? 'bg-white border-4 border-[#EAA641] text-[#EAA641] animate-bounce'
                          : 'bg-stone-100 border-4 border-stone-300 text-stone-300 opacity-80'
                    }`}
                  >
                    {isUnlocked ? (
                      <Star size={isMobile ? 28 : 36} fill="currentColor" />
                    ) : isNext ? (
                      <PartyPopper size={isMobile ? 28 : 36} />
                    ) : (
                      <Lock size={isMobile ? 24 : 32} />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
