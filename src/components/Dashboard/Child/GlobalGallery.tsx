"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Images, Video, Mic, ChevronLeft, ChevronRight,
  Download, X, Loader2, Play,
  Music, Folder, Calendar, FolderHeart, Sparkles, Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { themePalettes } from "@/lib/themes";

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  date: string;
  title: string;
  source: string;
}

interface GlobalFolder {
  id: string;
  name: string;
  isCustom?: boolean;
  isEvent?: boolean;
}

interface GlobalGalleryProps {
  childId: string;
}

export default function GlobalGallery({ childId }: GlobalGalleryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'audio'>('image');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [child, setChild] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gridCols, setGridCols] = useState(3);

  // Folder states
  const [customFolders, setCustomFolders] = useState<GlobalFolder[]>([]);
  const [folderItems, setFolderItems] = useState<any[]>([]);
  const [eventMedia, setEventMedia] = useState<any[]>([]);
  const [view, setView] = useState<'folders' | 'months' | 'items'>('folders');
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string; filterMonthKey?: string; isCustom?: boolean } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [childRes, pregRes, genRes, foldersRes, eventsRes] = await Promise.all([
        supabase.from("children").select("*").eq("id", childId).single(),
        supabase.from("pregnancy_memories").select("*").eq("child_id", childId).order('memory_date', { ascending: false }),
        supabase.from("general_memories").select("*").eq("child_id", childId).order('memory_date', { ascending: false }),
        supabase.from("pregnancy_folders").select("id, name").eq("child_id", childId),
        supabase.from("pregnancy_events").select("id, title").eq("child_id", childId)
      ]);

      if (childRes.data) setChild(childRes.data);

      const eventList = eventsRes.data || [];
      const eventIds = eventList.map(e => e.id);
      let tempEventMedia: any[] = [];

      if (eventIds.length > 0) {
        const { data: mediaData } = await supabase
          .from("pregnancy_event_media")
          .select("*")
          .in("event_id", eventIds);
        if (mediaData) {
          tempEventMedia = mediaData;
          setEventMedia(mediaData);
        }
      }

      const foldersData: GlobalFolder[] = [
        ...(foldersRes.data || []).map(f => ({ id: f.id, name: f.name, isCustom: true })),
        ...eventList.map(e => ({ id: e.id, name: `Evento: ${e.title}`, isCustom: true, isEvent: true }))
      ];
      setCustomFolders(foldersData);

      if (foldersRes.data && foldersRes.data.length > 0) {
        const folderIds = foldersRes.data.map(f => f.id);
        const { data: itemsData } = await supabase
          .from("pregnancy_folder_items")
          .select("folder_id, memory_id, media_url")
          .in("folder_id", folderIds);
        setFolderItems(itemsData || []);
      } else {
        setFolderItems([]);
      }

      const allMedia: MediaItem[] = [];

      pregRes.data?.forEach(mem => {
        if (mem.media_urls) {
          mem.media_urls.forEach((url: string) => {
            if (url && url.trim() !== "") {
              let realType = mem.media_type || 'image';
              const lowerUrl = url.toLowerCase();
              if (lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.m4a') || lowerUrl.endsWith('.ogg') || lowerUrl.includes('/audio/') || lowerUrl.includes('audio')) {
                realType = 'audio';
              } else if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.avi') || lowerUrl.includes('/video/') || lowerUrl.includes('video')) {
                realType = 'video';
              }

              allMedia.push({
                id: `${mem.id}-${url}`,
                url,
                type: realType as any,
                date: mem.memory_date,
                title: mem.title || "Recuerdo de Embarazo",
                source: "pregnancy"
              });
            }
          });
        }
      });

      genRes.data?.forEach(mem => {
        if (mem.media_urls) {
          mem.media_urls.forEach((url: string) => {
            if (url && url.trim() !== "") {
              let realType = mem.media_type || 'image';
              const lowerUrl = url.toLowerCase();
              if (lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.m4a') || lowerUrl.endsWith('.ogg') || lowerUrl.includes('/audio/') || lowerUrl.includes('audio')) {
                realType = 'audio';
              } else if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.avi') || lowerUrl.includes('/video/') || lowerUrl.includes('video')) {
                realType = 'video';
              }

              allMedia.push({
                id: `${mem.id}-${url}`,
                url,
                type: realType as any,
                date: mem.memory_date,
                title: mem.title || "Recuerdo del Bebé",
                source: "general"
              });
            }
          });
        }
      });

      // Integrar fotos de eventos
      const eventMap = new Map(eventList.map(e => [e.id, e.title]));
      tempEventMedia.forEach(m => {
        const eventTitle = eventMap.get(m.event_id) || "Evento";
        allMedia.push({
          id: m.id,
          url: m.url,
          type: m.type,
          date: m.created_at,
          title: `Invitado en ${eventTitle}`,
          source: "event"
        });
      });

      // Ordenar todo por fecha descendente
      allMedia.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(allMedia);
    } catch (err) {
      console.error("Error loading gallery:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setGridCols(5); // Default desktop
      else setGridCols(3); // Default mobile
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    loadData();
    return () => window.removeEventListener('resize', checkMobile);
  }, [childId]);

  // Group helpers
  const getMonthKey = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Unknown";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthLabel = (monthKey: string) => {
    if (monthKey === "Unknown") return "Fecha Desconocida";
    const [year, month] = monthKey.split("-");
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getMonthCover = (monthKey: string) => {
    const monthItems = items.filter(it => getMonthKey(it.date) === monthKey);
    const imgItem = monthItems.find(it => it.type === 'image');
    return imgItem ? imgItem.url : null;
  };

  const getCustomFolderItems = (folderId: string) => {
    const folder = customFolders.find(f => f.id === folderId);
    if (folder && folder.isEvent) {
      const folderUrls = eventMedia
        .filter(em => em.event_id === folderId)
        .map(em => em.url);
      return items.filter(item => folderUrls.includes(item.url));
    }
    const folderUrls = folderItems
      .filter(item => item.folder_id === folderId)
      .map(item => item.media_url);
    return items.filter(item => folderUrls.includes(item.url));
  };

  const getCustomFolderCover = (folderId: string) => {
    const folderMedia = getCustomFolderItems(folderId);
    const imgItem = folderMedia.find(it => it.type === 'image');
    return imgItem ? imgItem.url : null;
  };

  const monthsList = Array.from(new Set(items.map(it => getMonthKey(it.date))))
    .filter(key => key !== "Unknown")
    .sort((a, b) => b.localeCompare(a));

  const getDisplayItems = () => {
    if (!currentFolder) return [];
    if (currentFolder.id === 'all') return items;
    if (currentFolder.filterMonthKey) {
      return items.filter(it => getMonthKey(it.date) === currentFolder.filterMonthKey);
    }
    if (currentFolder.isCustom) {
      return getCustomFolderItems(currentFolder.id);
    }
    return [];
  };

  const currentFolderItemsList = getDisplayItems();
  const filteredItems = currentFolderItemsList.filter(it => it.type === activeTab);

  const showNextPreview = () => {
    if (!previewItem) return;
    const idx = filteredItems.findIndex((item) => item.id === previewItem.id);
    if (idx !== -1 && idx < filteredItems.length - 1) {
      setPreviewItem(filteredItems[idx + 1]);
    }
  };

  const showPrevPreview = () => {
    if (!previewItem) return;
    const idx = filteredItems.findIndex((item) => item.id === previewItem.id);
    if (idx > 0) {
      setPreviewItem(filteredItems[idx - 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewItem) return;
      if (e.key === "ArrowRight") {
        showNextPreview();
      } else if (e.key === "ArrowLeft") {
        showPrevPreview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem, filteredItems]);

  const tabCounts = {
    image: currentFolderItemsList.filter(it => it.type === 'image').length,
    video: currentFolderItemsList.filter(it => it.type === 'video').length,
    audio: currentFolderItemsList.filter(it => it.type === 'audio').length,
  };

  const downloadMedia = (url: string, title?: string) => {
    try {
      const urlWithoutQuery = url.split("?")[0];
      const match = urlWithoutQuery.match(/\.([a-zA-Z0-9]+)$/);
      const isVideo = previewItem?.type === 'video' || (match && ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(match[1].toLowerCase()));
      const isAudio = previewItem?.type === 'audio' || (match && ['mp3', 'wav', 'm4a', 'ogg'].includes(match[1].toLowerCase()));
      const ext = match ? match[1].toLowerCase() : (isVideo ? 'mp4' : isAudio ? 'mp3' : 'jpg');
      
      const cleanTitle = (title || (isVideo ? 'Video' : isAudio ? 'Audio' : 'Foto')).replace(/[\r\n\s]+/g, '_');
      const filename = `TinyWorld_${cleanTitle}_${Date.now()}.${ext}`;
      const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error al descargar medio:", err);
      window.open(url, "_blank");
    }
  };

  const handleBack = () => {
    if (view === 'items') {
      if (currentFolder?.filterMonthKey) {
        setView('months');
        setCurrentFolder({ id: 'by_date', name: 'Por Fecha' });
      } else {
        setView('folders');
        setCurrentFolder(null);
      }
    } else if (view === 'months') {
      setView('folders');
      setCurrentFolder(null);
    } else {
      router.push(`/dashboard/child/${childId}`);
    }
  };

  const theme = themePalettes[child?.theme_color] || themePalettes.neutral;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-texture">
        <Loader2 className="animate-spin" style={{ color: `${theme.hex}33` }} size={48} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture transition-colors duration-500 flex flex-col pb-20`}>
      {/* Header */}
      <header className="px-4 md:px-10 py-3 flex items-center justify-between sticky top-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className={`p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm ${theme.text} hover:scale-110 transition-all border ${theme.borderAccent}`}>
            <ChevronLeft size={20} />
          </button>
          <h1 className={`hidden sm:block text-xl md:text-3xl font-black ${theme.text} tracking-tighter italic`}>
            {currentFolder ? currentFolder.name : "Galería Global"}
          </h1>
        </div>

        {/* Floating Category Tabs (Only inside Items view) */}
        {view === 'items' && (
          isMobile ? (
            <div className="flex items-center gap-1 bg-white/40 p-1 rounded-xl border border-white/40 shadow-sm">
              <button onClick={() => setActiveTab('image')} className={`p-2 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'image' ? `${theme.bg} ${theme.text} shadow-sm` : `${theme.text} opacity-30`}`}>
                <Images size={16} />
                <span className="text-[9px] font-black">{tabCounts.image}</span>
              </button>
              <button onClick={() => setActiveTab('video')} className={`p-2 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'video' ? `${theme.bg} ${theme.text} shadow-sm` : `${theme.text} opacity-30`}`}>
                <Video size={16} />
                <span className="text-[9px] font-black">{tabCounts.video}</span>
              </button>
              <button onClick={() => setActiveTab('audio')} className={`p-2 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'audio' ? `${theme.bg} ${theme.text} shadow-sm` : `${theme.text} opacity-30`}`}>
                <Mic size={16} />
                <span className="text-[9px] font-black">{tabCounts.audio}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-white/60 p-2 rounded-[2rem] border border-white/50 shadow-inner">
              <TabButton active={activeTab === 'image'} onClick={() => setActiveTab('image')} icon={<Images size={18} />} label={`Imágenes (${tabCounts.image})`} theme={theme} />
              <TabButton active={activeTab === 'video'} onClick={() => setActiveTab('video')} icon={<Video size={18} />} label={`Videos (${tabCounts.video})`} theme={theme} />
              <TabButton active={activeTab === 'audio'} onClick={() => setActiveTab('audio')} icon={<Mic size={18} />} label={`Audios (${tabCounts.audio})`} theme={theme} />
            </div>
          )
        )}
      </header>

      {/* Grid columns adjuster for mobile elements view */}
      {isMobile && view === 'items' && filteredItems.length > 0 && (
        <div className="flex items-center justify-center gap-8 py-1 bg-white/20 backdrop-blur-[2px] border-b border-white/10">
          {[2, 3, 4].map(num => (
            <button 
              key={num}
              onClick={() => setGridCols(num)}
              className={`text-[12px] font-black tracking-widest transition-all p-1 ${gridCols === num ? `${theme.text} scale-125` : `${theme.text} opacity-20`}`}
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ${
        isMobile && gridCols === 2 && view === 'items' ? 'px-10' : 'px-4'
      } md:px-10 py-6`}>

        <AnimatePresence mode="wait">
          
          {/* VIEW: FOLDERS (Root) */}
          {view === 'folders' && (
            <motion.div
              key="folders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-10"
            >
              {/* ALBUMS & FOLDERS */}
              <div>
                <div className={`flex items-center justify-between border-b ${theme.borderAccent} pb-3 mb-6`}>
                  <h2 className={`text-xs md:text-sm font-black uppercase tracking-[0.25em] ${theme.text} opacity-50`}>
                    Álbumes y Carpetas
                  </h2>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${theme.text} opacity-40`}>
                    {customFolders.length + 2} {customFolders.length + 2 === 1 ? 'carpeta' : 'carpetas'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-5">
                  {/* TODO CARD */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      setCurrentFolder({ id: 'all', name: 'Todo el Media' });
                      setView('items');
                    }}
                    className="group bg-white/70 backdrop-blur-md rounded-3xl p-4 border border-white shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col items-center text-center justify-between"
                  >
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${theme.bgLight} border ${theme.borderAccent} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                      <Sparkles size={28} style={{ color: theme.hex }} className="animate-pulse" />
                    </div>
                    
                    <div className="mt-3 w-full">
                      <h4 className={`font-outfit font-black text-xs md:text-sm ${theme.text} truncate px-1`}>
                        Todo el Media
                      </h4>
                      <span className={`text-[9px] md:text-[10px] ${theme.text}/50 font-bold uppercase tracking-wider block mt-0.5`}>
                        {items.length} {items.length === 1 ? 'elemento' : 'elementos'}
                      </span>
                    </div>
                  </motion.div>

                  {/* POR FECHA CARD */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      setCurrentFolder({ id: 'by_date', name: 'Por Fecha' });
                      setView('months');
                    }}
                    className="group bg-white/70 backdrop-blur-md rounded-3xl p-4 border border-white shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col items-center text-center justify-between"
                  >
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${theme.bgLight} border ${theme.borderAccent} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                      <Calendar size={28} style={{ color: theme.hex }} />
                    </div>
                    
                    <div className="mt-3 w-full">
                      <h4 className={`font-outfit font-black text-xs md:text-sm ${theme.text} truncate px-1`}>
                        Por Fecha
                      </h4>
                      <span className={`text-[9px] md:text-[10px] ${theme.text}/50 font-bold uppercase tracking-wider block mt-0.5`}>
                        {monthsList.length} {monthsList.length === 1 ? 'mes' : 'meses'}
                      </span>
                    </div>
                  </motion.div>

                  {/* CUSTOM ALBUMS */}
                  {customFolders.map(folder => {
                    const fItems = getCustomFolderItems(folder.id);
                    return (
                      <motion.div
                        key={folder.id}
                        whileHover={{ y: -4 }}
                        onClick={() => {
                          setCurrentFolder({ id: folder.id, name: folder.name, isCustom: true });
                          setView('items');
                        }}
                        className="group bg-white/70 backdrop-blur-md rounded-3xl p-4 border border-white shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col items-center text-center justify-between"
                      >
                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${theme.bgLight} border ${theme.borderAccent} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                          <FolderHeart size={28} style={{ color: theme.hex }} />
                        </div>
                        
                        <div className="mt-3 w-full">
                          <h4 className={`font-outfit font-black text-xs md:text-sm ${theme.text} truncate px-1`}>
                            {folder.name}
                          </h4>
                          <span className={`text-[9px] md:text-[10px] ${theme.text}/50 font-bold uppercase tracking-wider block mt-0.5`}>
                            {fItems.length} {fItems.length === 1 ? 'elemento' : 'elementos'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: MONTHS */}
          {view === 'months' && (
            <motion.div
              key="months"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 border-b border-white/50 pb-4 mb-4">
                <Calendar size={18} className={theme.text} />
                <h2 className={`font-outfit font-black text-lg ${theme.text} uppercase tracking-wider`}>
                  Álbumes por Fecha
                </h2>
              </div>

              {monthsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <Calendar size={60} />
                  <p className={`mt-4 font-black uppercase tracking-widest text-sm text-center ${theme.text}`}>
                    No hay recuerdos fechados
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-5">
                  {monthsList.map(monthKey => {
                    const monthItems = items.filter(it => getMonthKey(it.date) === monthKey);
                    
                    return (
                      <motion.div
                        key={monthKey}
                        whileHover={{ y: -4 }}
                        onClick={() => {
                          setCurrentFolder({ id: monthKey, name: getMonthLabel(monthKey), filterMonthKey: monthKey });
                          setView('items');
                        }}
                        className="group bg-white/70 backdrop-blur-md rounded-3xl p-4 border border-white shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col items-center text-center justify-between"
                      >
                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${theme.bgLight} border ${theme.borderAccent} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                          <Clock size={28} style={{ color: theme.hex }} />
                        </div>

                        <div className="mt-3 w-full">
                          <h4 className={`font-outfit font-black text-xs md:text-sm ${theme.text} truncate px-1`}>
                            {getMonthLabel(monthKey)}
                          </h4>
                          <span className={`text-[9px] md:text-[10px] ${theme.text}/50 font-bold uppercase tracking-wider block mt-0.5`}>
                            {monthItems.length} {monthItems.length === 1 ? 'elemento' : 'elementos'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW: ITEMS GRID */}
          {view === 'items' && (
            <motion.div
              key="items"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-20">
                  {activeTab === 'image' ? <Images size={80} /> : activeTab === 'video' ? <Video size={80} /> : <Mic size={80} />}
                  <p className={`mt-6 font-black uppercase tracking-[0.3em] text-xl italic text-center ${theme.text}`}>
                    No hay {activeTab === 'image' ? 'imágenes' : activeTab === 'video' ? 'videos' : 'audios'}
                  </p>
                </div>
              ) : (
                <div className={`grid gap-2 md:gap-6 ${
                  gridCols === 2 ? 'grid-cols-2' : 
                  gridCols === 3 ? 'grid-cols-3' : 
                  gridCols === 4 ? 'grid-cols-4' : 'grid-cols-5'
                }`}>
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -5 }}
                      onClick={() => setPreviewItem(item)}
                      className="group relative aspect-square bg-white/70 rounded-[2.2rem] overflow-hidden shadow-sm hover:shadow-2xl border border-white transition-all cursor-pointer"
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : item.type === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                          <Video className="text-white/40 mb-2" size={40} />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-xl group-hover:scale-110 transition-transform">
                              <Play size={24} fill="currentColor" className="ml-1" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-white/40">
                          <div className={`w-20 h-20 ${theme.bg} rounded-full flex items-center justify-center ${theme.text} mb-3 group-hover:scale-110 transition-transform shadow-inner`}>
                            <Music size={40} />
                          </div>
                          <span className={`text-[10px] font-black ${theme.text} opacity-40 uppercase tracking-widest px-4 text-center truncate w-full`}>
                            {item.title}
                          </span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                        <p className="text-[9px] font-black text-white uppercase tracking-widest">
                          {new Date(item.date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full flex flex-col items-center"
            >
              <button 
                onClick={() => setPreviewItem(null)} 
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-2.5 bg-black/45 hover:bg-black/60 rounded-full z-[2100] cursor-pointer shadow-lg hover:scale-110"
              >
                <X size={20} />
              </button>

              <div className="relative group max-w-full w-fit mx-auto flex items-center justify-center gap-4">
                {/* Visual Chevron Left */}
                {(() => {
                  const idx = filteredItems.findIndex(item => item.id === previewItem.id);
                  return idx > 0 ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); showPrevPreview(); }}
                      className="p-3 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all shrink-0 cursor-pointer shadow-lg border border-white/10 hover:scale-110"
                      title="Anterior"
                    >
                      <ChevronLeft size={24} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <div className="w-12 h-12 shrink-0 hidden md:block opacity-0 pointer-events-none" />
                  );
                })()}

                {previewItem.type === 'image' ? (
                  <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/20 bg-white/5 backdrop-blur-sm group/img">
                    <img 
                      src={previewItem.url} 
                      className="max-w-full max-h-[75vh] object-contain block" 
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadMedia(previewItem.url, previewItem.title); }}
                      className="absolute bottom-6 right-6 w-14 h-14 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-white/20 flex items-center justify-center z-20 cursor-pointer backdrop-blur-sm"
                    >
                      <Download size={24} strokeWidth={3} />
                    </button>
                  </div>
                ) : previewItem.type === 'video' ? (
                  <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/20 bg-black group/vid">
                    <video src={previewItem.url} controls className="max-w-full max-h-[75vh]" autoPlay />
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadMedia(previewItem.url, previewItem.title); }}
                      className="absolute bottom-10 right-6 w-14 h-14 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-white/20 flex items-center justify-center z-20 cursor-pointer backdrop-blur-sm"
                    >
                      <Download size={24} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <div className="w-full md:w-[500px] h-64 bg-white/10 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center border-4 border-white/20 p-10 shadow-2xl relative group/aud">
                    <div className={`w-24 h-24 ${theme.bg} ${theme.text} rounded-full flex items-center justify-center mb-6 shadow-xl`}>
                      <Music size={48} />
                    </div>
                    <audio src={previewItem.url} controls className="w-full" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadMedia(previewItem.url, previewItem.title); }}
                      className="absolute top-6 right-6 w-14 h-14 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-white/20 flex items-center justify-center z-20 cursor-pointer backdrop-blur-sm"
                    >
                      <Download size={24} strokeWidth={3} />
                    </button>
                  </div>
                )}

                {/* Visual Chevron Right */}
                {(() => {
                  const idx = filteredItems.findIndex(item => item.id === previewItem.id);
                  return idx !== -1 && idx < filteredItems.length - 1 ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); showNextPreview(); }}
                      className="p-3 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all shrink-0 cursor-pointer shadow-lg border border-white/10 hover:scale-110"
                      title="Siguiente"
                    >
                      <ChevronRight size={24} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <div className="w-12 h-12 shrink-0 hidden md:block opacity-0 pointer-events-none" />
                  );
                })()}
              </div>

              <div className="mt-8 text-center px-6">
                <h3 className="text-2xl md:text-5xl font-black text-white tracking-tighter italic drop-shadow-lg">{previewItem.title}</h3>
                <p className="text-white/40 text-xs md:text-xl font-bold uppercase tracking-[0.4em] mt-3">
                  {new Date(previewItem.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, theme, isMobile }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-[1.5rem] 
        text-[10px] md:text-xs font-black uppercase tracking-widest transition-all
        ${active 
          ? `${theme.bg} ${theme.text} shadow-lg scale-105` 
          : `bg-transparent ${theme.text} opacity-40 hover:bg-white/20 hover:opacity-100`
        }
      `}
    >
      {icon}
      {!isMobile && label}
    </button>
  );
}
