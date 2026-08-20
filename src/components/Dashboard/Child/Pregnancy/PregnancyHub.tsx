"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Plus, Calendar as CalendarIcon, 
  BookOpen, Loader2, Edit3, Trash2, Camera,
  Image as ImageIcon, ChevronRight,
  Menu, Home, User, LogOut, Download, Filter,
  Baby, Sparkles, FolderPlus, CheckCircle2, X, Video, Mic, QrCode
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import MemoryForm from "./MemoryForm";
import PregnancyGallery from "./PregnancyGallery";
import FutureNames from "./FutureNames";
import HowIsBabyCard from "../../../Preview/HowIsBabyCard";
import PregnancyEvents from "./PregnancyEvents";
import TinyAIAssistantModal from "@/components/Common/TinyAIAssistantModal";

const PregnancyCalendar = dynamic(() => import("./PregnancyCalendar"), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin opacity-20" size={42} />
    </div>
  ),
});

const PregnancyDigitalAlbum = dynamic(() => import("./PregnancyDigitalAlbum"), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin opacity-20" size={42} />
    </div>
  ),
});

const BabyStageInfo = dynamic(() => import("./BabyStageInfo"), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin opacity-20" size={42} />
    </div>
  ),
});

interface PregnancyHubProps {
  childId: string;
  sectionId?: string | null;
  sectionTitle?: string;
  onBack?: () => void;
}

interface ChildProfile {
  id: string;
  name: string;
  theme_color?: string | null;
  preview_config?: any;
}

interface CalendarSummary {
  id: string;
  title?: string | null;
  display_name?: string | null;
  created_at?: string;
}

interface PregnancyMemory {
  id: string;
  title: string;
  description?: string | null;
  memory_date?: string;
  month_number?: number | null;
  media_urls?: string[] | null;
  media_type?: string | null;
}

export default function PregnancyHub({ childId, sectionId = null, sectionTitle, onBack }: PregnancyHubProps) {
  const router = useRouter();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [memories, setMemories] = useState<PregnancyMemory[]>([]);
  const [showMasterMenu, setShowMasterMenu] = useState(false);
  const [shouldOpenVisualizer, setShouldOpenVisualizer] = useState(false);
  
  const [currentView, setCurrentView] = useState<'hub' | 'events' | 'memory-list' | 'memory-form' | 'calendar-list' | 'calendar-edit' | 'gallery' | 'album' | 'future-names' | 'baby-info'>('hub');
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [downloadCalendarId, setDownloadCalendarId] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<PregnancyMemory | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ show: boolean, title: string, text: string, onConfirm: () => void } | null>(null);

  // Estados de galería compartidos para la cabecera principal de escritorio
  const [galleryView, setGalleryView] = useState<'folders' | 'months' | 'items'>('folders');
  const [galleryFolder, setGalleryFolder] = useState<{id: string, name: string, filterMonth?: number, isCustom?: boolean} | null>(null);
  const [galleryIsDeleteMode, setGalleryIsDeleteMode] = useState(false);
  const [galleryIsMultiSelectMode, setGalleryIsMultiSelectMode] = useState(false);
  const [gallerySelectedItems, setGallerySelectedItems] = useState<string[]>([]);
  
  // Triggers para comunicar acciones desde la cabecera principal de la galería
  const [galleryTriggerAdd, setGalleryTriggerAdd] = useState(false);
  const [galleryTriggerDelete, setGalleryTriggerDelete] = useState(false);
  const [galleryTriggerNewFolder, setGalleryTriggerNewFolder] = useState(false);
  const [galleryTriggerUpload, setGalleryTriggerUpload] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    const disabled = localStorage.getItem("tinyworld_ai_disabled");
    setAiEnabled(disabled !== "true");
    const handleToggle = () => {
      const d = localStorage.getItem("tinyworld_ai_disabled");
      setAiEnabled(d !== "true");
    };
    window.addEventListener("tinyworld_ai_toggle", handleToggle);
    return () => window.removeEventListener("tinyworld_ai_toggle", handleToggle);
  }, []);
  const shouldShowLogo = !['calendar-edit', 'memory-form', 'album'].includes(currentView);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("openVisualizer") === "true") {
        setShouldOpenVisualizer(true);
      }
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      const query = supabase.from("pregnancy_calendars")
        .select("id,title,display_name,created_at")
        .eq("child_id", childId);
      
      if (sectionId) {
        query.eq("section_id", sectionId);
      } else {
        query.is("section_id", null);
      }

      const [childRes, calsRes] = await Promise.all([
        supabase.from("children").select("*").eq("id", childId).single(),
        query.order('created_at', { ascending: false })
      ]);

      if (childRes.data) setChild(childRes.data);
      if (calsRes.data) setCalendars(calsRes.data);
      
      setLoading(false);
    }
    loadData();
  }, [childId, sectionId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const refreshMemories = async () => {
    const query = supabase.from("pregnancy_memories")
      .select("*")
      .eq("child_id", childId);
    
    if (sectionId) {
      query.eq("section_id", sectionId);
    } else {
      query.is("section_id", null);
    }
    
    const { data: mems } = await query.order('memory_date', { ascending: false });
    if (mems) {
      const filtered = mems.filter(m => m.description !== "Subido desde la galería" && m.description !== "Subido desde la galeria");
      setMemories(filtered);
    }
  };

  useEffect(() => {
    (window as any).refreshPregnancyMemories = refreshMemories;
    return () => { delete (window as any).refreshPregnancyMemories; };
  }, [childId]);

  const openMemoryList = () => {
    setCurrentView('memory-list');
    if (memories.length === 0) refreshMemories();
  };

  const deleteMemory = async (id: string) => {
    setConfirmConfig({
      show: true,
      title: "¿Borrar Recuerdo?",
      text: "Esta acción no se puede deshacer. El recuerdo y sus fotos desaparecerán de tu historia.",
      onConfirm: async () => {
        await supabase.from("pregnancy_memories").delete().eq("id", id);
        setMemories(memories.filter(m => m.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  const createNewCalendar = async () => {
    setLoading(true);
    const insertData: any = {
      child_id: childId,
      title: sectionId ? 'NUEVA ETAPA' : 'PRIMER AÑO DE',
      display_name: child?.name || '',
    };
    if (sectionId) {
      insertData.section_id = sectionId;
    }
    const { data } = await supabase.from("pregnancy_calendars").insert(insertData).select().single();
    if (data) {
      setCalendars([data, ...calendars]);
      setSelectedCalendarId(data.id);
      setCurrentView('calendar-edit');
    }
    setLoading(false);
  };

  const refreshCalendars = async () => {
    const query = supabase.from("pregnancy_calendars")
      .select("id,title,display_name,created_at")
      .eq("child_id", childId);
    
    if (sectionId) {
      query.eq("section_id", sectionId);
    } else {
      query.is("section_id", null);
    }
    
    const { data: cals } = await query.order('created_at', { ascending: false });
    if (cals) setCalendars(cals);
  };

  if (loading && !child) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-texture">
        <Loader2 className="animate-spin opacity-20" size={isMobile ? 32 : 48} />
      </div>
    );
  }

  if (!child) return null;
  const theme = themePalettes[child.theme_color || 'neutral'] || themePalettes.neutral;

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500 overflow-x-hidden relative`}>
      {currentView !== 'album' && (!isMobile || currentView === 'hub') && (
        <header className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-white/60 backdrop-blur-xl sticky top-0 z-[100] shadow-sm border-b border-white/50">
        
        <div className="flex items-center gap-2 md:gap-4 relative z-[120]">
          <button 
            onClick={() => {
              if (currentView === 'hub') {
                if (onBack) {
                  onBack();
                } else {
                  router.push(`/dashboard/child/${childId}`);
                }
              } else if (currentView === 'gallery') {
                if (galleryView === 'folders') {
                  setCurrentView('hub');
                } else if (galleryView === 'months') {
                  setGalleryView('folders');
                } else {
                  setGalleryView(galleryFolder?.filterMonth ? 'months' : 'folders');
                  setGalleryIsDeleteMode(false);
                  setGalleryIsMultiSelectMode(false);
                  setGallerySelectedItems([]);
                }
              } else if (currentView === 'calendar-edit') {
                setCurrentView('calendar-list');
                refreshCalendars();
              } else if (currentView === 'memory-form') {
                setCurrentView('memory-list');
              } else {
                setCurrentView('hub');
              }
            }}
            className={`p-2.5 bg-white rounded-2xl shadow-sm ${theme.text} hover:scale-110 active:scale-95 transition-all border ${theme.borderAccent}`}
          >
            <ChevronLeft size={isMobile ? 22 : 24} />
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowMasterMenu(!showMasterMenu)}
              className={`p-2.5 bg-white rounded-2xl shadow-sm ${theme.text} hover:scale-110 active:scale-95 transition-all border ${theme.borderAccent}`}
            >
              <Menu size={isMobile ? 22 : 24} />
            </button>

            <AnimatePresence>
              {showMasterMenu && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowMasterMenu(false)}
                    className="fixed inset-0 z-[-1]"
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute top-16 left-0 w-64 bg-white rounded-[2rem] shadow-2xl border ${theme.borderAccent} p-3 overflow-hidden`}
                  >
                    <div className="flex flex-col gap-1">
                       <button onClick={() => window.location.href = '/dashboard'} className={`w-full p-4 hover:${theme.bgLight} rounded-2xl flex items-center gap-4 ${theme.text} transition-colors group`}>
                          <div className={`p-2 ${theme.bgLight} rounded-xl group-hover:${theme.primaryBg} group-hover:text-white transition-colors`}><Home size={18}/></div>
                          <span className="font-black uppercase tracking-widest text-[10px]">Mis Bebés</span>
                       </button>
                       <button onClick={() => router.push('/dashboard?view=profile')} className={`w-full p-4 hover:${theme.bgLight} rounded-2xl flex items-center gap-4 ${theme.text} transition-colors group`}>
                          <div className={`p-2 ${theme.bgLight} rounded-xl group-hover:${theme.primaryBg} group-hover:text-white transition-colors`} style={{ color: theme.hex }}><User size={18}/></div>
                          <span className="font-black uppercase tracking-widest text-[10px]">Mi Perfil</span>
                       </button>

                       <div className={`w-full p-3.5 hover:${theme.bgLight} rounded-2xl flex items-center justify-between ${theme.text} transition-colors`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 ${theme.bgLight} rounded-xl`} style={{ color: theme.hex }}><Sparkles size={18}/></div>
                            <span className="font-black uppercase tracking-widest text-[10px]">Asistente IA</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = !aiEnabled;
                              setAiEnabled(next);
                              localStorage.setItem("tinyworld_ai_disabled", next ? "false" : "true");
                              window.dispatchEvent(new CustomEvent("tinyworld_ai_toggle"));
                            }}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${aiEnabled ? "bg-purple-600" : "bg-stone-300"}`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${aiEnabled ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                        </div>
                       
                       <div className={`h-px ${theme.borderAccent} opacity-50 my-1 mx-4`} />
                       <button onClick={handleLogout} className="w-full p-4 hover:bg-red-50 rounded-2xl flex items-center gap-4 text-red-500 transition-colors group">
                          <div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors"><LogOut size={18}/></div>
                          <span className="font-black uppercase tracking-widest text-[10px]">Cerrar Sesión</span>
                       </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {shouldShowLogo && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3"
            >
              <img src="/logo.png" crossOrigin="anonymous" className="w-7 h-7 md:w-10 md:h-10 object-contain" alt="TinyWorld Logo" />
              <span className={`hidden sm:inline font-outfit font-black ${theme.text} opacity-20 tracking-[0.4em] uppercase text-[10px] md:text-sm`}>TinyWorld</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`z-[110] flex items-center gap-2 md:gap-3 ${isMobile && currentView === 'gallery' ? 'ml-auto' : ''}`}>
          {currentView === 'gallery' ? (
            galleryView === 'items' ? (
              <>
                {galleryFolder?.isCustom && !galleryIsDeleteMode && (
                  <button 
                    onClick={() => setGalleryTriggerAdd(true)} 
                    className={`px-3 py-2 md:px-4 md:py-2 bg-white ${theme.text} rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm border ${theme.borderAccent} hover:${theme.primaryBg} hover:text-white transition-all flex items-center gap-1.5`}
                  >
                    <Plus size={14} /> {!isMobile && "Agregar Fotos"}
                  </button>
                )}
                
                {!galleryIsDeleteMode ? (
                  <button 
                    onClick={() => setGalleryIsDeleteMode(true)} 
                    className="px-3 py-2 md:px-4 md:py-2 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Trash2 size={14} className="md:hidden" /> {!isMobile && "Borrar"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setGalleryIsMultiSelectMode(!galleryIsMultiSelectMode); setGallerySelectedItems([]); }} 
                      className={`p-2 rounded-xl font-black text-[10px] uppercase flex items-center justify-center transition-all ${galleryIsMultiSelectMode ? `${theme.primaryBg} ${theme.textActive} shadow-md` : `bg-white ${theme.text} border ${theme.borderAccent} shadow-sm`}`}
                    >
                      {galleryIsMultiSelectMode ? <X size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                    
                    {galleryIsMultiSelectMode && gallerySelectedItems.length > 0 && (
                      <button 
                        onClick={() => setGalleryTriggerDelete(true)} 
                        className="p-2 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 shadow-md shadow-red-500/20"
                      >
                        <Trash2 size={14}/>
                        <span className="font-black">({gallerySelectedItems.length})</span>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => { setGalleryIsDeleteMode(false); setGalleryIsMultiSelectMode(false); setGallerySelectedItems([]); }} 
                      className={`px-3 py-2 md:px-4 md:py-2 ${theme.primaryBg} ${theme.textActive} rounded-xl font-black text-[10px] uppercase shadow-md hover:${theme.hoverBg}`}
                    >
                      Listo
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <button 
                  onClick={() => setGalleryTriggerNewFolder(true)} 
                  className={`px-3 py-2 md:px-4 md:py-2 bg-white ${theme.text} rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm border ${theme.borderAccent} hover:${theme.primaryBg} hover:text-white transition-all flex items-center gap-1.5`}
                >
                  <FolderPlus size={14} /> {!isMobile && "Nueva Carpeta"}
                </button>
                <button 
                  onClick={() => setGalleryTriggerUpload(true)} 
                  className={`px-4 py-2 md:px-5 md:py-2 ${theme.primaryBg} ${theme.textActive} rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:${theme.hoverBg} hover:scale-105 transition-all flex items-center gap-1.5`}
                >
                  <Plus size={14} /> {!isMobile && "Subir Foto"}
                </button>
              </>
            )
          ) : (
              <div className="flex items-center gap-3">
                <h1 className={`text-right text-[10px] md:text-sm font-black uppercase tracking-[0.2em] ${theme.text} opacity-40`}>
                  {currentView === 'hub' ? (sectionTitle || 'Etapa Embarazo') : (currentView as string).includes('memory') ? 'Recuerdos' : (currentView as string) === 'gallery' ? 'Galería' : 'Calendarios'}
                </h1>
              </div>
            )}
        </div>
        </header>
      )}

      <main className={currentView === 'album' ? "p-0 max-w-none mx-0" : "p-3 md:p-12 max-w-6xl mx-auto"}>
        {currentView === 'hub' && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-10 mt-4 md:mt-6"
            >
              {/* BOTONES PRINCIPALES: Estilo Cápsula en Móvil */}
              <HubButton 
                onClick={openMemoryList} 
                icon={<Camera size={isMobile ? 22 : 32} />} 
                title="Recuerdos" 
                subtitle="Gestiona tus momentos." 
                theme={theme} 
                isMobile={isMobile}
              />
              <HubButton 
                onClick={() => setCurrentView('calendar-list')} 
                icon={<CalendarIcon size={isMobile ? 22 : 32} />} 
                title="Calendarios" 
                subtitle="Resúmenes mensuales." 
                theme={theme} 
                isMobile={isMobile}
              />
              <HubButton 
                onClick={() => setCurrentView('gallery')} 
                icon={<ImageIcon size={isMobile ? 22 : 32} />} 
                title="Galería" 
                subtitle="Tu historia en Polaroid." 
                theme={theme} 
                isMobile={isMobile}
              />
              <HubButton 
                onClick={() => setCurrentView('album')} 
                icon={<BookOpen size={isMobile ? 22 : 32} />} 
                title="Álbum Digital" 
                subtitle="Tu historia en libro." 
                theme={theme} 
                isMobile={isMobile}
              />
              {sectionId && (
                <HubButton 
                  onClick={() => setCurrentView('baby-info')} 
                  icon={<Baby size={isMobile ? 22 : 32} />} 
                  title="Información del Bebé" 
                  subtitle="Peso, estatura y foto." 
                  theme={theme} 
                  isMobile={isMobile}
                />
              )}
              {!sectionId && (
                <HubButton 
                  onClick={() => setCurrentView('future-names')}
                  icon={<Baby size={isMobile ? 22 : 32} style={{ color: theme.hex }} />} 
                  title="Futuro Nombre" 
                  subtitle="Elige el nombre ideal"
                  theme={theme}
                  isMobile={isMobile}
                />
              )}
              {!sectionId && (
                <HowIsBabyCard fum={child.preview_config?.fum} theme={theme} initialOpen={shouldOpenVisualizer} />
              )}
              <HubButton 
                onClick={() => setCurrentView('events')} 
                icon={<QrCode size={isMobile ? 22 : 32} />} 
                title="Eventos Compartidos" 
                subtitle="Invitados y Código QR" 
                theme={theme} 
                isMobile={isMobile}
              />
            </motion.div>
          </>
        )}

        {currentView === 'memory-list' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Cabecera Móvil Estilo Baúl */}
            {isMobile && (
              <div className="fixed top-0 left-0 right-0 z-[150] bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between shadow-sm">
                <button onClick={() => setCurrentView('hub')} className={`p-2 bg-white rounded-xl shadow-md ${theme.text} border ${theme.borderAccent}`}>
                  <ChevronLeft size={20} />
                </button>
                <h1 className={`text-lg font-black ${theme.text} tracking-tighter italic`}>Tus Recuerdos</h1>
                <button onClick={() => { setSelectedMemory(null); setCurrentView('memory-form'); }} className={`w-10 h-10 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-full shadow-lg flex items-center justify-center`}>
                  <Plus size={20} />
                </button>
              </div>
            )}

            <div className={`flex justify-between items-center ${isMobile ? 'mt-20 px-2' : 'mb-8'}`}>
              {!isMobile && <h2 className={`text-xl md:text-3xl font-black ${theme.text} tracking-tighter`}>Tus Recuerdos</h2>}
              {!isMobile && (
                <button 
                  onClick={() => { setSelectedMemory(null); setCurrentView('memory-form'); }}
                  className={`${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} px-5 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg text-[10px] md:text-base uppercase tracking-widest`}
                >
                  <Plus size={16} /> Nuevo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {memories.length === 0 && (
                <div className={`col-span-full py-20 bg-white/40 rounded-[2rem] border-2 border-dashed ${theme.borderAccent} text-center`}>
                  <p className={`text-xs md:text-base ${theme.text} opacity-40 font-black uppercase tracking-widest`}>No hay recuerdos todavía</p>
                </div>
              )}
              {memories.map(mem => (
                <motion.div 
                  key={mem.id}
                  whileHover={{ y: -5 }}
                  className="bg-white/60 hover:bg-white p-3 md:p-4 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-white flex items-center gap-4 group cursor-pointer"
                  onClick={() => { setSelectedMemory(mem); setCurrentView('memory-form'); }}
                >
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${theme.bgLight} overflow-hidden shrink-0 border-2 border-white shadow-inner flex items-center justify-center`}>
                    {mem.media_urls?.[0] ? (
                      (() => {
                        const url = mem.media_urls[0];
                        const lower = url.toLowerCase();
                        const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.m4v') || lower.includes('video/');
                        const isAudio = lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.aac') || lower.includes('audio/');
                        
                        const getProxiedUrl = (u: string) => {
                          if (!u) return '';
                          if (u.includes('.r2.dev') || u.includes('.r2.cloudflarestorage.com') || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL && u.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_URL))) {
                            return `/api/download?url=${encodeURIComponent(u)}&inline=true`;
                          }
                          return u;
                        };

                        if (isVideo) {
                          return (
                            <video 
                              src={getProxiedUrl(url) + "#t=0.5"} 
                              crossOrigin="anonymous" 
                              className="w-full h-full object-cover" 
                              muted 
                              playsInline 
                              preload="metadata"
                            />
                          );
                        }
                        if (isAudio) {
                          return <Mic size={24} className="text-sage" />;
                        }
                        return (
                          <img 
                            src={getProxiedUrl(url)} 
                            crossOrigin="anonymous" 
                            className="w-full h-full object-cover" 
                            alt={mem.title} 
                          />
                        );
                      })()
                    ) : (
                      <ImageIcon size={24} className={`${theme.text} opacity-20`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.hex}1a`, color: theme.hex }}>
                        Mes {mem.month_number || '?'}
                      </span>
                    </div>
                    <h3 className={`text-sm md:text-base font-black ${theme.text} truncate tracking-tighter`}>{mem.title}</h3>
                    <p className={`text-[10px] ${theme.text} opacity-40 font-bold uppercase tracking-widest truncate`}>{mem.description || 'Sin descripción'}</p>
                  </div>
                  <div className="flex gap-1 pr-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteMemory(mem.id); }}
                      className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {currentView === 'calendar-list' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Cabecera Móvil Estilo Baúl */}
            {isMobile && (
              <div className="fixed top-0 left-0 right-0 z-[150] bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between shadow-sm">
                <button onClick={() => setCurrentView('hub')} className={`p-2 bg-white rounded-xl shadow-md ${theme.text} border ${theme.borderAccent}`}>
                  <ChevronLeft size={20} />
                </button>
                <h1 className={`text-lg font-black ${theme.text} tracking-tighter italic`}>Calendarios</h1>
                <button onClick={createNewCalendar} className={`w-10 h-10 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-full shadow-lg flex items-center justify-center`}>
                  <Plus size={20} />
                </button>
              </div>
            )}

            <div className={`flex justify-between items-center ${isMobile ? 'mt-20 px-2' : 'mb-6'}`}>
              {!isMobile && <h2 className={`text-xl md:text-3xl font-black ${theme.text} tracking-tighter`}>Tus Calendarios</h2>}
              {!isMobile && (
                <button onClick={createNewCalendar} className={`${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} px-5 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg text-[10px] md:text-base uppercase tracking-widest`}>
                  <Plus size={16} /> Nuevo
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calendars.map(cal => (
                <motion.div 
                  key={cal.id} 
                  whileHover={{ y: -5 }}
                  className="bg-white/60 hover:bg-white p-4 md:p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-white flex flex-col md:flex-row items-center gap-4 group"
                >
                  <div className={`w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full ${theme.bg} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform`}>
                    <CalendarIcon size={32} className={theme.text} />
                  </div>
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <h3 className={`text-sm md:text-lg font-black ${theme.text} mb-1 truncate tracking-tighter`}>{cal.title} {cal.display_name}</h3>
                    <p className={`text-[10px] ${theme.text} opacity-40 font-black uppercase tracking-widest`}>Digital Edition</p>
                    <div className="flex gap-2 mt-4 justify-center md:justify-start">
                      <button onClick={() => { setSelectedCalendarId(cal.id); setCurrentView('calendar-edit'); }} className={`px-4 py-2 ${theme.primaryBg} ${theme.textActive} rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:${theme.hoverBg}`}>Editar</button>
                      <button onClick={() => { setDownloadCalendarId(cal.id); setSelectedCalendarId(cal.id); setCurrentView('calendar-edit'); }} className="p-2 rounded-full hover:opacity-80 transition-all" style={{ backgroundColor: `${theme.hex}1a`, color: theme.hex }}><Download size={14} /></button>
                      <button onClick={() => { 
                        setConfirmConfig({
                          show: true,
                          title: "¿Borrar Calendario?",
                          text: "Se eliminará este resumen digital, pero tus fotos seguirán guardadas en la galería.",
                          onConfirm: async () => {
                            await supabase.from("pregnancy_calendars").delete().eq("id", cal.id);
                            setCalendars(calendars.filter(c => c.id !== cal.id));
                            setConfirmConfig(null);
                          }
                        });
                      }} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {currentView === 'memory-form' && (
          <MemoryForm 
            childId={childId} 
            sectionId={sectionId}
            memory={selectedMemory}
            theme={theme} 
            isMobile={isMobile}
            onBack={() => setCurrentView('memory-list')}
            onComplete={() => { refreshMemories(); setCurrentView('memory-list'); }} 
          />
        )}

        {currentView === 'calendar-edit' && selectedCalendarId && (
          <PregnancyCalendar
            childId={childId}
            calendarId={selectedCalendarId}
            sectionId={sectionId}
            theme={theme}
            onBack={() => { setCurrentView('calendar-list'); refreshCalendars(); }}
            autoDownload={downloadCalendarId === selectedCalendarId}
            onAutoDownloadComplete={() => { setDownloadCalendarId(null); setCurrentView('calendar-list'); refreshCalendars(); }}
          />
        )}
        {currentView === 'gallery' && (
          <PregnancyGallery
            childId={childId}
            sectionId={sectionId}
            child={child}
            theme={theme}
            onBack={() => setCurrentView('hub')}
            
            // Estados compartidos
            view={galleryView}
            setView={setGalleryView}
            currentFolder={galleryFolder}
            setCurrentFolder={setGalleryFolder}
            isDeleteMode={galleryIsDeleteMode}
            setIsDeleteMode={setGalleryIsDeleteMode}
            isMultiSelectMode={galleryIsMultiSelectMode}
            setIsMultiSelectMode={setGalleryIsMultiSelectMode}
            selectedItems={gallerySelectedItems}
            setSelectedItems={setGallerySelectedItems}
            
            // Triggers de cabecera
            triggerAdd={galleryTriggerAdd}
            setTriggerAdd={setGalleryTriggerAdd}
            triggerDelete={galleryTriggerDelete}
            setTriggerDelete={setGalleryTriggerDelete}
            triggerNewFolder={galleryTriggerNewFolder}
            setTriggerNewFolder={setGalleryTriggerNewFolder}
            triggerUpload={galleryTriggerUpload}
            setTriggerUpload={setGalleryTriggerUpload}
          />
        )}
        {currentView === 'future-names' && (
          <FutureNames
            childId={childId}
            theme={theme}
            isMobile={isMobile}
            onBack={() => setCurrentView('hub')}
          />
        )}
        {currentView === 'album' && (
          <PregnancyDigitalAlbum
            childId={childId}
            sectionId={sectionId}
            sectionTitle={sectionTitle}
            child={child}
            theme={theme}
            isMobile={isMobile}
            onBack={() => setCurrentView('hub')}
          />
        )}
        {currentView === 'baby-info' && sectionId && (
          <BabyStageInfo
            childId={childId}
            sectionId={sectionId}
            theme={theme}
            isMobile={isMobile}
            onBack={() => setCurrentView('hub')}
          />
        )}
        {currentView === 'events' && (
          <PregnancyEvents
            childId={childId}
            sectionId={sectionId}
            theme={theme}
            isMobile={isMobile}
            onBack={() => setCurrentView('hub')}
          />
        )}
      </main>

      <AnimatePresence>
        {confirmConfig && confirmConfig.show && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={28} />
              </div>
              <h3 className={`text-xl font-black ${theme.text} mb-2 tracking-tighter italic`}>{confirmConfig.title}</h3>
              <p className={`${theme.text} opacity-40 text-[10px] md:text-xs mb-8 uppercase tracking-widest leading-relaxed`}>
                {confirmConfig.text}
              </p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={confirmConfig.onConfirm}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-red-600 transition-colors"
                >
                  Sí, Borrar
                </button>
                <button 
                  onClick={() => setConfirmConfig(null)}
                  className={`w-full py-4 ${theme.text} opacity-30 font-black text-[10px] uppercase tracking-[0.2em]`}
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TinyAIAssistantModal theme={theme} childName={child?.name || "el Bebé"} child={child} />
    </div>
  );
}

function HubButton({ onClick, icon, title, subtitle, theme, isMobile }: any) {
  return (
    <motion.button 
      onClick={onClick}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`
        bg-white/60 hover:bg-white p-3 md:p-6 rounded-[2.5rem] md:rounded-[3rem] 
        shadow-sm hover:shadow-xl transition-all border border-white/50 
        flex flex-row md:flex-col items-center gap-4 md:gap-5 group w-full text-left md:text-center
        backdrop-blur-md
      `}
    >
      <div className={`
        w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full ${theme.bg} 
        flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner
        border-4 border-white
      `}>
        <div className={theme.text}>{icon}</div>
      </div>
      <div className="flex-1 md:w-full">
        <h2 className={`text-base md:text-xl font-black ${theme.text} leading-tight tracking-tighter`}>{title}</h2>
        <p className={`${theme.text} opacity-40 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-1`}>{subtitle}</p>
      </div>
      <div className="md:hidden opacity-20"><ChevronRight size={18} /></div>
    </motion.button>
  );
}
