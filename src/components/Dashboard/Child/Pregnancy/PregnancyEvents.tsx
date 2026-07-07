"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Loader2, QrCode, Settings, Copy, Check,
  ExternalLink, FileDown, CheckSquare, Square, X, ImageIcon, Video, FolderOpen, ChevronLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import JSZip from "jszip";

interface PregnancyEventsProps {
  childId: string;
  sectionId?: string | null;
  theme: any;
  isMobile: boolean;
  onBack: () => void;
}

interface PregnancyEvent {
  id: string;
  child_id: string;
  section_id: string | null;
  title: string;
  greeting_message: string;
  is_active: boolean;
  background_style: string;
  created_at: string;
}

interface EventMedia {
  id: string;
  event_id: string;
  url: string;
  type: "image" | "video";
  created_at: string;
}

export default function PregnancyEvents({ childId, sectionId = null, theme, isMobile, onBack }: PregnancyEventsProps) {
  const [events, setEvents] = useState<PregnancyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Vistas
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [activeEvent, setActiveEvent] = useState<PregnancyEvent | null>(null);

  const [mediaList, setMediaList] = useState<EventMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [galleryTab, setGalleryTab] = useState<"all" | "image" | "video">("all");

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);

  // Estados de Formulario
  const [title, setTitle] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [bgType, setBgType] = useState<"default" | "image">("default");
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [bgSourceMode, setBgSourceMode] = useState<"upload" | "gallery">("upload");
  const [saving, setSaving] = useState(false);

  // Selector de Galería Externa
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Selección Múltiple
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [zipping, setZipping] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [childId, sectionId]);

  async function loadEvents() {
    setLoading(true);
    try {
      let query = supabase
        .from("pregnancy_events")
        .select("*")
        .eq("child_id", childId);

      // Si existe sectionId (etapa específica) filtramos por él, de lo contrario sólo traemos eventos generales sin etapa
      if (sectionId) {
        query = query.eq("section_id", sectionId);
      } else {
        query = query.is("section_id", null);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (data) setEvents(data);
    } catch (err) {
      console.error("Error al cargar eventos:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadEventMedia(eventId: string) {
    setLoadingMedia(true);
    setSelectedMedia([]);
    try {
      const { data, error } = await supabase
        .from("pregnancy_event_media")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (data) setMediaList(data);
    } catch (err) {
      console.error("Error al cargar multimedia de evento:", err);
    } finally {
      setLoadingMedia(false);
    }
  }

  async function loadGalleryImages() {
    setLoadingGallery(true);
    try {
      const [pregRes, genRes] = await Promise.all([
        supabase.from("pregnancy_memories").select("media_urls").eq("child_id", childId),
        supabase.from("general_memories").select("media_urls").eq("child_id", childId)
      ]);

      const urls: string[] = [];
      [...(pregRes.data || []), ...(genRes.data || [])].forEach(m => {
        if (m.media_urls) {
          m.media_urls.forEach((url: string) => {
            const lowerUrl = url.toLowerCase();
            if (url && !urls.includes(url) &&
              !lowerUrl.endsWith(".mp4") && !lowerUrl.endsWith(".mov") && !lowerUrl.endsWith(".webm") &&
              !lowerUrl.endsWith(".mp3") && !lowerUrl.endsWith(".wav") && !lowerUrl.endsWith(".m4a")) {
              urls.push(url);
            }
          });
        }
      });
      setGalleryImages(urls);
    } catch (err) {
      console.error("Error al cargar imágenes de galería:", err);
    } finally {
      setLoadingGallery(false);
    }
  }

  async function handleUploadBgImage(): Promise<string> {
    if (!bgImageFile) return bgImageUrl;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return "";

    const formData = new FormData();
    formData.append("childId", childId);
    formData.append("module", "pregnancy");
    formData.append("section", "events-bg");
    formData.append("mediaType", "image");
    formData.append("files", bgImageFile);

    const response = await fetch("/api/media", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Fallo al subir imagen de fondo");
    }

    const payload = await response.json();
    return payload.uploaded?.[0]?.url || "";
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      let finalBg = "";
      if (bgType === "image") {
        if (bgSourceMode === "upload" && bgImageFile) {
          const uploadedUrl = await handleUploadBgImage();
          finalBg = `image:${uploadedUrl}`;
        } else if (bgSourceMode === "gallery" && bgImageUrl) {
          finalBg = bgImageUrl.startsWith("image:") ? bgImageUrl : `image:${bgImageUrl}`;
        }
      }

      const { data, error } = await supabase
        .from("pregnancy_events")
        .insert({
          child_id: childId,
          section_id: sectionId || null,
          title: title.trim(),
          greeting_message: greetingMessage.trim(),
          is_active: isActive,
          background_style: finalBg,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setEvents([data, ...events]);
        setShowCreateModal(false);
        resetForm();
      }
    } catch (err) {
      alert("Error al guardar: Asegúrate de configurar tu archivo .env local con tus claves de Supabase y R2, o bien utiliza la opción 'Elegir de Galería' que no realiza subidas locales.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!activeEvent) return;

    setSaving(true);
    try {
      let finalBg = "";
      if (bgType === "image") {
        if (bgSourceMode === "upload" && bgImageFile) {
          const uploadedUrl = await handleUploadBgImage();
          finalBg = `image:${uploadedUrl}`;
        } else {
          finalBg = bgImageUrl.startsWith("image:") ? bgImageUrl : `image:${bgImageUrl}`;
        }
      }

      const { data, error } = await supabase
        .from("pregnancy_events")
        .update({
          title: title.trim(),
          greeting_message: greetingMessage.trim(),
          is_active: isActive,
          background_style: finalBg,
        })
        .eq("id", activeEvent.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setEvents(events.map(ev => ev.id === data.id ? data : ev));
        setActiveEvent(data);
        setShowSettingsModal(false);
        resetForm();
      }
    } catch (err) {
      alert("Error al actualizar: Asegúrate de configurar tu archivo .env local con tus claves de Supabase y R2, o bien utiliza la opción 'Elegir de Galería' que no realiza subidas locales.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("¿Seguro que deseas eliminar este evento? Se perderán todas las fotos subidas por invitados.")) return;

    try {
      await supabase.from("pregnancy_events").delete().eq("id", eventId);
      setEvents(events.filter(ev => ev.id !== eventId));
      if (activeEvent?.id === eventId) {
        setActiveEvent(null);
        setMediaList([]);
        setViewMode("list");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteMedia(mediaId: string, mediaUrl: string) {
    if (!confirm("¿Seguro que deseas borrar este archivo?")) return;

    try {
      await supabase.from("pregnancy_event_media").delete().eq("id", mediaId);
      setMediaList(mediaList.filter(m => m.id !== mediaId));
      setSelectedMedia(selectedMedia.filter(id => id !== mediaId));
    } catch (err) {
      console.error(err);
    }
  }

  // Descarga ZIP Masiva
  async function handleDownloadZip() {
    if (selectedMedia.length === 0) return;

    setZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("event-media");

      const selectedObjects = mediaList.filter(m => selectedMedia.includes(m.id));

      for (let i = 0; i < selectedObjects.length; i++) {
        const item = selectedObjects[i];
        const rawExt = item.url.split(".").pop() || (item.type === "video" ? "mp4" : "jpg");
        const filename = `file_${i + 1}_${Date.now()}.${rawExt}`;

        const proxyUrl = `/api/download?url=${encodeURIComponent(item.url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) continue;

        const blob = await response.blob();
        folder?.file(filename, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${activeEvent ? activeEvent.title.replace(/\s+/g, "_") : "evento"}_media.zip`;
      link.click();
    } catch (err) {
      console.error("Error generando ZIP:", err);
      alert("Hubo un problema al crear el archivo ZIP.");
    } finally {
      setZipping(false);
    }
  }

  function toggleSelectMedia(id: string) {
    if (selectedMedia.includes(id)) {
      setSelectedMedia(selectedMedia.filter(m => m !== id));
    } else {
      setSelectedMedia([...selectedMedia, id]);
    }
  }

  function handleSelectAll() {
    if (selectedMedia.length === mediaList.length) {
      setSelectedMedia([]);
    } else {
      setSelectedMedia(mediaList.map(m => m.id));
    }
  }

  function resetForm() {
    setTitle("");
    setGreetingMessage("");
    setIsActive(true);
    setBgType("default");
    setBgImageFile(null);
    setBgImageUrl("");
    setBgSourceMode("upload");
  }

  function openSettings(ev: PregnancyEvent) {
    setActiveEvent(ev);
    setTitle(ev.title);
    setGreetingMessage(ev.greeting_message || "");
    setIsActive(ev.is_active);

    if (!ev.background_style) {
      setBgType("default");
      setBgImageUrl("");
    } else if (ev.background_style.startsWith("image:")) {
      setBgType("image");
      setBgSourceMode("gallery");
      setBgImageUrl(ev.background_style.replace("image:", ""));
    }

    setShowSettingsModal(true);
  }

  const getShareUrl = (eventId: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/share/event/${eventId}`;
    }
    return `/share/event/${eventId}`;
  };

  const handleCopyLink = (eventId: string) => {
    const url = getShareUrl(eventId);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredMedia = mediaList.filter(item => {
    if (galleryTab === "all") return true;
    return item.type === galleryTab;
  });

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          // PANTALLA 1: LISTADO DE EVENTOS (LIMPIO, SIN ACORDEONES)
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Cabecera */}
            <div className={`flex items-center justify-between ${isMobile ? "mt-20 px-2" : "mb-8"}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className={`p-2 bg-white rounded-xl shadow-md ${theme.text} border ${theme.borderAccent} md:hidden`}
                >
                  <X size={20} />
                </button>
                <h2 className={`text-xl md:text-3xl font-black ${theme.text} tracking-tighter`}>Eventos Compartidos</h2>
              </div>
              <button
                onClick={() => { resetForm(); setShowCreateModal(true); }}
                className={`${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} px-5 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg text-[10px] md:text-base uppercase tracking-widest`}
              >
                <Plus size={16} /> Nuevo Evento
              </button>
            </div>

            {loading ? (
              <div className="py-20 flex items-center justify-center">
                <Loader2 className="animate-spin opacity-20" size={40} />
              </div>
            ) : events.length === 0 ? (
              <div className={`py-20 bg-white/40 rounded-[2.5rem] border-2 border-dashed ${theme.borderAccent} text-center`}>
                <QrCode className={`mx-auto mb-4 ${theme.text} opacity-20`} size={48} />
                <p className={`text-xs md:text-base ${theme.text} opacity-40 font-black uppercase tracking-widest`}>
                  No hay eventos creados en esta etapa
                </p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {events.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setActiveEvent(ev);
                      loadEventMedia(ev.id);
                      setViewMode("detail");
                    }}
                    className="p-6 bg-white/75 backdrop-blur-md rounded-[2.5rem] border border-white/50 hover:border-black/15 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className={`text-xl font-black ${theme.text} tracking-tight leading-tight italic truncate max-w-[280px] sm:max-w-md`}>
                            {ev.title}
                          </h3>
                          <p className={`text-[9px] ${theme.text} opacity-40 uppercase tracking-widest mt-1`}>
                            Creado: {new Date(ev.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${ev.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                          }`}>
                          {ev.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>

                    {/* Botones de acción contextual (evitamos propagación para no abrir detalle) */}
                    <div className="flex items-center gap-2 mt-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openSettings(ev)}
                        className={`p-2.5 bg-white border border-stone-200/50 rounded-xl shadow-sm ${theme.text} hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5`}
                      >
                        <Settings size={13} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Ajustes</span>
                      </button>
                      <button
                        onClick={() => { setActiveEvent(ev); setShowQrModal(true); }}
                        className={`p-2.5 bg-white border border-stone-200/50 rounded-xl shadow-sm ${theme.text} hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5`}
                      >
                        <QrCode size={13} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Ver QR</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all ml-auto hover:scale-105 active:scale-95"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          // PANTALLA 2: PANTALLA COMPLETA DE DETALLE / GALERÍA DEL EVENTO
          activeEvent && (
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              {/* Header de Detalle */}
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-md border border-white/50 flex items-center justify-between">
                <button
                  onClick={() => { setViewMode("list"); setActiveEvent(null); setMediaList([]); }}
                  className="p-2.5 bg-white border border-stone-200/50 rounded-xl shadow-sm text-stone-700 hover:scale-105 active:scale-95 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <h3 className={`text-base font-black ${theme.text} tracking-tight leading-tight italic truncate max-w-[200px]`}>
                  {activeEvent.title}
                </h3>
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                  {mediaList.length} archivos
                </span>
              </div>

              {/* URL & Acciones de Enlace */}
              <div className="bg-white/80 backdrop-blur-md p-5 rounded-[2.5rem] border border-white/50 shadow-sm space-y-3">
                <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/40 space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Enlace de Subida para Invitados:</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-medium text-stone-650 underline truncate">{getShareUrl(activeEvent.id)}</span>
                    <button
                      onClick={() => handleCopyLink(activeEvent.id)}
                      className={`px-3 py-1.5 bg-white text-stone-700 border border-stone-200 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-stone-50 flex items-center gap-1`}
                    >
                      {copiedLink ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                      {copiedLink ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="flex-1 py-3.5 bg-white border border-stone-200/60 rounded-xl text-stone-700 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Settings size={14} />
                    Editar Mensaje / Fondo
                  </button>
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="flex-1 py-3.5 bg-white border border-stone-200/60 rounded-xl text-stone-700 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
                  >
                    <QrCode size={14} />
                    Mostrar Código QR
                  </button>
                </div>
              </div>

              {/* Galería de Contenido */}
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/50 shadow-sm space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                    Galería de Contenido ({mediaList.length})
                  </h4>

                  {mediaList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-700 font-black text-[8px] uppercase tracking-widest flex items-center gap-1"
                      >
                        {selectedMedia.length === mediaList.length ? <CheckSquare size={10} /> : <Square size={10} />}
                        Seleccionar Todo
                      </button>

                      {selectedMedia.length > 0 && (
                        <button
                          onClick={handleDownloadZip}
                          disabled={zipping}
                          className={`${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} px-3 py-1.5 rounded-xl font-black text-[8px] uppercase tracking-widest flex items-center gap-1 shadow-md disabled:opacity-50`}
                        >
                          {zipping ? <Loader2 className="animate-spin" size={10} /> : <FileDown size={10} />}
                          Descargar ZIP ({selectedMedia.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Tabs de Filtro */}
                <div className="flex gap-2 p-1 bg-stone-200/30 rounded-xl max-w-xs">
                  {(["all", "image", "video"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setGalleryTab(tab)}
                      className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${galleryTab === tab
                          ? "bg-stone-850 text-white shadow"
                          : "text-stone-500 hover:text-stone-850"
                        }`}
                    >
                      {tab === "all" ? "Todo" : tab === "image" ? "Fotos" : "Videos"}
                    </button>
                  ))}
                </div>

                {loadingMedia ? (
                  <div className="py-20 flex items-center justify-center">
                    <Loader2 className="animate-spin opacity-20 text-stone-600" size={32} />
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="py-16 text-center text-stone-400">
                    <p className="text-xs uppercase tracking-widest font-black">No hay archivos en esta pestaña</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {filteredMedia.map(item => (
                      <div
                        key={item.id}
                        onClick={() => toggleSelectMedia(item.id)}
                        className={`relative rounded-xl overflow-hidden shadow-sm aspect-square border-4 cursor-pointer group transition-all ${selectedMedia.includes(item.id)
                            ? `border-${theme.text.split("-")[1]}`
                            : "border-white hover:border-stone-250"
                          }`}
                      >
                        {item.type === "video" ? (
                          <div className="w-full h-full relative bg-black flex items-center justify-center">
                            <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                            <div className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-full text-white">
                              <Video size={10} />
                            </div>
                          </div>
                        ) : (
                          <img src={item.url} alt="Invitado" className="w-full h-full object-cover" loading="lazy" />
                        )}

                        <div className="absolute top-1.5 left-1.5 z-10">
                          {selectedMedia.includes(item.id) ? (
                            <div className={`w-4 h-4 rounded-md ${theme.primaryBg} text-white flex items-center justify-center shadow`}>
                              <Check size={10} />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-md bg-black/30 border border-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-1.5 h-1.5 rounded-sm bg-transparent" />
                            </div>
                          )}
                        </div>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteMedia(item.id, item.url);
                          }}
                          className="absolute bottom-1.5 right-1.5 p-1.5 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* MODALES */}

      {/* Modal Crear Evento */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-black ${theme.text} tracking-tight italic`}>Nuevo Evento Compartido</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-black/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50`}>
                    Nombre del Evento
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Baby Shower"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={`w-full p-4 bg-black/5 focus:bg-white border border-transparent focus:border-${theme.text.split("-")[1]} rounded-2xl outline-none text-sm transition-all`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50`}>
                    Mensaje de Bienvenida para Invitados
                  </label>
                  <textarea
                    placeholder="Ej. Bienvenidos a nuestro Baby Shower, suban aquí todas las fotitos y videos de este gran día para guardarlas en nuestro baúl..."
                    value={greetingMessage}
                    onChange={e => setGreetingMessage(e.target.value)}
                    rows={3}
                    className={`w-full p-4 bg-black/5 focus:bg-white border border-transparent focus:border-${theme.text.split("-")[1]} rounded-2xl outline-none text-sm transition-all resize-none`}
                  />
                </div>

                <div className="space-y-3">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                    Fondo de la Página del QR
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBgType("default")}
                      className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${bgType === "default"
                          ? `bg-${theme.text.split("-")[1]} text-white border-transparent`
                          : "bg-white border-black/10 text-black/50"
                        }`}
                    >
                      Por Defecto
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgType("image")}
                      className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${bgType === "image"
                          ? `bg-${theme.text.split("-")[1]} text-white border-transparent`
                          : "bg-white border-black/10 text-black/50"
                        }`}
                    >
                      Imagen Personalizada
                    </button>
                  </div>

                  {bgType === "image" && (
                    <div className="space-y-3 p-3 bg-black/5 rounded-2xl">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBgSourceMode("upload")}
                          className={`flex-1 py-2 rounded-lg text-[8px] font-bold uppercase tracking-wider border ${bgSourceMode === "upload" ? "bg-stone-800 text-white" : "bg-white text-stone-600 border-black/10"
                            }`}
                        >
                          Subir Archivo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBgSourceMode("gallery");
                            loadGalleryImages();
                            setShowGalleryPicker(true);
                          }}
                          className="flex-1 py-2 bg-white text-stone-650 border border-black/10 rounded-lg text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
                        >
                          <FolderOpen size={10} />
                          Elegir de Galería
                        </button>
                      </div>

                      {bgSourceMode === "upload" ? (
                        <div className="space-y-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => setBgImageFile(e.target.files?.[0] || null)}
                            className="text-xs"
                          />
                        </div>
                      ) : (
                        bgImageUrl && (
                          <div className="flex items-center gap-2">
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-black/15">
                              <img src={bgImageUrl} className="w-full h-full object-cover" alt="Fondo" />
                            </div>
                            <span className="text-[9px] text-stone-500 uppercase tracking-widest font-medium truncate max-w-[150px]">Imagen seleccionada</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-sage focus:ring-0"
                  />
                  <label htmlFor="isActive" className={`text-xs font-bold uppercase tracking-wider ${theme.text} cursor-pointer`}>
                    Habilitar enlace de inmediato
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full py-4 ${theme.primaryBg} ${theme.textActive} rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:${theme.hoverBg} transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  Crear Evento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ajustes / Editar Evento */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-black ${theme.text} tracking-tight italic`}>Ajustes del Evento</h3>
                <button onClick={() => setShowSettingsModal(false)} className="p-1 hover:bg-black/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50`}>
                    Nombre del Evento
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Baby Shower"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={`w-full p-4 bg-black/5 focus:bg-white border border-transparent focus:border-${theme.text.split("-")[1]} rounded-2xl outline-none text-sm transition-all`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50`}>
                    Mensaje de Bienvenida
                  </label>
                  <textarea
                    placeholder="Mensaje personalizado para los invitados..."
                    value={greetingMessage}
                    onChange={e => setGreetingMessage(e.target.value)}
                    rows={3}
                    className={`w-full p-4 bg-black/5 focus:bg-white border border-transparent focus:border-${theme.text.split("-")[1]} rounded-2xl outline-none text-sm transition-all resize-none`}
                  />
                </div>

                <div className="space-y-3">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                    Fondo de la Página
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBgType("default")}
                      className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${bgType === "default"
                          ? `bg-${theme.text.split("-")[1]} text-white border-transparent`
                          : "bg-white border-black/10 text-black/50"
                        }`}
                    >
                      Por Defecto
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgType("image")}
                      className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${bgType === "image"
                          ? `bg-${theme.text.split("-")[1]} text-white border-transparent`
                          : "bg-white border-black/10 text-black/50"
                        }`}
                    >
                      Imagen Personalizada
                    </button>
                  </div>

                  {bgType === "image" && (
                    <div className="space-y-3 p-3 bg-black/5 rounded-2xl">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBgSourceMode("upload")}
                          className={`flex-1 py-2 rounded-lg text-[8px] font-bold uppercase tracking-wider border ${bgSourceMode === "upload" ? "bg-stone-800 text-white" : "bg-white text-stone-600 border-black/10"
                            }`}
                        >
                          Subir Archivo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBgSourceMode("gallery");
                            loadGalleryImages();
                            setShowGalleryPicker(true);
                          }}
                          className="flex-1 py-2 bg-white text-stone-650 border border-black/10 rounded-lg text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
                        >
                          <FolderOpen size={10} />
                          Elegir de Galería
                        </button>
                      </div>

                      {bgSourceMode === "upload" ? (
                        <div className="space-y-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => setBgImageFile(e.target.files?.[0] || null)}
                            className="text-xs"
                          />
                        </div>
                      ) : (
                        bgImageUrl && (
                          <div className="flex items-center gap-2">
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-black/15">
                              <img src={bgImageUrl} className="w-full h-full object-cover" alt="Fondo" />
                            </div>
                            <span className="text-[9px] text-stone-500 uppercase tracking-widest truncate max-w-[150px]">Imagen de Galería</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="isActiveUpdate"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-sage focus:ring-0"
                  />
                  <label htmlFor="isActiveUpdate" className={`text-xs font-bold uppercase tracking-wider ${theme.text} cursor-pointer`}>
                    Habilitar enlace
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full py-4 ${theme.primaryBg} ${theme.textActive} rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:${theme.hoverBg} transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  Guardar Ajustes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Selector de Imágenes de la Galería del Bebé */}
      <AnimatePresence>
        {showGalleryPicker && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 max-w-lg w-full shadow-2xl space-y-4 overflow-y-auto max-h-[80vh]"
            >
              <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                <h4 className={`text-base font-black ${theme.text} tracking-tight italic`}>Elegir de Galería del Bebé</h4>
                <button onClick={() => setShowGalleryPicker(false)} className="p-1 hover:bg-black/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {loadingGallery ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="animate-spin opacity-20" size={32} />
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <p className="text-xs uppercase tracking-widest font-black">No tienes fotos guardadas en el baúl aún</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[50vh] p-1">
                  {galleryImages.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setBgImageUrl(url);
                        setShowGalleryPicker(false);
                      }}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer border-4 border-transparent hover:border-stone-800 shadow-sm relative transition-all"
                    >
                      <img src={url} className="w-full h-full object-cover" alt="Recuerdo" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal QR y Enlace */}
      <AnimatePresence>
        {showQrModal && activeEvent && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-black ${theme.text} tracking-tight italic`}>Compartir QR</h3>
                <button onClick={() => setShowQrModal(false)} className="p-1 hover:bg-black/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="w-52 h-52 bg-white rounded-3xl p-4 shadow-inner border border-black/5 mx-auto flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    getShareUrl(activeEvent.id)
                  )}`}
                  alt="Código QR del Evento"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-2">
                <p className={`text-base font-black ${theme.text} tracking-tight italic`}>
                  {activeEvent.title}
                </p>
                <p className="text-[9px] uppercase tracking-wider text-black/40 px-6">
                  Imprime este código QR o compártelo con tus amigos para que suban sus recuerdos.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleCopyLink(activeEvent.id)}
                  className="w-full py-4 bg-black/5 hover:bg-black/10 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                >
                  {copiedLink ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copiedLink ? "¡Copiado!" : "Copiar Enlace"}
                </button>
                <a
                  href={getShareUrl(activeEvent.id)}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full py-4 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-transform`}
                >
                  <ExternalLink size={14} />
                  Ver Pantalla
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
