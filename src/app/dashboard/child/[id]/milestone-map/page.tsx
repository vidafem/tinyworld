"use client";

import React, { useState, useEffect, use } from "react";
import { 
  ChevronLeft, Star, Lock, PartyPopper, Undo2, 
  Plus, X, Edit3, Trash2, Calendar, Sparkles, Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import AppButton from "@/components/Common/AppButton";
import confetti from "canvas-confetti";
import FloatingToast, { ToastData } from "@/components/Common/FloatingToast";
import CardStyleHeaderButton from "@/components/Common/CardStyleHeaderButton";
import { motion, AnimatePresence } from "framer-motion";

interface MilestoneItem {
  id: number | string;
  title: string;
  subtitle: string;
  date?: string;
  photo_url?: string;
  category?: string;
}

const DEFAULT_MILESTONES: MilestoneItem[] = [
  { id: 1, title: "Primera Sonrisa", subtitle: "Una carita que ilumina el mundo", category: "🌟" },
  { id: 2, title: "Primer Balbuceo", subtitle: "Descubriendo los primeros sonidos", category: "🗣️" },
  { id: 3, title: "Primer Dientecito", subtitle: "¡Cuidado con las mordiditas!", category: "🦷" },
  { id: 4, title: "Se Sienta Solito", subtitle: "Un gran paso para su motricidad", category: "🧘" },
  { id: 5, title: "Primeros Gateos", subtitle: "¡Explorando toda la casa!", category: "🐾" },
  { id: 6, title: "Primeros Pasitos", subtitle: "Caminando hacia nuevas aventuras", category: "🚶" },
];

export default function MilestoneMapPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [unlockedNodes, setUnlockedNodes] = useState<(number | string)[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Modales
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);

  // Campos de formulario
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCategory, setFormCategory] = useState("🌟");

  const resolvedParams = use(params);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    loadChildAndMilestones(resolvedParams.id);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, [resolvedParams.id]);

  async function loadChildAndMilestones(id: string) {
    try {
      const { data } = await supabase.from("children").select("*").eq("id", id).single();
      if (data) {
        setChild(data);
        
        // Cargar desde la nube (preview_config) o localStorage
        const cloudMilestones = data.preview_config?.custom_milestones;
        const cloudProgress = data.preview_config?.milestones_progress;

        const savedMilestones = localStorage.getItem(`custom_milestones_${id}`);
        const savedProgress = localStorage.getItem(`milestones_progress_${id}`);

        let initialMilestones: MilestoneItem[] = DEFAULT_MILESTONES;
        if (Array.isArray(cloudMilestones) && cloudMilestones.length > 0) {
          initialMilestones = cloudMilestones;
        } else if (savedMilestones) {
          try {
            initialMilestones = JSON.parse(savedMilestones);
          } catch (e) {}
        }

        let initialProgress: (number | string)[] = [];
        if (Array.isArray(cloudProgress)) {
          initialProgress = cloudProgress;
        } else if (savedProgress) {
          try {
            initialProgress = JSON.parse(savedProgress);
          } catch (e) {}
        }

        setMilestones(initialMilestones);
        setUnlockedNodes(initialProgress);
        localStorage.setItem(`custom_milestones_${id}`, JSON.stringify(initialMilestones));
        localStorage.setItem(`milestones_progress_${id}`, JSON.stringify(initialProgress));
      }
    } catch (err) {
      console.error("Error loading child/milestones:", err);
    }
  }

  // Guardar en Estado + LocalStorage + Supabase
  const persistState = async (newMilestones: MilestoneItem[], newProgress: (number | string)[]) => {
    setMilestones(newMilestones);
    setUnlockedNodes(newProgress);
    localStorage.setItem(`custom_milestones_${resolvedParams.id}`, JSON.stringify(newMilestones));
    localStorage.setItem(`milestones_progress_${resolvedParams.id}`, JSON.stringify(newProgress));

    if (child) {
      try {
        const updatedConfig = {
          ...(child.preview_config || {}),
          custom_milestones: newMilestones,
          milestones_progress: newProgress
        };
        await supabase
          .from("children")
          .update({ preview_config: updatedConfig })
          .eq("id", resolvedParams.id);
      } catch (err) {
        console.warn("Error syncing milestones to Supabase:", err);
      }
    }
  };

  const handleOpenAdd = () => {
    setEditingMilestone(null);
    setFormTitle("");
    setFormSubtitle("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormCategory("🌟");
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (m: MilestoneItem) => {
    setEditingMilestone(m);
    setFormTitle(m.title);
    setFormSubtitle(m.subtitle || "");
    setFormDate(m.date || "");
    setFormCategory(m.category || "🌟");
    setSelectedMilestone(null);
    setShowAddEditModal(true);
  };

  const handleSaveMilestone = async () => {
    if (!formTitle.trim()) {
      setToast({ type: "error", message: "El título del logro es requerido" });
      return;
    }

    if (editingMilestone) {
      // Editar existente
      const updated = milestones.map((m) =>
        m.id === editingMilestone.id
          ? {
              ...m,
              title: formTitle.trim(),
              subtitle: formSubtitle.trim() || "Momento mágico",
              date: formDate || undefined,
              category: formCategory
            }
          : m
      );
      await persistState(updated, unlockedNodes);
      setToast({ type: "success", message: "¡Logro actualizado con éxito!" });
    } else {
      // Crear nuevo
      const newItem: MilestoneItem = {
        id: Date.now(),
        title: formTitle.trim(),
        subtitle: formSubtitle.trim() || "Aventura en progreso",
        date: formDate || undefined,
        category: formCategory
      };
      const updated = [...milestones, newItem];
      await persistState(updated, unlockedNodes);
      setToast({ type: "success", message: "¡Nuevo logro añadido al camino!" });
    }

    setShowAddEditModal(false);
    setEditingMilestone(null);
  };

  const handleDeleteMilestone = async (id: number | string) => {
    const updated = milestones.filter((m) => m.id !== id);
    const updatedProgress = unlockedNodes.filter((nodeId) => nodeId !== id);
    await persistState(updated, updatedProgress);
    setSelectedMilestone(null);
    setToast({ type: "info", message: "Logro eliminado del camino" });
  };

  const toggleNode = async (id: number | string, isNext: boolean) => {
    if (unlockedNodes.includes(id)) {
      // Revertir desde este nodo
      const idx = unlockedNodes.indexOf(id);
      const newNodes = unlockedNodes.slice(0, idx);
      await persistState(milestones, newNodes);
      setToast({ type: "info", message: "Progreso revertido" });
      setSelectedMilestone(null);
      return;
    }

    if (isNext) {
      const newNodes = [...unlockedNodes, id];
      await persistState(milestones, newNodes);
      const m = milestones.find((x) => x.id === id);
      setToast({ type: "success", message: `¡Superaste: ${m?.title}! 🥳` });
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    const duration = 2200;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ["#84CC78", "#74C6C8", "#EAA641", "#EC4899"]
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ["#84CC78", "#74C6C8", "#EAA641", "#EC4899"]
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
    <div className={`min-h-screen ${theme.bg} bg-texture flex flex-col pb-28`}>
      <FloatingToast toast={toast} onClose={() => setToast(null)} />
      
      {/* Header Sticky */}
      <header className="px-4 py-3.5 flex items-center justify-between bg-white/85 dark:bg-stone-900/85 backdrop-blur-xl sticky top-0 z-50 border-b border-white/60 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <AppButton
            variant="secondary"
            size="icon"
            onClick={() => router.push(`/dashboard/child/${child.id}`)}
            icon={<ChevronLeft size={20} className={theme.text} />}
          />
          <CardStyleHeaderButton
            childId={child.id}
            cardKey="map"
            title="Logros"
            theme={theme}
            isMobile={isMobile}
          />
          <div>
            <h1 className={`font-outfit font-black ${theme.text} text-base md:text-xl tracking-tight leading-tight`}>
              Camino de Logros 🗺️
            </h1>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              {unlockedNodes.length} de {milestones.length} conseguidos
            </p>
          </div>
        </div>

        <AppButton
          variant="primary"
          theme={theme}
          size="sm"
          onClick={handleOpenAdd}
          icon={<Plus size={16} />}
        >
          <span className="hidden sm:inline">Nuevo Logro</span>
        </AppButton>
      </header>

      {/* Main Map Path */}
      <main className="flex-1 w-full max-w-2xl mx-auto py-12 px-4 relative flex flex-col-reverse items-center justify-start overflow-hidden min-h-[60vh]">
        {milestones.length === 0 ? (
          <div className="text-center bg-white/85 backdrop-blur-md p-8 rounded-[2.5rem] border-2 border-dashed border-[#EAA641] text-[#EAA641] max-w-sm mt-10 shadow-lg">
            <Star size={42} className="mx-auto mb-4" />
            <h2 className="font-black text-xl mb-2 font-outfit">¡El Camino está Listo!</h2>
            <p className="font-bold text-xs mb-6 text-stone-600 font-quicksand">
              Comienza a registrar las grandes hazañas de tu bebé añadiendo su primer logro.
            </p>
            <AppButton variant="primary" theme={theme} onClick={handleOpenAdd}>
              Añadir el Primer Logro
            </AppButton>
          </div>
        ) : (
          <>
            <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-6 py-3.5 rounded-full shadow-lg border border-amber-300 dark:border-amber-700/60 mb-8 font-black uppercase tracking-widest text-xs flex items-center gap-2 text-amber-600 dark:text-amber-400 z-20">
              <Star size={18} fill="currentColor" />
              <span>¡Comienzo de la gran aventura!</span>
            </div>

            {/* SVG Curved Path */}
            <div className="absolute left-1/2 -translate-x-1/2 w-[240px] z-0" style={{ height: mapHeight, bottom: 80 }}>
              <svg width="100%" height="100%" overflow="visible">
                <path
                  d={`M 120 ${mapHeight} ${milestones.map((_, i) => {
                    const y = mapHeight - (i + 1) * 150;
                    const x = i % 2 === 0 ? 220 : 20;
                    const prevX = i === 0 ? 120 : (i - 1) % 2 === 0 ? 220 : 20;
                    return `C ${prevX} ${y + 75}, ${x} ${y + 75}, ${x} ${y}`;
                  }).join(" ")}`}
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
                  }).join(" ")}`}
                  fill="transparent"
                  stroke={theme.hex || "#74C6C8"}
                  strokeWidth="14"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
            </div>

            {/* Milestone Nodes */}
            <div className="relative w-full max-w-[400px] z-10" style={{ height: mapHeight }}>
              {milestones.map((node, index) => {
                const isUnlocked = unlockedNodes.includes(node.id);
                const isNext = unlockedNodes.length === 0 ? index === 0 : node.id === milestones[unlockedNodes.length]?.id;
                
                const xPos = index % 2 === 0 ? "right-0 md:-right-8" : "left-0 md:-left-8";
                const yPos = mapHeight - (index + 1) * 150 - 40;

                return (
                  <motion.div
                    key={node.id}
                    className={`absolute ${xPos}`}
                    style={{ top: yPos }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <div className="relative group flex items-center justify-center">
                      {/* Floating Info Tag with Edit Button */}
                      <div className={`absolute ${index % 2 === 0 ? "right-full mr-5" : "left-full ml-5"} w-40 md:w-52 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-2 ${isUnlocked ? "border-amber-400/80 shadow-amber-200/50" : "border-stone-200 dark:border-stone-800"} rounded-2xl p-3.5 shadow-xl z-20 transition-all`}>
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            {node.category && <span className="text-sm shrink-0">{node.category}</span>}
                            <h3 className={`font-black text-xs md:text-sm font-outfit truncate ${isUnlocked ? theme.text : "text-stone-400"}`}>
                              {node.title}
                            </h3>
                          </div>
                          {/* Botón directo de editar */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(node);
                            }}
                            className="p-1 text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors shrink-0"
                            title="Editar logro"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                        <p className="text-[9px] md:text-[10px] text-stone-500 font-bold uppercase tracking-wider leading-tight mt-1 line-clamp-2">
                          {isUnlocked ? node.subtitle : "Toca para desbloquear"}
                        </p>
                        {isUnlocked && node.date && (
                          <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mt-1 block">
                            📅 {new Date(node.date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>

                      {/* Main Node Circle */}
                      <motion.div 
                        whileHover={(isNext || isUnlocked) ? { scale: 1.08 } : {}}
                        whileTap={(isNext || isUnlocked) ? { scale: 0.94 } : {}}
                        onClick={() => {
                          if (isUnlocked) {
                            setSelectedMilestone(node);
                          } else if (isNext) {
                            toggleNode(node.id, true);
                          }
                        }}
                        className={`w-20 h-20 md:w-24 md:h-24 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 relative cursor-pointer ${
                          isUnlocked 
                            ? "border-4 border-white text-white" 
                            : isNext 
                              ? "bg-white border-4 border-amber-400 text-amber-500 animate-bounce shadow-amber-200"
                              : "bg-stone-100 border-4 border-stone-300 text-stone-300 opacity-75 cursor-not-allowed"
                        }`}
                        style={{
                          backgroundColor: isUnlocked ? theme.hex : undefined,
                          boxShadow: isUnlocked ? `0 10px 25px -5px ${theme.hex}66` : undefined
                        }}
                      >
                        {isUnlocked ? (
                          node.photo_url ? (
                            <img
                              src={node.photo_url}
                              alt={node.title}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <Star size={isMobile ? 30 : 38} fill="currentColor" />
                          )
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
        onClick={handleOpenAdd}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white z-50 ${theme.primaryBg} hover:scale-110 active:scale-95 transition-transform sm:hidden`}
      >
        <Plus size={26} />
      </button>

      {/* MODAL DETALLE DE LOGRO DESBLOQUEADO */}
      <AnimatePresence>
        {selectedMilestone && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-white/80 dark:border-stone-800 text-center relative"
            >
              <button
                onClick={() => setSelectedMilestone(null)}
                className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner mb-4 text-2xl">
                {selectedMilestone.category || "⭐"}
              </div>

              <h3 className="font-outfit font-black text-xl text-stone-800 dark:text-stone-100 mb-1">
                {selectedMilestone.title}
              </h3>

              <p className="text-xs text-stone-500 font-quicksand font-bold mb-4">
                {selectedMilestone.subtitle}
              </p>

              {selectedMilestone.date && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-full text-[11px] font-black uppercase tracking-wider mb-5">
                  <Calendar size={13} />
                  <span>Conseguido: {new Date(selectedMilestone.date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              )}

              {selectedMilestone.photo_url && (
                <div className="w-full h-44 rounded-2xl overflow-hidden mb-5 border-2 border-stone-100 shadow-md">
                  <img
                    src={selectedMilestone.photo_url}
                    alt={selectedMilestone.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Acciones: Editar, Revertir, Eliminar */}
              <div className="space-y-2 pt-2">
                <AppButton
                  variant="primary"
                  theme={theme}
                  className="w-full"
                  onClick={() => handleOpenEdit(selectedMilestone)}
                  icon={<Edit3 size={16} />}
                >
                  Editar este Logro
                </AppButton>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleNode(selectedMilestone.id, false)}
                    className="py-3 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-outfit font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Undo2 size={14} />
                    <span>Revertir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(selectedMilestone.id)}
                    className="py-3 px-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 font-outfit font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CREAR / EDITAR LOGRO */}
      <AnimatePresence>
        {showAddEditModal && (
          <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/80 dark:border-stone-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-2xl ${theme.bg} ${theme.text}`}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-outfit font-black text-lg text-stone-800 dark:text-stone-100">
                      {editingMilestone ? "Editar Logro" : "Nuevo Logro Mágico"}
                    </h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                      {editingMilestone ? "Modifica los datos del hito" : "Agrega una nueva meta al camino"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddEditModal(false)} 
                  className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Categoría / Emoji selector */}
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-400 mb-1.5 block">
                    Ícono del Hito
                  </label>
                  <div className="flex items-center gap-2">
                    {["🌟", "🦷", "🚶", "🗣️", "🥣", "🐾", "🎉", "💤"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormCategory(emoji)}
                        className={`w-10 h-10 rounded-2xl text-lg flex items-center justify-center transition-all ${
                          formCategory === emoji
                            ? "bg-amber-100 dark:bg-amber-950 border-2 border-amber-400 scale-110 shadow-sm"
                            : "bg-stone-100 dark:bg-stone-800 hover:scale-105"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-400 block mb-1">
                    Título del Logro
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej. Primer Dientecito, Se sienta solo..."
                    className="w-full p-3.5 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-2xl outline-none focus:border-stone-800 font-outfit font-black text-sm text-stone-800 dark:text-stone-100 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-400 block mb-1">
                    Subtítulo o Anécdota
                  </label>
                  <input 
                    type="text" 
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="Ej. ¡Mordiendo todo feliz!"
                    className="w-full p-3.5 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-2xl outline-none focus:border-stone-800 font-bold text-xs text-stone-700 dark:text-stone-200 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-400 block mb-1">
                    Fecha en que se logró (Opcional)
                  </label>
                  <input 
                    type="date" 
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-3.5 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-2xl outline-none focus:border-stone-800 font-bold text-xs text-stone-700 dark:text-stone-200 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="w-1/3 py-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-outfit font-black text-xs uppercase tracking-wider hover:bg-stone-200 transition-colors"
                >
                  Cancelar
                </button>
                <AppButton 
                  variant="primary" 
                  theme={theme} 
                  className="flex-1"
                  onClick={handleSaveMilestone}
                  icon={<Check size={16} />}
                >
                  {editingMilestone ? "Guardar Cambios" : "Añadir al Camino"}
                </AppButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
