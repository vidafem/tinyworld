"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, Loader2, CheckCircle, Download, Film, Image as ImageIcon, Sparkles, ChevronLeft, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface GuestEventPageProps {
  params: Promise<{ id: string }>;
}

interface PregnancyEvent {
  id: string;
  title: string;
  greeting_message: string;
  is_active: boolean;
  background_style: string;
}

interface EventMedia {
  id: string;
  url: string;
  type: "image" | "video";
  created_at: string;
}

export default function GuestEventPage({ params }: GuestEventPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<PregnancyEvent | null>(null);
  const [mediaList, setMediaList] = useState<EventMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inactive, setInactive] = useState(false);

  // Vistas y Modales
  const [showGuestGallery, setShowGuestGallery] = useState(false);
  const [galleryTab, setGalleryTab] = useState<"all" | "image" | "video">("all");
  const [previewItem, setPreviewItem] = useState<EventMedia | null>(null);

  // Subida de Archivos
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  async function loadEventData() {
    try {
      // 1. Obtener detalles del evento
      const { data: eventData, error: eventError } = await supabase
        .from("pregnancy_events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError || !eventData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!eventData.is_active) {
        setInactive(true);
        setEvent(eventData);
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // 2. Obtener galería de archivos de este evento
      const { data: mediaData } = await supabase
        .from("pregnancy_event_media")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (mediaData) setMediaList(mediaData);
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  // Compresión rápida de imagen en Canvas
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.82
          );
        };
      };
    });
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 10) {
      alert("Solo puedes subir un máximo de 10 archivos a la vez.");
      return;
    }

    setSelectedFiles(files);
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("eventId", eventId);

      for (const file of selectedFiles) {
        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          formData.append("files", compressed);
        } else {
          formData.append("files", file);
        }
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/media/event-upload");

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            const newMedia = response.uploaded.map((u: any) => ({
              id: Math.random().toString(),
              url: u.url,
              type: u.type,
              created_at: new Date().toISOString()
            }));
            setMediaList([...newMedia, ...mediaList]);
            setSelectedFiles([]);
            setShowThankYou(true);
          } else {
            alert("Error al subir: " + (response.error || "Intenta de nuevo"));
          }
        } else {
          alert("Error de red o archivo muy pesado.");
        }
        setUploading(false);
        setUploadProgress(0);
      };

      xhr.onerror = () => {
        alert("Ocurrió un error al intentar conectarse al servidor.");
        setUploading(false);
        setUploadProgress(0);
      };

      xhr.send(formData);
    } catch (err) {
      console.error(err);
      alert("Error al procesar archivos.");
      setUploading(false);
    }
  }

  const getBackgroundStyles = () => {
    if (!event || !event.background_style) return {};

    const style = event.background_style;
    if (style.startsWith("color:")) {
      return { backgroundColor: style.replace("color:", ""), backgroundImage: "none" };
    } else if (style.startsWith("image:")) {
      return {
        backgroundImage: `url(${style.replace("image:", "")})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      };
    }
    return {};
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2EB]">
        <Loader2 className="animate-spin opacity-20 text-stone-600" size={48} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F5F2EB] text-stone-800 text-center space-y-4">
        <h1 className="text-2xl font-black italic tracking-tighter">Evento no encontrado</h1>
        <p className="text-xs uppercase tracking-widest opacity-40 max-w-sm">
          El enlace que escaneaste no parece existir o fue eliminado por el creador.
        </p>
      </div>
    );
  }

  if (inactive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F5F2EB] text-stone-800 text-center space-y-4">
        <h1 className="text-2xl font-black italic tracking-tighter">{event?.title}</h1>
        <div className="px-4 py-2 bg-red-50 text-red-500 rounded-full font-black text-[9px] uppercase tracking-widest">
          Enlace Inactivo
        </div>
        <p className="text-xs uppercase tracking-widest opacity-40 max-w-xs leading-relaxed">
          El creador ha desactivado la subida y visualización de este evento.
        </p>
      </div>
    );
  }

  const customBgStyle = getBackgroundStyles();
  const isCustomBg = Object.keys(customBgStyle).length > 0;

  const filteredMedia = mediaList.filter(item => {
    if (galleryTab === "all") return true;
    return item.type === galleryTab;
  });

  return (
    <div
      className={`min-h-screen p-4 md:p-8 flex flex-col items-center relative transition-all duration-500 ${
        !isCustomBg ? "bg-[#F5F2EB]" : ""
      }`}
      style={customBgStyle}
    >
      {!isCustomBg && (
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-repeat" style={{ backgroundImage: 'var(--paper-texture)' }} />
      )}

      <AnimatePresence mode="wait">
        {!showGuestGallery ? (
          // PANTALLA PRINCIPAL: BIENVENIDA Y CARGADOR
          <motion.div
            key="upload-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-md space-y-6 z-10"
          >
            {/* Cabecera translúcida */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl border border-white/40 text-center space-y-3 relative overflow-hidden">
              <div className="w-12 h-12 bg-sage/15 text-sage rounded-full flex items-center justify-center mx-auto shadow-inner border border-white/50">
                <Sparkles size={20} />
              </div>
              <h1 className="text-2xl font-black italic tracking-tighter text-stone-850 leading-tight">
                {event?.title}
              </h1>
              <p className="text-stone-700 text-xs md:text-sm leading-relaxed px-2 font-medium">
                {event?.greeting_message || "¡Hola! Comparte tus mejores fotos y videos con nosotros para guardarlos en el álbum de recuerdos del bebé."}
              </p>
            </div>

            {/* Cargador translúcido */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl border border-white/40 space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                Subir Fotos y Videos
              </h2>

              <div className="relative border-2 border-dashed border-stone-300 hover:border-sage rounded-2xl p-6 text-center cursor-pointer transition-colors group">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="space-y-2">
                  <UploadCloud className="mx-auto text-stone-400 group-hover:text-sage transition-colors" size={40} />
                  <p className="text-stone-800 font-bold text-xs uppercase tracking-wider">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} archivos seleccionados`
                      : "Selecciona fotos o videos"}
                  </p>
                  <p className="text-[8px] text-stone-400 uppercase tracking-widest">
                    Máximo 10 archivos a la vez
                  </p>
                </div>
              </div>

              {selectedFiles.length > 0 && !uploading && (
                <button
                  onClick={handleUpload}
                  className="w-full py-4 bg-sage text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-md hover:bg-sage/90 transition-transform active:scale-[0.99]"
                >
                  Comenzar Carga
                </button>
              )}

              {uploading && (
                <div className="space-y-2.5">
                  <div className="w-full h-2.5 bg-stone-200/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-stone-500">
                    <span>Subiendo archivos...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN PARA ABRIR LA GALERÍA COMPLETA */}
            <button
              onClick={() => setShowGuestGallery(true)}
              className="w-full py-5 bg-white/70 backdrop-blur-md text-stone-800 rounded-[2rem] border border-white/40 shadow-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ImageIcon size={16} />
              Ver Galería del Evento ({mediaList.length})
            </button>
          </motion.div>
        ) : (
          // PANTALLA DE GALERÍA: LISTADO COMPLETO RESPONSIVO CON PESTAÑAS
          <motion.div
            key="gallery-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl space-y-6 z-10"
          >
            {/* Header de Galería */}
            <div className="bg-white/75 backdrop-blur-md p-5 rounded-[2rem] shadow-xl border border-white/40 flex items-center justify-between">
              <button
                onClick={() => setShowGuestGallery(false)}
                className="p-2.5 bg-white/80 rounded-xl shadow-sm border border-stone-200/50 text-stone-700 hover:scale-105 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-base font-black italic tracking-tighter text-stone-850 truncate max-w-[200px]">
                {event?.title}
              </h2>
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                {mediaList.length} archivos
              </span>
            </div>

            {/* Contenedor de Galería */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl border border-white/40 space-y-5">
              {/* Pestañas / Categorías */}
              <div className="flex gap-2 p-1 bg-stone-200/30 rounded-2xl">
                {(["all", "image", "video"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setGalleryTab(tab)}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      galleryTab === tab
                        ? "bg-stone-800 text-white shadow-md"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    {tab === "all" ? "Todo" : tab === "image" ? "Fotos" : "Videos"}
                  </button>
                ))}
              </div>

              {filteredMedia.length === 0 ? (
                <div className="py-20 text-center text-stone-400">
                  <ImageIcon className="mx-auto mb-3 opacity-20" size={36} />
                  <p className="text-xs uppercase tracking-widest font-black">No hay archivos en esta pestaña</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredMedia.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setPreviewItem(item)}
                      className="bg-white p-3 rounded-2xl shadow-sm border border-stone-150 flex flex-col space-y-2 cursor-pointer hover:scale-[1.02] transition-transform"
                    >
                      <div className="aspect-square w-full rounded-lg overflow-hidden relative bg-stone-50 border border-stone-100 flex items-center justify-center">
                        {item.type === "video" ? (
                          <div className="w-full h-full relative flex items-center justify-center bg-black">
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                            <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white">
                              <Film size={10} />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt="Recuerdo"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-bold text-stone-400 uppercase">
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        <a
                          href={`/api/download?url=${encodeURIComponent(item.url)}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-500 hover:text-sage transition-all"
                          title="Descargar"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Agradecimiento */}
      <AnimatePresence>
        {showThankYou && (
          <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6 border border-white"
            >
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black italic tracking-tighter text-stone-850">
                  ¡Muchas Gracias! 🥰🎉
                </h3>
                <p className="text-[10px] uppercase tracking-wider text-stone-400 leading-relaxed px-2">
                  Tus recuerdos se han guardado con éxito en el álbum de fotos del bebé.
                </p>
              </div>

              <button
                onClick={() => setShowThankYou(false)}
                className="w-full py-4 bg-stone-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-700 transition-colors shadow-md"
              >
                Cerrar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Previsualización y Descarga */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[2200] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="max-w-2xl w-full max-h-[75vh] flex items-center justify-center p-2">
              {previewItem.type === "video" ? (
                <video
                  src={previewItem.url}
                  className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={previewItem.url}
                  className="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-2xl"
                  alt="Vista previa"
                />
              )}
            </div>

            <div className="mt-6 flex flex-col items-center gap-2">
              <a
                href={`/api/download?url=${encodeURIComponent(previewItem.url)}`}
                download
                target="_blank"
                rel="noreferrer"
                className="px-6 py-4 bg-white text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg"
              >
                <Download size={14} />
                Descargar Archivo
              </a>
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                Subido el {new Date(previewItem.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
