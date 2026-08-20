"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Sparkles, ChevronLeft, 
  Calendar, Camera, Heart, 
  Clock, Filter, Trash2, Edit3,
  Loader2, Check, X, Image as ImageIcon,
  History, Bookmark, Video, Mic
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { themePalettes } from "@/lib/themes";

interface Memory {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'pregnancy' | 'general' | 'calendar';
  media_urls?: string[];
  category?: string;
  section_id?: string | null;
}

export default function MemoryHub({ childId }: { childId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState<any>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemory, setNewMemory] = useState({ title: "", content: "", date: new Date().toISOString().split('T')[0], category: "General" });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Estados para el formulario multimedia
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [error, setError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    loadData();
  }, [childId]);

  async function loadData() {
    setLoading(true);
    try {
      const [childRes, pregMems, genMems, lifeSectionsRes] = await Promise.all([
        supabase.from("children").select("*").eq("id", childId).single(),
        supabase.from("pregnancy_memories").select("*").eq("child_id", childId),
        supabase.from("general_memories").select("*").eq("child_id", childId).order('memory_date', { ascending: false }),
        supabase.from("life_sections").select("*").eq("child_id", childId)
      ]);

      if (childRes.data) setChild(childRes.data);
      if (lifeSectionsRes.data) setStages(lifeSectionsRes.data);

      const allMemories: Memory[] = [];

      // 1. Recuerdos de Embarazo
      pregMems.data?.forEach(m => {
        if (m.description !== "Subido desde la galería" && m.description !== "Subido desde la galeria") {
          allMemories.push({
            id: m.id,
            title: m.title || "Momento de Embarazo",
            content: m.description || "",
            date: m.memory_date,
            type: 'pregnancy',
            media_urls: m.media_urls,
            section_id: m.section_id
          });
        }
      });

      // 2. Recuerdos Generales
      if (genMems.data) {
        genMems.data.forEach(m => {
          allMemories.push({
            id: m.id,
            title: m.title,
            content: m.content,
            date: m.memory_date,
            type: 'general',
            media_urls: m.media_urls,
            category: m.category
          });
        });
      }

      setMemories(allMemories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error("Error loading memories:", err);
    } finally {
      setLoading(false);
    }
  }

  const uploadFiles = async (files: File[], mediaType: 'image' | 'video' | 'audio') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sesión no encontrada.");

    const formData = new FormData();
    formData.append("childId", childId);
    formData.append("module", "general");
    formData.append("section", "memories");
    formData.append("mediaType", mediaType);
    files.forEach(file => formData.append("files", file));

    const response = await fetch("/api/media", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "No se pudo subir.");
    return (payload.uploaded || []).map((item: { url: string }) => item.url);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (photos.length + selected.length > 3) { setError("Máximo 3 fotos."); return; }
      setLoading(true);
      try {
        const urls = await uploadFiles(selected, 'image');
        setPhotos(prev => [...prev, ...urls].slice(0, 3));
        setVideo(null); setAudio(null); setError("");
      } catch (err: any) { setError("Error: " + err.message); } finally { setLoading(false); }
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const [url] = await uploadFiles([file], 'video');
        setVideo(url); setPhotos([]); setAudio(null); setError("");
      } catch (err: any) { setError("Error video: " + err.message); } finally { setLoading(false); }
    }
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const [url] = await uploadFiles([file], 'audio');
        setAudio(url); setPhotos([]); setVideo(null); setError("");
      } catch (err: any) { setError("Error audio: " + err.message); } finally { setLoading(false); }
    }
  };

  async function handleSaveMemory() {
    if (!newMemory.title) return;
    setIsSaving(true);
    try {
      const memoryData = {
        child_id: childId,
        title: newMemory.title,
        content: newMemory.content,
        memory_date: newMemory.date,
        category: newMemory.category,
        media_urls: video ? [video] : audio ? [audio] : photos,
        media_type: video ? 'video' : audio ? 'audio' : 'image'
      };

      const { error } = await supabase.from("general_memories").insert(memoryData);

      if (error) throw error;
      setShowAddModal(false);
      setNewMemory({ title: "", content: "", date: new Date().toISOString().split('T')[0], category: "General" });
      setPhotos([]); setVideo(null); setAudio(null);
      await loadData();
    } catch (err) {
      alert("Error al guardar. Verifica la conexión.");
    } finally {
      setIsSaving(false);
    }
  }

  const theme = themePalettes[child?.theme_color] || themePalettes.neutral;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-texture">
        <Loader2 className="animate-spin" style={{ color: `${theme.hex}33` }} size={48} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture transition-colors duration-500 flex flex-col pb-32`}>
      {/* Header Compacto Premium adaptado al Tema */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/dashboard/child/${childId}`)} className={`p-2 bg-white rounded-xl shadow-sm ${theme.text} hover:scale-110 transition-all border ${theme.borderAccent}`}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-baseline gap-2">
            <h1 className={`text-lg md:text-2xl font-black ${theme.text} tracking-tighter italic`}>Baúl de Recuerdos</h1>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className={`w-9 h-9 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center`}
        >
          <Plus size={18} />
        </button>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 py-8">
        <div className="space-y-12">
          {Object.entries(
            memories.reduce((acc: any, mem) => {
              const monthYear = new Date(mem.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
              if (!acc[monthYear]) acc[monthYear] = [];
              acc[monthYear].push(mem);
              return acc;
            }, {})
          ).map(([month, group]: [string, any]) => (
            <div key={month} className="space-y-6">
              {/* Separador de Mes */}
              <div className="flex items-center gap-4 opacity-30">
                <span className={`text-[10px] md:text-xs font-black tracking-[0.3em] whitespace-nowrap ${theme.text}`}>{month}</span>
                <div className="h-px bg-current flex-1 opacity-20" style={{ backgroundColor: theme.hex }} />
              </div>

              {/* Grid / Lista Adaptativa */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {group.map((mem: any) => (
                  <motion.div
                    key={mem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedMemory(mem)}
                    className={`bg-white/70 backdrop-blur-md rounded-[2rem] shadow-sm border border-white hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer group 
                      ${isMobile ? 'p-3 flex items-center gap-4' : 'p-5 flex flex-col gap-4 aspect-square md:aspect-auto md:min-h-[220px]'}`}
                  >
                    <div 
                      className={`${isMobile ? 'w-12 h-12' : 'w-full aspect-square'} rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-white/50 shadow-inner`}
                      style={{ backgroundColor: theme.hex + '1a' }}
                    >
                      {mem.media_urls?.[0] ? (
                        (() => {
                          const url = mem.media_urls[0];
                          const lower = url.toLowerCase();
                          const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.m4v') || lower.includes('video/');
                          const isAudio = lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.aac') || lower.includes('audio/');
                          
                          const getProxiedUrl = (u: string) => {
                            if (!u) return '';
                            if (u.includes('.r2.dev') || u.includes('.r2.cloudflarestorage.com') || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL && u.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_URL))) {
                              return `/api/download?url=${encodeURIComponent(u)}`;
                            }
                            return u;
                          };

                          if (isVideo) {
                            return (
                              <video 
                                src={getProxiedUrl(url) + "#t=0.5"} 
                                crossOrigin="anonymous" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                muted 
                                playsInline 
                                preload="metadata"
                              />
                            );
                          }
                          if (isAudio) {
                            return <Mic style={{ color: theme.hex }} size={isMobile ? 18 : 32} />;
                          }
                          return (
                            <img 
                              src={getProxiedUrl(url)} 
                              crossOrigin="anonymous" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            />
                          );
                        })()
                      ) : (
                        <Sparkles style={{ color: theme.hex }} size={isMobile ? 18 : 32} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${theme.text} opacity-40`}>
                          {mem.type === 'pregnancy'
                            ? (mem.section_id
                                ? (stages.find(s => s.id === mem.section_id)?.title || 'Etapa')
                                : 'Embarazo')
                            : 'Hito Libre'}
                        </span>
                        <span className={`text-[8px] font-bold ${theme.text} opacity-30 uppercase tracking-widest`}>
                          {new Date(mem.date).toLocaleDateString('es-ES', { day: 'numeric' })}
                        </span>
                      </div>
                      <h3 className={`text-sm md:text-xl font-black ${theme.text} truncate md:whitespace-normal md:line-clamp-2 italic tracking-tight leading-tight mt-0.5`}>
                        {mem.title}
                      </h3>
                      {!isMobile && (
                        <p className={`text-[10px] ${theme.text} opacity-50 font-medium line-clamp-2 mt-2 leading-relaxed italic`}>
                          {mem.content || "Sin descripción..."}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}

          {memories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 opacity-20 text-center">
              <History size={80} className={theme.text} />
              <p className={`mt-6 font-black uppercase tracking-[0.3em] text-xl italic ${theme.text}`}>Tu historia comienza hoy</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Lectura Detallada (Cápsula Flotante Centrada) */}
      <AnimatePresence>
        {selectedMemory && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setSelectedMemory(null)}
              className="absolute inset-0"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className={`bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden max-h-[85vh] flex flex-col border ${theme.borderAccent}`}
            >
              {/* Botón de Cierre Fijo */}
              <button onClick={() => setSelectedMemory(null)} className={`absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center ${theme.text} opacity-40 hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all border ${theme.borderAccent} z-20`}>
                <X size={20} />
              </button>

              {/* Header Modal */}
              <div className="px-8 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${theme.text} opacity-30`}>
                    {new Date(selectedMemory.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <h2 className={`text-2xl md:text-3xl font-black ${theme.text} italic tracking-tighter leading-tight mt-1 pr-10`}>{selectedMemory.title}</h2>
                </div>
              </div>

              {/* Contenido Modal */}
              <div className="px-8 pb-12 overflow-y-auto custom-scrollbar flex-1">
                <div className="h-px w-12 bg-current opacity-20 mb-6" style={{ color: theme.hex }} />
                <p className={`font-medium leading-relaxed text-base md:text-lg whitespace-pre-wrap italic ${theme.text} opacity-70`}>
                  {selectedMemory.content || "Sin descripción disponible."}
                </p>

                {selectedMemory.media_urls && selectedMemory.media_urls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-8">
                    {selectedMemory.media_urls.map((url: string, i: number) => {
                      const lower = url.toLowerCase();
                      const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.m4v') || lower.includes('video/');
                      const isAudio = lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.aac') || lower.includes('audio/');
                      
                      const getProxiedUrl = (u: string) => {
                        if (!u) return '';
                        if (u.includes('.r2.dev') || u.includes('.r2.cloudflarestorage.com') || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL && u.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_URL))) {
                          return `/api/download?url=${encodeURIComponent(u)}`;
                        }
                        return u;
                      };

                      return (
                        <div key={i} className={`aspect-square rounded-2xl overflow-hidden shadow-md border-2 border-white bg-white/20 flex items-center justify-center`}>
                          {isVideo ? (
                            <video 
                              src={getProxiedUrl(url) + "#t=0.5"} 
                              crossOrigin="anonymous" 
                              className="w-full h-full object-cover" 
                              controls 
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : isAudio ? (
                            <div className="flex flex-col items-center justify-center w-full h-full p-1 bg-white/5">
                              <Mic style={{ color: theme.hex }} size={20} />
                              <audio 
                                src={getProxiedUrl(url)} 
                                crossOrigin="anonymous" 
                                controls 
                                className="w-full scale-75 mt-1" 
                              />
                            </div>
                          ) : (
                            <img 
                              src={getProxiedUrl(url)} 
                              crossOrigin="anonymous" 
                              className="w-full h-full object-cover" 
                              alt="Media" 
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Memory Modal (Inspirado en Embarazo) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 md:p-4 bg-black/40 backdrop-blur-md">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`bg-white rounded-[3rem] max-w-4xl w-full shadow-2xl relative border ${theme.borderAccent} flex flex-col max-h-[95vh] overflow-hidden`}>
              {/* Botón de Cierre Fijo */}
              <button 
                onClick={() => setShowAddModal(false)} 
                className={`absolute top-8 right-8 p-3 bg-white hover:bg-red-50 text-red-500/20 hover:text-red-500 rounded-full border border-gray-100 transition-all z-[50]`}
              >
                <X size={24} />
              </button>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-4 ${theme.bg} ${theme.text} rounded-full shadow-inner`}><Sparkles size={28} /></div>
                  <div>
                    <h3 className={`text-xl md:text-2xl font-black ${theme.text} tracking-tighter italic leading-none`}>Nuevo Hito Permanente</h3>
                    <p className={`text-[10px] font-bold ${theme.text} opacity-30 uppercase tracking-widest mt-1`}>Escribe su historia</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Lado Izquierdo: Textos */}
                  <div className="space-y-6">
                    <div>
                      <label className={`text-[10px] font-black ${theme.text} opacity-40 uppercase tracking-[0.2em] mb-2 block ml-1`}>Título del momento</label>
                      <input value={newMemory.title} onChange={e => setNewMemory({...newMemory, title: e.target.value})} placeholder="Ej: Su primera sonrisa" className={`w-full p-4 ${theme.bgLight} rounded-2xl font-black ${theme.text} outline-none border-2 border-transparent focus:border-current transition-all shadow-inner`} />
                    </div>
                    <div>
                      <label className={`text-[10px] font-black ${theme.text} opacity-40 uppercase tracking-[0.2em] mb-2 block ml-1`}>Relato del recuerdo</label>
                      <textarea rows={6} value={newMemory.content} onChange={e => setNewMemory({...newMemory, content: e.target.value})} placeholder="Describe qué pasó hoy..." className={`w-full p-4 ${theme.bgLight} rounded-2xl font-black ${theme.text} outline-none border-2 border-transparent focus:border-current transition-all resize-none shadow-inner`} />
                    </div>
                  </div>

                  {/* Lado Derecho: Multimedia y Fecha */}
                  <div className="space-y-6">
                    <div>
                      <label className={`text-[10px] font-black ${theme.text} opacity-40 uppercase tracking-[0.2em] mb-2 block ml-1`}>Fecha</label>
                      <input type="date" value={newMemory.date} onChange={e => setNewMemory({...newMemory, date: e.target.value})} className={`w-full p-4 ${theme.bgLight} rounded-2xl font-black ${theme.text} outline-none border-2 border-transparent focus:border-current transition-all shadow-inner`} />
                    </div>

                    {/* Selectores Multimedia */}
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => photoInputRef.current?.click()} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${photos.length >= 3 ? 'bg-gray-50 opacity-40' : `bg-white hover:border-current shadow-sm`}`} style={{ color: theme.hex }}>
                        <Camera size={20} />
                        <span className={`text-[9px] font-black ${theme.text} uppercase`}>Fotos</span>
                        <input type="file" ref={photoInputRef} className="hidden" multiple accept="image/*" onChange={handlePhotoChange} />
                      </button>
                      <button onClick={() => videoInputRef.current?.click()} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${video ? 'bg-gray-50 opacity-40' : `bg-white hover:border-current shadow-sm`}`} style={{ color: theme.hex }}>
                        <ImageIcon size={20} />
                        <span className={`text-[9px] font-black ${theme.text} uppercase`}>Video</span>
                        <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoChange} />
                      </button>
                      <button onClick={() => audioInputRef.current?.click()} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${audio ? 'bg-gray-50 opacity-40' : `bg-white hover:border-current shadow-sm`}`} style={{ color: theme.hex }}>
                        <Sparkles size={20} />
                        <span className={`text-[9px] font-black ${theme.text} uppercase`}>Audio</span>
                        <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioChange} />
                      </button>
                    </div>

                    {/* Previsualización de Archivos */}
                    <div className={`p-4 rounded-[2rem] min-h-[100px] border ${theme.borderAccent} bg-white/50`}>
                      <div className="flex flex-wrap gap-2">
                        {photos.map((p, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden group shadow-md border-2 border-white">
                            <img src={p} className="w-full h-full object-cover" />
                            <button onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X size={16}/></button>
                          </div>
                        ))}
                        {video && (
                          <div className="relative w-16 h-16 rounded-xl bg-black/10 flex items-center justify-center group border-2 border-white shadow-md">
                            <ImageIcon size={20} className={`${theme.text} opacity-30`} />
                            <button onClick={() => setVideo(null)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X size={16}/></button>
                          </div>
                        )}
                        {audio && (
                          <div className="relative w-16 h-16 rounded-xl bg-white/50 flex items-center justify-center group border-2 border-white shadow-md">
                            <Mic size={20} style={{ color: theme.hex }} />
                            <button onClick={() => setAudio(null)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X size={16}/></button>
                          </div>
                        )}
                        {!photos.length && !video && !audio && <p className={`text-[9px] ${theme.text} opacity-20 font-bold uppercase italic py-4`}>Sin multimedia aún</p>}
                      </div>
                    </div>

                    {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}

                    <button 
                      onClick={handleSaveMemory}
                      disabled={isSaving || !newMemory.title}
                      className={`w-full py-5 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-2`}
                    >
                      {isSaving ? <Loader2 className="animate-spin" /> : <><Bookmark size={18} /> Guardar Recuerdo Permanente</>}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
