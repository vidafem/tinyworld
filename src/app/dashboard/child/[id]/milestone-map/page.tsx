"use client";

import React, { useState, useEffect, use } from "react";
import { ChevronLeft, Star, Lock, PartyPopper, Undo2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import AppButton from "@/components/Common/AppButton";
import confetti from "canvas-confetti";
import FloatingToast, { ToastData } from "@/components/Common/FloatingToast";
import { motion, AnimatePresence } from "framer-motion";

interface MilestoneMapProps {
  params: Promise<{ id: string }>;
}

export default function MilestoneMapPage({ params }: MilestoneMapProps) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [milestones, setMilestones] = useState<{id: number, title: string, subtitle: string}[]>([]);
  const [unlockedNodes, setUnlockedNodes] = useState<number[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");

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
    const savedMilestones = localStorage.getItem(`custom_milestones_${resolvedParams.id}`);
    if (savedMilestones) {
      setMilestones(JSON.parse(savedMilestones));
    }

    const savedNodes = localStorage.getItem(`milestones_progress_${resolvedParams.id}`);
    if (savedNodes) {
      setUnlockedNodes(JSON.parse(savedNodes));
    }
  }

  const handleAddMilestone = () => {
    if (!newTitle.trim()) {
      setToast({ type: "error", message: "El título es requerido" });
      return;
    }
    const newMilestone = {
      id: Date.now(),
      title: newTitle,
      subtitle: newSubtitle || "Aventura en progreso"
    };
    const updated = [...milestones, newMilestone];
    setMilestones(updated);
    localStorage.setItem(`custom_milestones_${resolvedParams.id}`, JSON.stringify(updated));
    setNewTitle("");
    setNewSubtitle("");
    setShowAddModal(false);
    setToast({ type: "success", message: "Logro añadido al mapa" });
  };

  const toggleNode = (id: number, isNext: boolean) => {
    if (unlockedNodes.includes(id)) {
      const idx = unlockedNodes.indexOf(id);
      const newNodes = unlockedNodes.slice(0, idx);
      setUnlockedNodes(newNodes);
      localStorage.setItem(`milestones_progress_${resolvedParams.id}`, JSON.stringify(newNodes));
      setToast({ type: "info", message: "Progreso revertido" });
      return;
    }

    if (isNext) {
      const newNodes = [...unlockedNodes, id];
      setUnlockedNodes(newNodes);
      localStorage.setItem(`milestones_progress_${resolvedParams.id}`, JSON.stringify(newNodes));
      
      const milestone = milestones.find(m => m.id === id);
      setToast({ type: "success", message: `¡Superaste: ${milestone?.title}! 🥳` });
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
  
  const mapHeight = Math.max(milestones.length * 150 + 100, 300);

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture flex flex-col pb-24`}>
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
        <AppButton
          variant="primary"
          theme={theme}
          size="sm"
          onClick={() => setShowAddModal(true)}
          icon={<Plus size={16} />}
        >
          <span className="hidden sm:inline">Nueva Meta</span>
        </AppButton>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto py-12 px-4 relative flex flex-col-reverse items-center justify-start overflow-hidden min-h-[60vh]">
        
        {milestones.length === 0 ? (
          <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-[2rem] border-2 border-dashed border-[#EAA641] text-[#EAA641] max-w-sm mt-10">
            <Star size={40} className="mx-auto mb-4" />
            <h2 className="font-black text-xl mb-2">¡Tu Camino está Vacío!</h2>
            <p className="font-bold text-sm mb-6 text-stone-600">Comienza a marcar los logros de tu pequeño añadiendo una nueva meta.</p>
            <AppButton variant="primary" theme={theme} onClick={() => setShowAddModal(true)}>
              Añadir la Primera Meta
            </AppButton>
          </div>
        ) : (
          <>
            <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-full shadow-lg border-2 border-[#EAA641] mb-8 font-black uppercase tracking-widest text-sm flex items-center gap-2 text-[#EAA641] z-20">
              <Star size={18} fill="currentColor" />
              ¡El comienzo de la aventura!
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 w-[240px] z-0" style={{ height: mapHeight, bottom: 80 }}>
              <svg width="100%" height="100%" overflow="visible">
                <path
                  d={`M 120 ${mapHeight} ${milestones.map((_, i) => {
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
                <motion.path
                  d={`M 120 ${mapHeight} ${milestones.slice(0, unlockedNodes.length).map((_, i) => {
                    const y = mapHeight - (i + 1) * 150;
                    const x = i % 2 === 0 ? 220 : 20;
                    const prevX = i === 0 ? 120 : (i - 1) % 2 === 0 ? 220 : 20;
                    return `C ${prevX} ${y + 75}, ${x} ${y + 75}, ${x} ${y}`;
                  }).join(' ')}`}
                  fill="transparent"
                  stroke="#74C6C8"
                  strokeWidth="12"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
            </div>

            <div className="relative w-full max-w-[400px] z-10" style={{ height: mapHeight }}>
              {milestones.map((node, index) => {
                const isUnlocked = unlockedNodes.includes(node.id);
                const isNext = unlockedNodes.length === 0 ? index === 0 : node.id === milestones[unlockedNodes.length]?.id;
                
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
                    <div className="relative group cursor-pointer flex items-center justify-center" onClick={() => (isNext || isUnlocked) && toggleNode(node.id, isNext)}>
                      
                      <div className={`absolute ${index % 2 === 0 ? 'right-full mr-6' : 'left-full ml-6'} w-36 md:w-48 bg-white/95 backdrop-blur-sm border-2 ${isUnlocked ? 'border-[#74C6C8]' : 'border-stone-200'} rounded-2xl p-4 shadow-xl pointer-events-none z-20`}>
                        <h3 className={`font-black text-xs md:text-sm ${isUnlocked ? 'text-[#0D6E70]' : 'text-stone-400'}`}>
                          {node.title}
                        </h3>
                        <p className="text-[9px] md:text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-tight mt-1">
                          {isUnlocked ? node.subtitle : 'Desbloquea para ver'}
                        </p>
                      </div>

                      {isUnlocked && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-rose-400 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                          <Undo2 size={14} />
                        </div>
                      )}

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
          </>
        )}
      </main>

      {/* FAB para móviles */}
      <button 
        onClick={() => setShowAddModal(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white z-50 ${theme.bg} hover:scale-110 transition-transform sm:hidden`}
      >
        <Plus size={24} />
      </button>

      {/* Modal Agregar Meta */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#FFFDF8] rounded-[2rem] p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-outfit font-black text-xl ${theme.text} flex items-center gap-2`}>
                  <Star size={20} /> Nueva Meta
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-stone-100 text-stone-400 rounded-full hover:bg-stone-200">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-400">Título de la meta</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej. Primer Diente"
                    className="w-full mt-1 p-4 bg-white border-2 border-stone-200 rounded-2xl outline-none focus:border-[#EAA641] font-bold text-stone-700 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-400">Subtítulo (Opcional)</label>
                  <input 
                    type="text" 
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="Ej. Mordiendo todo..."
                    className="w-full mt-1 p-4 bg-white border-2 border-stone-200 rounded-2xl outline-none focus:border-[#EAA641] font-bold text-stone-700 transition-colors"
                  />
                </div>
              </div>

              <AppButton 
                variant="primary" 
                theme={theme} 
                className="w-full mt-8"
                onClick={handleAddMilestone}
              >
                Añadir al Camino
              </AppButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
