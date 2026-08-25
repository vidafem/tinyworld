"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Plus, Trash2, Loader2, Sparkles, X, Heart, CalendarDays, Images, BookOpen 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import PregnancyHub from "./Pregnancy/PregnancyHub";
import { playSoftPop, playActionSnap } from "@/lib/pageSound";
import { renderCardIcon } from "@/lib/cardStyles";

interface LifetimeHubProps {
  childId: string;
}

interface LifeSection {
  id: string;
  child_id: string;
  title: string;
  created_at: string;
  is_favorite?: boolean;
  card_color?: string | null;
  card_icon?: string | null;
}

export default function LifetimeHub({ childId }: LifetimeHubProps) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<LifeSection[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState("");
  const [savingStage, setSavingStage] = useState(false);
  const [selectedStage, setSelectedStage] = useState<LifeSection | null>(null);
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<LifeSection | null>(null);

  useEffect(() => {
    async function loadData() {
      const [childRes, stagesRes] = await Promise.all([
        supabase.from("children").select("*").eq("id", childId).single(),
        supabase.from("life_sections").select("*").eq("child_id", childId).order("created_at", { ascending: true })
      ]);

      if (childRes.data) setChild(childRes.data);
      if (stagesRes.data) {
        setStages(stagesRes.data);
        const sectionParam = typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("section")
          : null;
        const requestedStage = sectionParam
          ? (stagesRes.data as LifeSection[]).find((stage) => stage.id === sectionParam)
          : null;
        if (requestedStage) setSelectedStage(requestedStage);
      }
      setLoading(false);
    }
    loadData();
  }, [childId]);

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageTitle.trim()) return;

    setSavingStage(true);
    try {
      const { data, error } = await supabase
        .from("life_sections")
        .insert({
          child_id: childId,
          title: newStageTitle.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setStages([...stages, data]);
      setNewStageTitle("");
      setShowAddModal(false);
    } catch (err) {
      console.error("Error creating stage:", err);
      alert("No se pudo crear la etapa de vida.");
    } finally {
      setSavingStage(false);
    }
  };

  const handleDeleteClick = (stage: LifeSection, e: React.MouseEvent) => {
    e.stopPropagation();
    setStageToDelete(stage);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStage = async () => {
    if (!stageToDelete) return;
    const id = stageToDelete.id;
    setDeletingStageId(id);
    setShowDeleteConfirm(false);
    try {
      const { error } = await supabase.from("life_sections").delete().eq("id", id);
      if (error) throw error;
      setStages(stages.filter(s => s.id !== id));
    } catch (err) {
      console.error("Error deleting stage:", err);
      alert("No se pudo eliminar la etapa.");
    } finally {
      setDeletingStageId(null);
      setStageToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-texture">
        <Loader2 className="animate-spin text-black/20" size={48} />
      </div>
    );
  }

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;

  // Render pregnancy hub if a stage is selected
  if (selectedStage) {
    return (
      <PregnancyHub 
        childId={childId} 
        sectionId={selectedStage.id} 
        sectionTitle={selectedStage.title} 
        onBack={() => {
          setSelectedStage(null);
          // Recargar etapas al volver
          supabase.from("life_sections").select("*").eq("child_id", childId).order("created_at", { ascending: true })
            .then(({ data }) => { if (data) setStages(data); });
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture transition-colors duration-500 flex flex-col relative pb-20`}>
      
      <header className="px-4 md:px-6 py-4 flex items-center justify-between bg-white/60 backdrop-blur-xl sticky top-0 z-[50] shadow-sm border-b border-white/50">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => { playActionSnap(); router.push(`/dashboard/child/${childId}`); }} 
            className={`p-2.5 bg-white rounded-2xl shadow-sm ${theme.text} hover:scale-110 transition-all border ${theme.borderAccent}`}
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className={`font-outfit font-black text-lg md:text-xl ${theme.text} leading-tight`}>Toda una Vida</h1>
            <p className={`text-[10px] ${theme.text} opacity-50 uppercase tracking-wider font-bold`}>El diario de {child.nickname || child.name}</p>
          </div>
        </div>

      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col gap-8">
        
        {/* Life Stages list */}
        <div>
          <h3 className={`font-outfit font-black text-xs ${theme.text} opacity-40 uppercase tracking-[0.2em] mb-4`}>Etapas de la Vida</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Baúl de Recuerdos */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              onClick={() => router.push(`/dashboard/child/${childId}/memories`)}
              className="bg-white/60 hover:bg-white backdrop-blur-md p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl border border-white/50 cursor-pointer flex flex-col justify-between min-h-[160px] relative group overflow-hidden transition-all"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${theme.bg} text-white shrink-0 shadow-inner border border-white`}>
                  <Sparkles size={20} className={theme.text} />
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className={`font-outfit font-black text-lg md:text-xl ${theme.text} leading-snug group-hover:translate-x-1 transition-transform`}>
                  Baúl de Recuerdos
                </h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                  Línea de tiempo consolidada
                </p>
              </div>

              {/* Micro-illustration behind card */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-black/[0.02] rounded-full group-hover:scale-150 transition-transform duration-700" />
            </motion.div>

            {/* Card 2: Quick Add Stage Card */}
            <motion.div
              whileHover={{ y: -6 }}
              onClick={() => setShowAddModal(true)}
              className="bg-white/30 hover:bg-white/55 backdrop-blur-sm p-6 rounded-[2.5rem] border border-dashed border-white/60 cursor-pointer flex flex-col items-center justify-center min-h-[160px] transition-all group"
            >
              <div className={`p-4 rounded-full bg-white/80 ${theme.text} group-hover:scale-110 shadow-sm transition-transform mb-3`}>
                <Plus size={24} />
              </div>
              <span className={`font-outfit font-black text-xs uppercase tracking-wider ${theme.text} opacity-60 group-hover:opacity-100 transition-opacity`}>
                Nueva Etapa de Vida
              </span>
            </motion.div>

            {/* User Stages */}
            {stages.map((stage, idx) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -6 }}
                onClick={() => { playSoftPop(); setSelectedStage(stage); }}
                className="bg-white/60 hover:bg-white backdrop-blur-md p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl border border-white/50 cursor-pointer flex flex-col justify-between min-h-[160px] relative group overflow-hidden transition-all"
                style={{ backgroundColor: stage.card_color || undefined }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        playSoftPop();
                        try {
                          const nextFav = !stage.is_favorite;
                          const { error } = await supabase
                            .from("life_sections")
                            .update({ is_favorite: nextFav })
                            .eq("id", stage.id);
                          if (error) throw error;
                          setStages(stages.map(s => s.id === stage.id ? { ...s, is_favorite: nextFav } : s));
                        } catch (err) {
                          console.error("Error toggling favorite:", err);
                        }
                      }}
                      className={`p-3 rounded-2xl transition-all shadow-inner border hover:scale-105 active:scale-95 relative z-10 ${
                        stage.is_favorite 
                          ? `${theme.primaryBg} text-white border-white` 
                          : `bg-white ${theme.text} ${theme.borderAccent}`
                      }`}
                    >
                      <Heart size={20} className={stage.is_favorite ? 'fill-current' : ''} />
                    </button>
                    <div className={`px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 relative z-10 border ${
                      stage.is_favorite 
                        ? `bg-white/90 ${theme.text} border-white/60 shadow-sm` 
                        : "bg-white/30 text-stone-400 border-white/20"
                    }`}>
                      <Heart size={10} className={`transition-all duration-300 ${stage.is_favorite ? "fill-current text-red-500 scale-110" : "text-stone-400/60"}`} />
                      <span>Favorito</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl bg-white/75 ${theme.text} shrink-0 shadow-inner border border-white`}>
                    <div className="h-5 w-5 flex items-center justify-center">
                      {renderCardIcon(stage.card_icon || "Sparkles", 20)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { playSoftPop(); handleDeleteClick(stage, e); }}
                    disabled={deletingStageId === stage.id}
                    className="p-2 bg-transparent hover:bg-red-50 text-red-400 hover:text-red-600 rounded-full transition-colors relative z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    {deletingStageId === stage.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
                
                <div className="mt-4">
                  <h4 className={`font-outfit font-black text-lg md:text-xl ${theme.text} leading-snug group-hover:translate-x-1 transition-transform`}>
                    {stage.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                    Creado el {new Date(stage.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Micro-illustration behind card */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-black/[0.02] rounded-full group-hover:scale-150 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Stage Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative border border-white/60 z-10"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className={`absolute top-6 right-6 p-2 hover:${theme.bgLight} rounded-full ${theme.text} transition-colors`}
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className={`font-outfit font-black text-xl ${theme.text}`}>Nueva Etapa</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Registra un nuevo capítulo de vida</p>
                </div>
              </div>

              <form onSubmit={handleAddStage} className="space-y-5">
                <div>
                  <label className={`block font-outfit font-black text-[10px] ${theme.text} uppercase tracking-wider mb-2`}>
                    Título de la Etapa
                  </label>
                  <input
                    type="text"
                    required
                    value={newStageTitle}
                    onChange={(e) => setNewStageTitle(e.target.value)}
                    placeholder="Ej. Su Primer Cumpleaños, Primeros Pasos..."
                    className={`w-full px-4 py-3 bg-gray-50 border ${theme.borderAccent} rounded-xl outline-none font-outfit text-sm ${theme.text} placeholder-gray-300 focus:bg-white focus:border-current transition-all`}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingStage || !newStageTitle.trim()}
                    className={`flex-1 py-3.5 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} disabled:bg-gray-300 disabled:text-gray-400 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2`}
                  >
                    {savingStage ? <Loader2 size={16} className="animate-spin" /> : "Crear Etapa"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && stageToDelete && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!deletingStageId) {
                  setShowDeleteConfirm(false);
                  setStageToDelete(null);
                }
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative border border-white/60 z-10 text-center"
            >
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setStageToDelete(null);
                }}
                disabled={deletingStageId === stageToDelete.id}
                className={`absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors`}
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center mb-6">
                <div className="p-4 rounded-full bg-red-50 text-red-500 mb-4 shadow-inner border border-red-100">
                  <Trash2 size={32} />
                </div>
                <h3 className={`font-outfit font-black text-xl text-gray-900`}>¿Eliminar Etapa?</h3>
                <p className="text-[11px] text-red-500 font-bold uppercase tracking-wider mt-1">Esta acción es irreversible</p>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                ¿Estás seguro de que quieres eliminar la etapa <strong className="text-gray-800">"{stageToDelete.title}"</strong>? Se borrará permanentemente todo su historial, fotos, calendarios y páginas del álbum.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={deletingStageId === stageToDelete.id}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setStageToDelete(null);
                  }}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteStage}
                  disabled={deletingStageId === stageToDelete.id}
                  className={`flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2`}
                >
                  {deletingStageId === stageToDelete.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Sí, Eliminar"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
