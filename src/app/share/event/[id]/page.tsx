"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, Loader2, CheckCircle, Download, Film, Image as ImageIcon, Sparkles, ChevronLeft, X, ChevronRight
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
  style_settings?: {
    effectType?: string;
    leftStickerUrl?: string;
    rightStickerUrl?: string;
    cardColor?: string;
    cardOpacity?: number;
  };
}

interface EventMedia {
  id: string;
  url: string;
  type: "image" | "video";
  created_at: string;
}

// Componente auxiliar para previsualizar los archivos seleccionados de forma eficiente en cuadrícula
function FilePreviewSquare({ file, onRemove, uploading }: { file: File; onRemove: () => void; uploading: boolean }) {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isImage = file.type.startsWith("image/");

  return (
    <div className="relative rounded-xl overflow-hidden aspect-square border border-stone-200/50 bg-stone-50/50 flex items-center justify-center group shadow-sm">
      {isImage && previewUrl ? (
        <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center p-1 text-center">
          <Film size={18} className="text-amber-500 mb-0.5 shrink-0" />
          <span className="text-[6.5px] text-white/80 font-bold truncate w-full px-0.5 leading-tight shrink-0">
            {file.name}
          </span>
        </div>
      )}
      {!uploading && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors shadow z-10"
        >
          <X size={8} />
        </button>
      )}
    </div>
  );
}

// Componente de Efectos de Fondo Animados (Burbujas, Corazones, Estrellas, Nubes)
function BackgroundEffects({ type }: { type: string }) {
  if (type === "none") return null;

  const particles = Array.from({ length: 30 });

  if (type === "bubbles") {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 w-screen h-screen">
        {particles.map((_, i) => {
          const left = `${2 + i * 3.3}%`;
          const delay = `${i * 0.7}s`;
          const duration = `${12 + (i % 5) * 4}s`;
          const size = `${16 + (i % 6) * 10}px`;
          return (
            <div
              key={i}
              className="absolute rounded-full border border-white/50 bg-white/5 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-[0.5px]"
              style={{
                left,
                bottom: "-60px",
                width: size,
                height: size,
                animation: `float-up ${duration} ease-in-out infinite`,
                animationDelay: delay,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (type === "hearts") {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 w-screen h-screen">
        {particles.map((_, i) => {
          const left = `${4 + i * 3.1}%`;
          const delay = `${i * 0.8}s`;
          const duration = `${14 + (i % 4) * 3.5}s`;
          const size = `${18 + (i % 5) * 8}px`;
          return (
            <div
              key={i}
              className="absolute flex items-center justify-center text-pink-400/35 select-none font-bold filter drop-shadow-[0_1px_1px_rgba(244,63,94,0.05)]"
              style={{
                left,
                bottom: "-60px",
                fontSize: size,
                animation: `float-up ${duration} ease-in-out infinite`,
                animationDelay: delay,
              }}
            >
              ♥
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "sparkles") {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 w-screen h-screen">
        {particles.map((_, i) => {
          const left = `${5 + (i * 9.5) % 90}%`;
          const top = `${5 + (i * 17) % 90}%`;
          const delay = `${i * 0.25}s`;
          const duration = `${2.5 + (i % 4) * 1.2}s`;
          const size = `${10 + (i % 5) * 7}px`;
          return (
            <div
              key={i}
              className="absolute text-amber-300/40 font-serif filter drop-shadow-[0_0_2px_rgba(251,191,36,0.3)]"
              style={{
                left,
                top,
                fontSize: size,
                animation: `sparkle-twinkle ${duration} ease-in-out infinite`,
                animationDelay: delay,
              }}
            >
              ✦
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "clouds") {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 w-screen h-screen">
        {Array.from({ length: 8 }).map((_, i) => {
          const top = `${8 + i * 11}%`;
          const delay = `${i * 3.5}s`;
          const duration = `${28 + (i % 3) * 8}s`;
          const scale = 0.6 + (i % 3) * 0.3;
          return (
            <div
              key={i}
              className="absolute text-white/30 fill-current opacity-40 filter drop-shadow-[0_4px_6px_rgba(255,255,255,0.1)]"
              style={{
                top,
                left: "-180px",
                transform: `scale(${scale})`,
                animation: `cloud-move ${duration} linear infinite`,
                animationDelay: delay,
              }}
            >
              <svg width="120" height="80" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
                <path d="M 20 40 a 12 12 0 0 1 10 -9 a 18 18 0 0 1 32 -4 a 14 14 0 0 1 20 13 a 10 10 0 0 1 0 18 H 20 a 10 10 0 0 1 0 -18 Z" fill="currentColor" />
              </svg>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

// Componente para Stickers Ilustrativos Infantiles en Esquinas
function EventStickers({ leftUrl, rightUrl }: { leftUrl?: string; rightUrl?: string }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 w-screen h-screen">
      {leftUrl && (
        <div className="absolute bottom-6 left-6 opacity-50 select-none animate-[bounce_6s_ease-in-out_infinite] scale-75 md:scale-100 origin-bottom-left max-w-[120px] max-h-[120px]">
          <img src={leftUrl} alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" />
        </div>
      )}
      {rightUrl && (
        <div className="absolute top-16 right-6 opacity-50 select-none animate-[bounce_8s_ease-in-out_infinite] scale-75 md:scale-100 origin-top-right max-w-[120px] max-h-[120px]">
          <img src={rightUrl} alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" />
        </div>
      )}
    </div>
  );
}

// Componente de Confeti de Celebración al finalizar subida
function ConfettiBurst() {
  const colors = ["bg-pink-300", "bg-sky-300", "bg-amber-300", "bg-emerald-300", "bg-purple-300", "bg-rose-300"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 60 }).map((_, i) => {
        const color = colors[i % colors.length];
        const left = `${Math.random() * 100}%`;
        const top = `${Math.random() * 15 - 15}%`;
        const size = `${6 + Math.random() * 8}px`;
        const delay = `${Math.random() * 1.5}s`;
        const duration = `${2.5 + Math.random() * 2}s`;
        const rotate = `${Math.random() * 360}deg`;
        return (
          <div
            key={i}
            className={`absolute rounded-sm ${color} opacity-85`}
            style={{
              left,
              top,
              width: size,
              height: size,
              transform: `rotate(${rotate})`,
              animation: `confetti-fall ${duration} ease-out forwards`,
              animationDelay: delay,
            }}
          />
        );
      })}
    </div>
  );
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

  const showNextPreview = () => {
    if (!previewItem) return;
    const idx = mediaList.findIndex((item) => item.id === previewItem.id);
    if (idx !== -1 && idx < mediaList.length - 1) {
      setPreviewItem(mediaList[idx + 1]);
    }
  };

  const showPrevPreview = () => {
    if (!previewItem) return;
    const idx = mediaList.findIndex((item) => item.id === previewItem.id);
    if (idx > 0) {
      setPreviewItem(mediaList[idx - 1]);
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
  }, [previewItem, mediaList]);

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

    if (files.length > 30) {
      alert("Solo puedes subir un máximo de 30 archivos a la vez.");
      return;
    }

    setSelectedFiles(files);
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Comprimir imágenes antes de subirlas
      const processedFiles: File[] = [];
      for (const file of selectedFiles) {
        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          processedFiles.push(compressed);
        } else {
          processedFiles.push(file);
        }
      }

      // Preparar el seguimiento de bytes para el progreso global
      const fileSizes = processedFiles.map(f => f.size);
      const totalBytes = fileSizes.reduce((a, b) => a + b, 0);
      const loadedBytesArray = new Array(processedFiles.length).fill(0);

      const updateGlobalProgress = () => {
        const currentLoaded = loadedBytesArray.reduce((a, b) => a + b, 0);
        const percent = Math.round((currentLoaded / totalBytes) * 100);
        setUploadProgress(Math.min(100, percent));
      };

      const uploadedResults: any[] = [];

      // 2. Subir secuencialmente cada archivo directamente a Cloudflare R2
      for (let i = 0; i < processedFiles.length; i++) {
        const file = processedFiles[i];

        // A. Obtener URL firmada
        const presignRes = await fetch("/api/media/event-upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            contentType: file.type,
            filename: file.name
          })
        });

        if (!presignRes.ok) {
          const errData = await presignRes.json();
          throw new Error(errData.error || `Error al obtener firma para ${file.name}`);
        }

        const { uploadUrl, publicUrl } = await presignRes.json();

        // B. Subir físicamente a R2
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              loadedBytesArray[i] = event.loaded;
              updateGlobalProgress();
            }
          });

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              loadedBytesArray[i] = file.size; // Asegurar que sume completo
              updateGlobalProgress();
              resolve();
            } else {
              reject(new Error(`Error al subir archivo a R2: ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error("Error de red al subir a R2."));
          xhr.send(file);
        });

        // C. Registrar en base de datos
        const mediaType = file.type.startsWith("video") ? "video" : "image";
        const registerRes = await fetch("/api/media/event-upload/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            url: publicUrl,
            mediaType
          })
        });

        if (!registerRes.ok) {
          const errData = await registerRes.json();
          throw new Error(errData.error || `Error al registrar ${file.name} en BD`);
        }

        const registerData = await registerRes.json();
        uploadedResults.push(registerData.media);
      }

      // D. Finalizar subida exitosa
      setMediaList([...uploadedResults, ...mediaList]);
      setSelectedFiles([]);
      setShowThankYou(true);
    } catch (err: any) {
      console.error(err);
      alert("Error al subir archivos: " + (err.message || err));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  const getParsedStyle = () => {
    const defaults = {
      bgType: "default",
      bgUrl: "default",
      bgColor: "#F5F2EB",
      effectType: "none",
      leftStickerUrl: "",
      rightStickerUrl: "",
      cardColor: "#ffffff",
      cardOpacity: 0.7
    };

    if (!event) return defaults;

    const legacyBg = event.background_style || "default";
    let bgType: "default" | "image" | "color" = "default";
    let bgUrl = "default";
    let bgColor = "#F5F2EB";

    if (legacyBg.startsWith("image:")) {
      bgType = "image";
      bgUrl = legacyBg.replace("image:", "");
    } else if (legacyBg.startsWith("color:")) {
      bgType = "color";
      bgColor = legacyBg.replace("color:", "");
    }

    // Read configuration from style_settings object
    const style = event.style_settings || {};

    return {
      bgType,
      bgUrl,
      bgColor,
      effectType: style.effectType || "none",
      leftStickerUrl: style.leftStickerUrl || "",
      rightStickerUrl: style.rightStickerUrl || "",
      cardColor: style.cardColor || "#ffffff",
      cardOpacity: style.cardOpacity !== undefined ? style.cardOpacity : 0.7
    };
  };

  const getBackgroundStyles = (parsed: any) => {
    if (parsed.bgType === "image" && parsed.bgUrl && parsed.bgUrl !== "default") {
      return {
        backgroundImage: `url(${parsed.bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      };
    }
    if (parsed.bgType === "color" && parsed.bgColor) {
      return {
        backgroundColor: parsed.bgColor,
      };
    }
    return {};
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : "255, 255, 255";
  };

  const hexToRgbaStr = (hex: string, alpha: number) => {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb}, ${alpha})`;
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

  const parsedStyle = getParsedStyle();
  const customBgStyle = getBackgroundStyles(parsedStyle);
  const isCustomBg = Object.keys(customBgStyle).length > 0;

  const primaryGlowColor = parsedStyle.bgType === 'color'
    ? parsedStyle.bgColor
    : (parsedStyle.cardColor && parsedStyle.cardColor !== 'transparent' ? parsedStyle.cardColor : '#ffffff');
  const glowShadow1 = hexToRgbaStr(primaryGlowColor, 0.45);
  const glowShadow2 = hexToRgbaStr(primaryGlowColor, 0.2);

  const filteredMedia = mediaList.filter(item => {
    if (galleryTab === "all") return true;
    return item.type === galleryTab;
  });

  return (
    <div
      className={`min-h-screen p-4 md:p-8 flex flex-col items-center relative transition-all duration-500 overflow-x-hidden ${
        !isCustomBg ? "bg-[#F5F2EB]" : ""
      }`}
      style={customBgStyle}
    >
      {!isCustomBg && (
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-repeat" style={{ backgroundImage: 'var(--paper-texture)' }} />
      )}

      {/* Estilos CSS Inyectados */}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
          10% { opacity: 0.8; }
          50% { transform: translateY(-55vh) translateX(20px) scale(0.85); opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-115vh) translateX(-20px) scale(1.2); opacity: 0; }
        }
        @keyframes sparkle-twinkle {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 0.9; }
        }
        @keyframes cloud-move {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateX(125vw); opacity: 0; }
        }
        @keyframes border-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 5px var(--glow-shadow-1, rgba(255, 255, 255, 0.2))) drop-shadow(0 0 12px var(--glow-shadow-2, rgba(255, 255, 255, 0.15)));
          }
          50% {
            filter: drop-shadow(0 0 14px var(--glow-shadow-1, rgba(255, 255, 255, 0.45))) drop-shadow(0 0 28px var(--glow-shadow-2, rgba(255, 255, 255, 0.35)));
          }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-border-aura {
          background-size: 200% 200%;
          animation: border-gradient 6s ease infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3.5s ease-in-out infinite;
        }
        .glow-card-border {
          position: relative;
          border-radius: 2.5rem;
          background: transparent;
        }
        .glow-card-border::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 2.5rem;
          padding: 3px;
          background: linear-gradient(to right, var(--glow-color-1, #ffffff), var(--glow-color-2, #ffffff));
          background-size: 200% 200%;
          animation: border-gradient 6s ease infinite;
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      {/* Animación de Confeti de éxito */}
      {showThankYou && <ConfettiBurst />}

      {/* Efectos de fondo opcionales */}
      <BackgroundEffects type={parsedStyle.effectType} />

      {/* Stickers de esquinas opcionales */}
      <EventStickers leftUrl={parsedStyle.leftStickerUrl} rightUrl={parsedStyle.rightStickerUrl} />

      <AnimatePresence mode="wait">
        {!showGuestGallery ? (
          // PANTALLA PRINCIPAL: BIENVENIDA Y CARGADOR
          <motion.div
            key="upload-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-md space-y-6 z-10 pt-10 md:pt-16"
          >
            {/* Cabecera translúcida con aura */}
            <div
              className="w-full relative rounded-[2.5rem] glow-card-border animate-pulse-glow shadow-xl"
              style={{
                '--glow-color-1': primaryGlowColor,
                '--glow-color-2': primaryGlowColor,
                '--glow-shadow-1': glowShadow1,
                '--glow-shadow-2': glowShadow2,
              } as React.CSSProperties}
            >
              <div
                className="backdrop-blur-md p-6 rounded-[2.4rem] text-center space-y-3 relative overflow-hidden"
                style={{ backgroundColor: `rgba(${hexToRgb(parsedStyle.cardColor)}, ${parsedStyle.cardOpacity})` }}
              >
              <h1 className="text-2xl font-black italic tracking-tighter text-stone-850 leading-tight">
                {event?.title}
              </h1>
              <p className="text-stone-700 text-xs md:text-sm leading-relaxed px-2 font-medium">
                {event?.greeting_message || "¡Hola! Comparte tus mejores fotos y videos con nosotros para guardarlos en el álbum de recuerdos del bebé."}
              </p>
            </div>
          </div>

            {/* Cargador translúcido con aura */}
            <div
              className="w-full relative rounded-[2.5rem] glow-card-border animate-pulse-glow shadow-xl"
              style={{
                '--glow-color-1': primaryGlowColor,
                '--glow-color-2': primaryGlowColor,
                '--glow-shadow-1': glowShadow1,
                '--glow-shadow-2': glowShadow2,
              } as React.CSSProperties}
            >
              <div
                className="backdrop-blur-md p-6 rounded-[2.4rem] space-y-4 relative overflow-hidden"
                style={{ backgroundColor: `rgba(${hexToRgb(parsedStyle.cardColor)}, ${parsedStyle.cardOpacity})` }}
              >
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
                      Máximo 30 archivos a la vez
                    </p>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Cola de Subida ({selectedFiles.length}):
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedFiles.map((file, idx) => (
                        <FilePreviewSquare
                          key={idx}
                          file={file}
                          onRemove={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                          uploading={uploading}
                        />
                      ))}
                    </div>
                  </div>
                )}

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
            </div>

            {/* BOTÓN PARA ABRIR LA GALERÍA COMPLETA */}
            <button
              onClick={() => setShowGuestGallery(true)}
              className="w-full py-5 text-stone-800 rounded-[2rem] border border-white/40 shadow-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-md relative"
              style={{ backgroundColor: `rgba(${hexToRgb(parsedStyle.cardColor)}, ${parsedStyle.cardOpacity})` }}
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
          <div
            className="fixed inset-0 z-[2200] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={() => setPreviewItem(null)}
          >
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Contenedor principal con flechas */}
            <div className="relative w-full max-w-4xl flex items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
              {/* Flecha Izquierda */}
              {(() => {
                const idx = mediaList.findIndex(item => item.id === previewItem.id);
                return idx > 0 ? (
                  <button
                    onClick={showPrevPreview}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer shrink-0"
                    title="Anterior"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                  </button>
                ) : (
                  <div className="w-12 h-12 shrink-0 hidden md:block opacity-0 pointer-events-none" />
                );
              })()}

              {/* Contenedor del video/imagen */}
              <div className="max-w-2xl w-full max-h-[75vh] flex items-center justify-center p-2 flex-1">
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

              {/* Flecha Derecha */}
              {(() => {
                const idx = mediaList.findIndex(item => item.id === previewItem.id);
                return idx !== -1 && idx < mediaList.length - 1 ? (
                  <button
                    onClick={showNextPreview}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer shrink-0"
                    title="Siguiente"
                  >
                    <ChevronRight size={24} strokeWidth={2.5} />
                  </button>
                ) : (
                  <div className="w-12 h-12 shrink-0 hidden md:block opacity-0 pointer-events-none" />
                );
              })()}
            </div>

            <div className="mt-6 flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
// Forzar recarga de Next.js HMR
