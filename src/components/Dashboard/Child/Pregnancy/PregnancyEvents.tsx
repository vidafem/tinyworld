"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Loader2, QrCode, Settings, Copy, Check,
  ExternalLink, FileDown, CheckSquare, Square, X, ImageIcon, Video, FolderOpen, ChevronLeft, ChevronRight, Printer
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
  style_settings?: {
    effectType?: string;
    leftStickerUrl?: string;
    rightStickerUrl?: string;
    cardColor?: string;
    cardOpacity?: number;
    enableLiveTv?: boolean;
    enableAudio?: boolean;
    polaroidText?: string;
    polaroidFont?: string;
    polaroidDate?: string;
  };
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
  const [previewItem, setPreviewItem] = useState<EventMedia | null>(null);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);

  // Estados de Formulario
  const [title, setTitle] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [bgType, setBgType] = useState<"default" | "image" | "color">("default");
  const [bgColor, setBgColor] = useState("#F5F2EB");
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

  // Animaciones y Estilos de Tarjeta
  const [bgEffect, setBgEffect] = useState<"none" | "bubbles" | "hearts" | "sparkles" | "clouds">("none");
  const [cardColor, setCardColor] = useState("#ffffff");
  const [cardOpacity, setCardOpacity] = useState(0.7);
  const [availableStickers, setAvailableStickers] = useState<string[]>([]);
  const [leftSticker, setLeftSticker] = useState("");
  const [rightSticker, setRightSticker] = useState("");
  const [enableLiveTv, setEnableLiveTv] = useState(true);
  const [enableAudio, setEnableAudio] = useState(true);
  const [polaroidText, setPolaroidText] = useState("");
  const [polaroidFont, setPolaroidFont] = useState("Great Vibes");
  const [polaroidDate, setPolaroidDate] = useState("");

  useEffect(() => {
    loadEvents();
    loadStickers();
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

  async function loadStickers() {
    try {
      const { data } = await supabase
        .from("assets")
        .select("url")
        .eq("type", "sticker");

      const urls = data ? data.map(s => s.url) : [];
      const fallbacks = [
        "/stickers/st1.png",
        "/stickers/st2.png",
        "/stickers/st3.png",
        "/stickers/st4.png",
        "/stickers/st5.png",
        "/stickers/st10.png"
      ];
      const combined = Array.from(new Set([...urls, ...fallbacks]));
      setAvailableStickers(combined);
    } catch (err) {
      console.error("Error loading stickers:", err);
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
      let finalBg = "default";
      if (bgType === "image") {
        if (bgSourceMode === "upload" && bgImageFile) {
          const uploadedUrl = await handleUploadBgImage();
          finalBg = `image:${uploadedUrl}`;
        } else if (bgSourceMode === "gallery" && bgImageUrl) {
          finalBg = bgImageUrl.startsWith("image:") ? bgImageUrl : `image:${bgImageUrl}`;
        }
      } else if (bgType === "color") {
        finalBg = `color:${bgColor}`;
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
          style_settings: {
            effectType: bgEffect,
            leftStickerUrl: leftSticker,
            rightStickerUrl: rightSticker,
            cardColor: cardColor,
            cardOpacity: cardOpacity,
            enableLiveTv,
            enableAudio,
            polaroidText: polaroidText.trim(),
            polaroidFont,
            polaroidDate: polaroidDate.trim()
          }
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
      let finalBg = "default";
      if (bgType === "image") {
        if (bgSourceMode === "upload" && bgImageFile) {
          const uploadedUrl = await handleUploadBgImage();
          finalBg = `image:${uploadedUrl}`;
        } else {
          finalBg = bgImageUrl.startsWith("image:") ? bgImageUrl : `image:${bgImageUrl}`;
        }
      } else if (bgType === "color") {
        finalBg = `color:${bgColor}`;
      }

      const { data, error } = await supabase
        .from("pregnancy_events")
        .update({
          title: title.trim(),
          greeting_message: greetingMessage.trim(),
          is_active: isActive,
          background_style: finalBg,
          style_settings: {
            effectType: bgEffect,
            leftStickerUrl: leftSticker,
            rightStickerUrl: rightSticker,
            cardColor: cardColor,
            cardOpacity: cardOpacity,
            enableLiveTv,
            enableAudio,
            polaroidText: polaroidText.trim(),
            polaroidFont,
            polaroidDate: polaroidDate.trim()
          }
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

  async function handleBulkDelete() {
    if (selectedMedia.length === 0) return;
    if (!confirm(`¿Seguro que deseas eliminar los ${selectedMedia.length} archivos seleccionados?`)) return;

    try {
      const { error } = await supabase
        .from("pregnancy_event_media")
        .delete()
        .in("id", selectedMedia);

      if (error) throw error;

      setMediaList(mediaList.filter(m => !selectedMedia.includes(m.id)));
      setSelectedMedia([]);
    } catch (err) {
      console.error(err);
      alert("Error al eliminar los archivos seleccionados.");
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
    setBgColor("#F5F2EB");
    setBgSourceMode("upload");
    setBgEffect("none");
    setLeftSticker("");
    setRightSticker("");
    setCardColor("#ffffff");
    setCardOpacity(0.7);
    setEnableLiveTv(true);
    setEnableAudio(true);
    setPolaroidText("");
    setPolaroidFont("Great Vibes");
    setPolaroidDate("");
  }

  function openSettings(ev: PregnancyEvent) {
    setActiveEvent(ev);
    setTitle(ev.title);
    setGreetingMessage(ev.greeting_message || "");
    setIsActive(ev.is_active);

    const legacyBg = ev.background_style || "default";
    if (legacyBg.startsWith("image:")) {
      setBgType("image");
      setBgSourceMode("gallery");
      setBgImageUrl(legacyBg.replace("image:", ""));
      setBgColor("#F5F2EB");
    } else if (legacyBg.startsWith("color:")) {
      setBgType("color");
      setBgImageUrl("");
      setBgColor(legacyBg.replace("color:", ""));
    } else {
      setBgType("default");
      setBgImageUrl("");
      setBgColor("#F5F2EB");
    }

    const style = ev.style_settings || {};
    setBgEffect((style.effectType as any) || "none");
    setLeftSticker(style.leftStickerUrl || "");
    setRightSticker(style.rightStickerUrl || "");
    setCardColor(style.cardColor || "#ffffff");
    setCardOpacity(style.cardOpacity !== undefined ? style.cardOpacity : 0.7);
    setEnableLiveTv(style.enableLiveTv !== undefined ? style.enableLiveTv : true);
    setEnableAudio(style.enableAudio !== undefined ? style.enableAudio : true);
    setPolaroidText(style.polaroidText !== undefined ? style.polaroidText : ev.title);
    setPolaroidFont(style.polaroidFont || "Great Vibes");
    setPolaroidDate(style.polaroidDate || "");

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

  const showPrevPreview = () => {
    if (!previewItem) return;
    const idx = filteredMedia.findIndex(item => item.id === previewItem.id);
    if (idx > 0) {
      setPreviewItem(filteredMedia[idx - 1]);
    }
  };

  const showNextPreview = () => {
    if (!previewItem) return;
    const idx = filteredMedia.findIndex(item => item.id === previewItem.id);
    if (idx !== -1 && idx < filteredMedia.length - 1) {
      setPreviewItem(filteredMedia[idx + 1]);
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
  }, [previewItem, filteredMedia]);

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

               {/* Galería de Contenido */}
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/50 shadow-sm space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100/50 pb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                    Galería de Contenido ({mediaList.length})
                  </h4>

                  {mediaList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-700 font-black text-[8px] uppercase tracking-widest flex items-center gap-1 shadow-sm transition-all hover:bg-stone-50"
                      >
                        {selectedMedia.length === mediaList.length ? <CheckSquare size={10} /> : <Square size={10} />}
                        Seleccionar Todo
                      </button>

                      {selectedMedia.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={handleDownloadZip}
                            disabled={zipping}
                            className={`${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} px-3 py-1.5 rounded-xl font-black text-[8px] uppercase tracking-widest flex items-center gap-1 shadow-md disabled:opacity-50 transition-all`}
                          >
                            {zipping ? <Loader2 className="animate-spin" size={10} /> : <FileDown size={10} />}
                            ZIP ({selectedMedia.length})
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-black text-[8px] uppercase tracking-widest flex items-center gap-1 shadow-md transition-colors"
                          >
                            <Trash2 size={10} />
                            Borrar ({selectedMedia.length})
                          </button>
                        </div>
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
                          onClick={() => setPreviewItem(item)}
                          className={`relative rounded-xl overflow-hidden shadow-sm aspect-square border-4 cursor-pointer group transition-all ${selectedMedia.includes(item.id)
                              ? `border-${theme.text.split("-")[1]}`
                              : "border-white hover:border-stone-250"
                            }`}
                        >
                          {item.type === "video" ? (
                            <div className="w-full h-full relative bg-black flex items-center justify-center">
                              <video 
                                src={item.url + "#t=0.5"} 
                                className="w-full h-full object-cover" 
                                muted 
                                playsInline 
                                preload="metadata"
                                crossOrigin="anonymous"
                              />
                              <div className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-full text-white">
                                <Video size={10} />
                              </div>
                            </div>
                          ) : (
                            <img src={item.url} alt="Invitado" className="w-full h-full object-cover" loading="lazy" />
                          )}

                          {/* Checkbox de Selección */}
                          <div 
                            className="absolute top-1.5 left-1.5 z-10 p-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectMedia(item.id);
                            }}
                          >
                            {selectedMedia.includes(item.id) ? (
                              <div className={`w-4.5 h-4.5 rounded-md ${theme.primaryBg} text-white flex items-center justify-center shadow`}>
                                <Check size={11} />
                              </div>
                            ) : (
                              <div className="w-4.5 h-4.5 rounded-md bg-black/35 border border-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-1.5 h-1.5 rounded-sm bg-transparent" />
                              </div>
                            )}
                          </div>

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteMedia(item.id, item.url);
                            }}
                            className="absolute bottom-1.5 right-1.5 p-1.5 bg-red-500/95 text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md z-20"
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
                      className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${bgType === "default"
                          ? "bg-stone-850 text-white border-transparent"
                          : "bg-white border-black/10 text-stone-500"
                        }`}
                    >
                      Por Defecto
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgType("color")}
                      className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${bgType === "color"
                          ? "bg-stone-850 text-white border-transparent"
                          : "bg-white border-black/10 text-stone-500"
                        }`}
                    >
                      Color Sólido
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgType("image")}
                      className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${bgType === "image"
                          ? "bg-stone-850 text-white border-transparent"
                          : "bg-white border-black/10 text-stone-500"
                        }`}
                    >
                      Imagen
                    </button>
                  </div>

                  {bgType === "color" && (
                    <div className="space-y-1.5 p-3 bg-black/5 rounded-2xl flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Color de Fondo</span>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={e => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-black/10 overflow-hidden"
                      />
                    </div>
                  )}

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

              <div className="space-y-3 pt-2 border-t border-black/5">
                <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                  Efectos de Animación
                </label>
                <select
                  value={bgEffect}
                  onChange={e => setBgEffect(e.target.value as any)}
                  className={`w-full p-3 bg-black/5 rounded-xl text-xs font-bold uppercase tracking-wider outline-none border border-transparent focus:border-${theme.text.split("-")[1]}`}
                >
                  <option value="none">Sin Efecto</option>
                  <option value="bubbles">Burbujas Flotantes</option>
                  <option value="hearts">Corazones Flotantes</option>
                  <option value="sparkles">Destellos de Luz</option>
                  <option value="clouds">Nubes en Movimiento</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-black/5">
                <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                  Sticker Esquina Izquierda
                </label>
                <div className="flex gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar max-w-full">
                  <button
                    type="button"
                    onClick={() => setLeftSticker("")}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center text-[8px] font-bold uppercase transition-all ${leftSticker === "" ? "border-sage bg-sage/10 text-sage font-black" : "border-black/10 bg-white text-stone-400 font-bold"}`}
                  >
                    Ninguno
                  </button>
                  {availableStickers.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLeftSticker(url)}
                      className={`flex-shrink-0 w-12 h-12 rounded-xl border p-1 overflow-hidden transition-all relative ${leftSticker === url ? "border-sage bg-sage/5 scale-105" : "border-black/10 bg-white hover:scale-102"}`}
                    >
                      <img src={url} alt="sticker" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-black/5">
                <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                  Sticker Esquina Derecha
                </label>
                <div className="flex gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar max-w-full">
                  <button
                    type="button"
                    onClick={() => setRightSticker("")}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center text-[8px] font-bold uppercase transition-all ${rightSticker === "" ? "border-sage bg-sage/10 text-sage font-black" : "border-black/10 bg-white text-stone-400 font-bold"}`}
                  >
                    Ninguno
                  </button>
                  {availableStickers.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRightSticker(url)}
                      className={`flex-shrink-0 w-12 h-12 rounded-xl border p-1 overflow-hidden transition-all relative ${rightSticker === url ? "border-sage bg-sage/5 scale-105" : "border-black/10 bg-white hover:scale-102"}`}
                    >
                      <img src={url} alt="sticker" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-black/5">
                <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                  Personalización de Tarjetas (Color y Transparencia)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Color</span>
                    <input
                      type="color"
                      value={cardColor}
                      onChange={e => setCardColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-black/10 overflow-hidden"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex justify-between text-[8px] font-bold text-stone-400 uppercase tracking-widest">
                      <span>Transparencia</span>
                      <span>{Math.round(cardOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={cardOpacity}
                      onChange={e => setCardOpacity(parseFloat(e.target.value))}
                      className="w-full accent-sage cursor-pointer mt-2"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-black/5">
                <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                  Estilo de Firma Polaroid (Cámara / Descargas)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Texto de Firma</span>
                    <input
                      type="text"
                      placeholder="Nombre del evento..."
                      value={polaroidText}
                      onChange={e => setPolaroidText(e.target.value)}
                      className="w-full p-2.5 bg-black/5 focus:bg-white border border-transparent focus:border-sage rounded-xl outline-none text-xs transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Tipografía</span>
                    <select
                      value={polaroidFont}
                      onChange={e => setPolaroidFont(e.target.value)}
                      className="w-full p-2.5 bg-black/5 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-sage"
                    >
                      <option value="Great Vibes">Great Vibes (Cursiva)</option>
                      <option value="Sacramento">Sacramento (Fina)</option>
                      <option value="Caveat">Caveat (Manuscrita)</option>
                      <option value="Playfair Display">Playfair (Clásica)</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1 pt-1">
                    <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Fecha del Evento (en la foto)</span>
                    <input
                      type="text"
                      placeholder="Ej. 12 de Agosto de 2500 (Dejar vacío para fecha del día)"
                      value={polaroidDate}
                      onChange={e => setPolaroidDate(e.target.value)}
                      className="w-full p-2.5 bg-black/5 focus:bg-white border border-transparent focus:border-sage rounded-xl outline-none text-xs transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 py-2 border-t border-black/5">
                <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableLiveTv"
                    checked={enableLiveTv}
                    onChange={e => setEnableLiveTv(e.target.checked)}
                    className="w-4 h-4 rounded text-sage focus:ring-0"
                  />
                  <label htmlFor="enableLiveTv" className={`text-xs font-bold uppercase tracking-wider ${theme.text} cursor-pointer`}>
                    Habilitar Live TV 📺
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableAudio"
                    checked={enableAudio}
                    onChange={e => setEnableAudio(e.target.checked)}
                    className="w-4 h-4 rounded text-sage focus:ring-0"
                  />
                  <label htmlFor="enableAudio" className={`text-xs font-bold uppercase tracking-wider ${theme.text} cursor-pointer`}>
                    Habilitar Notas de Voz 🎙️
                  </label>
                </div>
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
                      className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${bgType === "default"
                          ? "bg-stone-850 text-white border-transparent"
                          : "bg-white border-black/10 text-stone-500"
                        }`}
                    >
                      Por Defecto
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgType("color")}
                      className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${bgType === "color"
                          ? "bg-stone-850 text-white border-transparent"
                          : "bg-white border-black/10 text-stone-500"
                        }`}
                    >
                      Color Sólido
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgType("image")}
                      className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${bgType === "image"
                          ? "bg-stone-850 text-white border-transparent"
                          : "bg-white border-black/10 text-stone-500"
                        }`}
                    >
                      Imagen
                    </button>
                  </div>

                  {bgType === "color" && (
                    <div className="space-y-1.5 p-3 bg-black/5 rounded-2xl flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Color de Fondo</span>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={e => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-black/10 overflow-hidden"
                      />
                    </div>
                  )}

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

                <div className="space-y-3 pt-2 border-t border-black/5">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                    Efectos de Animación
                  </label>
                  <select
                    value={bgEffect}
                    onChange={e => setBgEffect(e.target.value as any)}
                    className={`w-full p-3 bg-black/5 rounded-xl text-xs font-bold uppercase tracking-wider outline-none border border-transparent focus:border-${theme.text.split("-")[1]}`}
                  >
                    <option value="none">Sin Efecto</option>
                    <option value="bubbles">Burbujas Flotantes</option>
                    <option value="hearts">Corazones Flotantes</option>
                    <option value="sparkles">Destellos de Luz</option>
                    <option value="clouds">Nubes en Movimiento</option>
                  </select>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-black/5">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                    Sticker Esquina Izquierda
                  </label>
                  <div className="flex gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar max-w-full">
                    <button
                      type="button"
                      onClick={() => setLeftSticker("")}
                      className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center text-[8px] font-bold uppercase transition-all ${leftSticker === "" ? "border-sage bg-sage/10 text-sage font-black" : "border-black/10 bg-white text-stone-400 font-bold"}`}
                    >
                      Ninguno
                    </button>
                    {availableStickers.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLeftSticker(url)}
                        className={`flex-shrink-0 w-12 h-12 rounded-xl border p-1 overflow-hidden transition-all relative ${leftSticker === url ? "border-sage bg-sage/5 scale-105" : "border-black/10 bg-white hover:scale-102"}`}
                      >
                        <img src={url} alt="sticker" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-black/5">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                    Sticker Esquina Derecha
                  </label>
                  <div className="flex gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar max-w-full">
                    <button
                      type="button"
                      onClick={() => setRightSticker("")}
                      className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center text-[8px] font-bold uppercase transition-all ${rightSticker === "" ? "border-sage bg-sage/10 text-sage font-black" : "border-black/10 bg-white text-stone-400 font-bold"}`}
                    >
                      Ninguno
                    </button>
                    {availableStickers.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRightSticker(url)}
                        className={`flex-shrink-0 w-12 h-12 rounded-xl border p-1 overflow-hidden transition-all relative ${rightSticker === url ? "border-sage bg-sage/5 scale-105" : "border-black/10 bg-white hover:scale-102"}`}
                      >
                        <img src={url} alt="sticker" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-black/5">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                    Personalización de Tarjetas (Color y Transparencia)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Color</span>
                      <input
                        type="color"
                        value={cardColor}
                        onChange={e => setCardColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-black/10 overflow-hidden"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between text-[8px] font-bold text-stone-400 uppercase tracking-widest">
                        <span>Transparencia</span>
                        <span>{Math.round(cardOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={cardOpacity}
                        onChange={e => setCardOpacity(parseFloat(e.target.value))}
                        className="w-full accent-sage cursor-pointer mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-black/5">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-50 block`}>
                    Estilo de Firma Polaroid (Cámara / Descargas)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Texto de Firma</span>
                      <input
                        type="text"
                        placeholder="Nombre del evento..."
                        value={polaroidText}
                        onChange={e => setPolaroidText(e.target.value)}
                        className="w-full p-2.5 bg-black/5 focus:bg-white border border-transparent focus:border-sage rounded-xl outline-none text-xs transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Tipografía</span>
                      <select
                        value={polaroidFont}
                        onChange={e => setPolaroidFont(e.target.value)}
                        className="w-full p-2.5 bg-black/5 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-sage"
                      >
                        <option value="Great Vibes">Great Vibes (Cursiva)</option>
                        <option value="Sacramento">Sacramento (Fina)</option>
                        <option value="Caveat">Caveat (Manuscrita)</option>
                        <option value="Playfair Display">Playfair (Clásica)</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1 pt-1">
                      <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Fecha del Evento (en la foto)</span>
                      <input
                        type="text"
                        placeholder="Ej. 12 de Agosto de 2500 (Dejar vacío para fecha del día)"
                        value={polaroidDate}
                        onChange={e => setPolaroidDate(e.target.value)}
                        className="w-full p-2.5 bg-black/5 focus:bg-white border border-transparent focus:border-sage rounded-xl outline-none text-xs transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 py-2 border-t border-black/5">
                  <div className="flex items-center gap-3">
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
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableLiveTvUpdate"
                      checked={enableLiveTv}
                      onChange={e => setEnableLiveTv(e.target.checked)}
                      className="w-4 h-4 rounded text-sage focus:ring-0"
                    />
                    <label htmlFor="enableLiveTvUpdate" className={`text-xs font-bold uppercase tracking-wider ${theme.text} cursor-pointer`}>
                      Habilitar Live TV 📺
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableAudioUpdate"
                      checked={enableAudio}
                      onChange={e => setEnableAudio(e.target.checked)}
                      className="w-4 h-4 rounded text-sage focus:ring-0"
                    />
                    <label htmlFor="enableAudioUpdate" className={`text-xs font-bold uppercase tracking-wider ${theme.text} cursor-pointer`}>
                      Habilitar Notas de Voz 🎙️
                    </label>
                  </div>
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
                <button
                  onClick={() => {
                    const shareUrl = getShareUrl(activeEvent.id);
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}`;
                    const win = window.open("", "_blank");
                    if (win) {
                      win.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Invitación - ${activeEvent.title}</title>
                            <style>
                              body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #FFFDF8; }
                              .card { max-width: 420px; margin: 0 auto; padding: 36px; border: 3px solid #E5D5C5; border-radius: 32px; background: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                              h1 { color: #4A4238; font-size: 26px; margin-bottom: 12px; font-weight: 900; }
                              p { color: #8C8275; font-size: 13px; margin-bottom: 24px; line-height: 1.5; font-weight: 600; }
                              img { width: 220px; height: 220px; margin-bottom: 24px; border-radius: 16px; border: 1px solid #eee; }
                              .footer { font-size: 11px; color: #B5A898; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; }
                            </style>
                          </head>
                          <body>
                            <div class="card">
                              <h1>✨ ${activeEvent.title} ✨</h1>
                              <p>${activeEvent.greeting_message || '¡Escanea este código QR para compartir tus fotos y deseos de voz con nosotros!'}</p>
                              <img src="${qrUrl}" alt="QR" />
                              <div class="footer">TinyWorld • Recuerdos Inolvidables</div>
                            </div>
                            <script>setTimeout(() => window.print(), 500);</script>
                          </body>
                        </html>
                      `);
                    }
                  }}
                  className="w-full py-3.5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  <Printer size={14} />
                  Imprimir Tarjeta de Invitación
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

      {/* Modal de Previsualización y Descarga para el Creador */}
      <AnimatePresence>
        {previewItem && (
          <div 
            className="fixed inset-0 z-[2500] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={() => setPreviewItem(null)}
          >
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-3 bg-white/10 hover:bg-white/20 rounded-full z-[2600] cursor-pointer shadow-lg hover:scale-110"
            >
              <X size={22} />
            </button>

            {/* Contenedor principal con flechas */}
            <div className="relative w-full max-w-5xl flex items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
              
              {/* Flecha Izquierda */}
              {(() => {
                const idx = filteredMedia.findIndex(item => item.id === previewItem.id);
                return idx > 0 ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); showPrevPreview(); }}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer shrink-0 hover:scale-110 active:scale-95"
                    title="Anterior"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                  </button>
                ) : (
                  <div className="w-12 h-12 shrink-0 hidden md:block opacity-0 pointer-events-none" />
                );
              })()}

              {/* Contenedor del video/imagen */}
              <div className="w-full max-w-4xl max-h-[80vh] flex items-center justify-center p-1 md:p-2 flex-1">
                <div className="relative group max-w-full max-h-[80vh] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-white/10 bg-neutral-900/40">
                  {previewItem.type === "video" ? (
                    <video
                      src={previewItem.url}
                      className="max-w-full max-h-[80vh] block object-contain"
                      controls
                      autoPlay
                    />
                  ) : (
                    <img
                      src={previewItem.url}
                      className="max-w-full max-h-[80vh] block object-contain"
                      alt="Vista previa"
                    />
                  )}

                  {/* Botón de descarga elegante superpuesto sobre la foto */}
                  {(() => {
                    const urlWithoutQuery = previewItem.url.split("?")[0];
                    const match = urlWithoutQuery.match(/\.([a-zA-Z0-9]+)$/);
                    const isVideo = previewItem.type === "video" || (match && ["mp4", "mov", "webm"].includes(match[1].toLowerCase()));
                    const ext = match ? match[1].toLowerCase() : (isVideo ? "mp4" : "jpg");
                    const filename = `TinyWorld_${isVideo ? "Video" : "Foto"}_${Date.now()}.${ext}`;
                    const downloadUrl = `/api/download?url=${encodeURIComponent(previewItem.url)}&filename=${encodeURIComponent(filename)}`;

                    return (
                      <a
                        href={downloadUrl}
                        download={filename}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-4 right-4 w-12 h-12 bg-black/60 hover:bg-black/85 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/25 flex items-center justify-center z-20 cursor-pointer backdrop-blur-sm shadow-black/40"
                        title="Descargar"
                      >
                        <FileDown size={20} strokeWidth={2.5} />
                      </a>
                    );
                  })()}
                </div>
              </div>

              {/* Flecha Derecha */}
              {(() => {
                const idx = filteredMedia.findIndex(item => item.id === previewItem.id);
                return idx !== -1 && idx < filteredMedia.length - 1 ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); showNextPreview(); }}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer shrink-0 hover:scale-110 active:scale-95"
                    title="Siguiente"
                  >
                    <ChevronRight size={24} strokeWidth={2.5} />
                  </button>
                ) : (
                  <div className="w-12 h-12 shrink-0 hidden md:block opacity-0 pointer-events-none" />
                );
              })()}
            </div>

            <div className="mt-6 text-center select-none" onClick={(e) => e.stopPropagation()}>
              <h4 className="text-white text-base md:text-xl font-bold tracking-tight italic drop-shadow-md">
                {activeEvent?.title || "Recuerdo de Invitado"}
              </h4>
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em] mt-1.5 block">
                Subido el {new Date(previewItem.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
