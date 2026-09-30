"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, X, Film, Image as ImageIcon, Music,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Upload, CheckCircle2, Trash2, Plus, Volume2, Loader2, Check,
  Sparkles, Clock, Baby
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import MediaEditor from "@/components/Common/MediaEditor";
import { useChild } from "@/context/ChildContext";
import {
  getMemoryAuthor,
  cleanMemoryText,
  formatMemoryTextWithAuthor,
  MemoryAuthorSelector,
  MemoryAuthor
} from "@/lib/memoryAuthor";
import MemoryLoadingModal from "@/components/Common/MemoryLoadingModal";
import { optimizeImagesBatch } from "@/lib/imageCompression";

interface MemoryFormProps {
  childId: string;
  child?: any;
  sectionId?: string | null;
  sectionTitle?: string;
  memory?: any;
  theme: any;
  isMobile?: boolean;
  onComplete: (message?: string) => void;
  onBack?: () => void;
}

/**
 * Calcula con precisión la etapa para cualquier fecha de recuerdo:
 * - Durante la gestación: Calcula la semana de gestación exacta a partir de la FUM y el mes obstétrico equivalente.
 * - Después de nacer: Calcula la edad exacta en meses y años a partir de la fecha de nacimiento del bebé.
 */
export function calculateStageFromDate(
  targetDate: Date,
  childInfo: any,
  sectionId?: string | null,
  sectionTitle?: string
) {
  const fumStr = childInfo?.preview_config?.fum;
  const birthDateStr = childInfo?.birth_date;
  const isBornStatus = childInfo?.preview_config?.status === "born";

  // Normalizar fecha del recuerdo a medianoche local
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  let birthDate: Date | null = null;
  if (birthDateStr) {
    const bParts = birthDateStr.split("-").map(Number);
    if (bParts.length >= 3 && !isNaN(bParts[0])) {
      birthDate = new Date(bParts[0], bParts[1] - 1, bParts[2]);
    }
  }

  let fumDate: Date | null = null;
  if (fumStr) {
    const fParts = fumStr.split("-").map(Number);
    if (fParts.length >= 3 && !isNaN(fParts[0])) {
      fumDate = new Date(fParts[0], fParts[1] - 1, fParts[2]);
    }
  }

  // Determinación de si la fecha seleccionada corresponde a Gestación o Post-Nacimiento:
  // Si target >= birthDate, el bebé ya había nacido en esa fecha.
  // Si target < birthDate (o aún no nace), corresponde a la etapa de gestación.
  const isBorn = birthDate ? target >= birthDate : (isBornStatus && !fumDate);
  const isGestation = !isBorn;

  // 1. CÁLCULO PARA GESTACIÓN (POR SEMANAS Y MES)
  if (isGestation && fumDate) {
    const diffTime = target.getTime() - fumDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const rawWeek = Math.floor(diffDays / 7) + 1;
    const week = Math.max(1, Math.min(42, rawWeek));

    // Mapeo obstétrico de semana a mes de embarazo (1 al 9)
    let gestMonth = 1;
    if (week <= 4) gestMonth = 1;
    else if (week <= 8) gestMonth = 2;
    else if (week <= 13) gestMonth = 3;
    else if (week <= 17) gestMonth = 4;
    else if (week <= 22) gestMonth = 5;
    else if (week <= 27) gestMonth = 6;
    else if (week <= 31) gestMonth = 7;
    else if (week <= 35) gestMonth = 8;
    else gestMonth = 9;

    return {
      stageType: 'gestation' as const,
      week,
      month: gestMonth,
      badgeText: `Semana ${week} (${gestMonth}° mes)`,
      helperText: `Gestación · Semana ${week}`,
      suggestedTitle: `Semana ${week} de gestación`
    };
  }

  // 2. CÁLCULO CUANDO YA NACIÓ (POR MESES Y AÑOS DE VIDA)
  if (isBorn && birthDate) {
    let years = target.getFullYear() - birthDate.getFullYear();
    let months = target.getMonth() - birthDate.getMonth();
    let days = target.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const totalCompletedMonths = Math.max(0, years * 12 + months);
    // En álbumes y calendarios de hitos:
    // Mes 0 (< 30 días): Mes 1 (Recién nacido / 1er mes de vida)
    // 1 mes cumplido: Mes 1
    // Más de 1 mes: Mes 2, Mes 3, ... Mes 12 (1 año), Mes 14 (1 año y 2 meses)...
    const monthNum = Math.max(1, totalCompletedMonths === 0 ? 1 : totalCompletedMonths);

    let badgeText = "";
    let helperText = "";
    let suggestedTitle = "";

    if (years === 0) {
      if (totalCompletedMonths === 0) {
        badgeText = `Mes 1 (${days} ${days === 1 ? 'día' : 'días'})`;
        helperText = `Recién nacido (${days} ${days === 1 ? 'día' : 'días'})`;
        suggestedTitle = days === 0 ? "¡Día de nacimiento!" : `Recién nacido (${days} días)`;
      } else {
        badgeText = `Mes ${totalCompletedMonths} (${totalCompletedMonths} ${totalCompletedMonths === 1 ? 'mes' : 'meses'})`;
        helperText = `${totalCompletedMonths} ${totalCompletedMonths === 1 ? 'mes' : 'meses'} de vida`;
        suggestedTitle = `Mes ${totalCompletedMonths}`;
      }
    } else {
      const yText = years === 1 ? "1 año" : `${years} años`;
      const mText = months > 0 ? ` y ${months} ${months === 1 ? 'mes' : 'meses'}` : "";
      badgeText = `Mes ${totalCompletedMonths} (${yText}${mText})`;
      helperText = `${yText}${mText}`;
      suggestedTitle = `${yText}${mText}`;
    }

    return {
      stageType: 'born' as const,
      week: null,
      month: monthNum,
      totalMonths: totalCompletedMonths,
      badgeText,
      helperText,
      suggestedTitle
    };
  }

  // 3. FALLBACK GENERAL (si aún no se han configurado fechas en el perfil)
  const defaultMonth = target.getMonth() + 1;
  const isProbableGestation = !isBornStatus && !birthDateStr;
  return {
    stageType: isProbableGestation ? 'gestation' as const : 'born' as const,
    week: null,
    month: defaultMonth,
    badgeText: `Mes ${defaultMonth}`,
    helperText: "Mes calendario",
    suggestedTitle: ""
  };
}

export default function MemoryForm({
  childId,
  child,
  sectionId = null,
  sectionTitle,
  memory,
  theme,
  isMobile,
  onComplete,
  onBack
}: MemoryFormProps) {
  const childCtx = useChild();
  const [childData, setChildData] = useState<any>(child || childCtx?.child || null);

  // Inicializar fecha del recuerdo (manejando hora local exacta)
  const [date, setDate] = useState<Date>(() => {
    if (memory?.memory_date) {
      const parts = memory.memory_date.split('T')[0].split('-').map(Number);
      if (parts.length >= 3 && !isNaN(parts[0])) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    return new Date();
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [author, setAuthor] = useState<MemoryAuthor>(() => {
    return getMemoryAuthor(memory) || 'mom';
  });
  const [title, setTitle] = useState(memory ? memory.title : "");
  const [description, setDescription] = useState(memory ? cleanMemoryText(memory.description) : "");
  const [monthNumber, setMonthNumber] = useState<number>(memory ? (memory.month_number || 1) : 1);
  const [gestationWeek, setGestationWeek] = useState<number>(1);
  const [isGestationMode, setIsGestationMode] = useState<boolean>(true);
  const [stageBadge, setStageBadge] = useState<string>("");
  const [userEditedTitle, setUserEditedTitle] = useState<boolean>(!!memory?.title);
  const [loading, setLoading] = useState(false);
  const [loadingModal, setLoadingModal] = useState<{ isOpen: boolean; title?: string; subtitle?: string }>({ isOpen: false });
  const [error, setError] = useState("");
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);

  // Cargar datos del niño si no vienen por props ni en contexto inicial
  useEffect(() => {
    if (!childData) {
      if (childCtx?.child) {
        setChildData(childCtx.child);
      } else {
        supabase.from("children").select("*").eq("id", childId).single().then(({ data }) => {
          if (data) setChildData(data);
        });
      }
    }
  }, [childId, child, childCtx?.child]);

  // Sincronizar cálculo de semana y mes según la fecha elegida
  const applyStageCalculation = useCallback((targetDate: Date, childObj: any, isUserDateChange = false) => {
    const stage = calculateStageFromDate(targetDate, childObj, sectionId, sectionTitle);
    setIsGestationMode(stage.stageType === 'gestation');
    setStageBadge(stage.badgeText);

    if (stage.week) {
      setGestationWeek(stage.week);
    }

    // Auto-seleccionar automáticamente semana y mes cuando es nuevo recuerdo o el usuario cambia la fecha
    if (!memory || isUserDateChange) {
      setMonthNumber(stage.month);

      // Sugerir título automático si el usuario no ha puesto uno personalizado
      if ((!userEditedTitle || title === "" || title.startsWith("Semana ") || title.startsWith("Mes ")) && stage.suggestedTitle) {
        setTitle(stage.suggestedTitle);
      }
    }
  }, [sectionId, sectionTitle, memory, userEditedTitle, title]);

  // Recalcular al cargar el perfil del niño
  useEffect(() => {
    if (childData) {
      applyStageCalculation(date, childData, false);
    }
  }, [childData, applyStageCalculation]);

  // Soporte para parámetros de URL (ej. navegar desde calendario de embarazo)
  useEffect(() => {
    if (!memory && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTitle = params.get("title");
      const urlWeek = params.get("week");
      const urlMonth = params.get("month");
      if (urlTitle) {
        setTitle(decodeURIComponent(urlTitle));
        setUserEditedTitle(true);
      } else if (urlWeek) {
        setTitle(`Semana ${urlWeek} de gestación`);
      }
      if (urlMonth && !isNaN(parseInt(urlMonth))) {
        setMonthNumber(Math.min(36, Math.max(1, parseInt(urlMonth))));
      } else if (urlWeek && !isNaN(parseInt(urlWeek))) {
        const w = parseInt(urlWeek);
        setGestationWeek(w);
        let m = 1;
        if (w <= 4) m = 1;
        else if (w <= 8) m = 2;
        else if (w <= 13) m = 3;
        else if (w <= 17) m = 4;
        else if (w <= 22) m = 5;
        else if (w <= 27) m = 6;
        else if (w <= 31) m = 7;
        else if (w <= 35) m = 8;
        else m = 9;
        setMonthNumber(m);
      }
    }
  }, [memory]);

  // Medios
  const [photos, setPhotos] = useState<string[]>(() => {
    if (!memory || !memory.media_urls) return [];
    return memory.media_urls.filter((url: string) =>
      url.match(/\.(jpg|jpeg|png|gif|webp)/i) || memory.media_type === 'image'
    ).slice(0, 3);
  });

  const [video, setVideo] = useState<string | null>(() => {
    if (!memory || !memory.media_urls) return null;
    return memory.media_urls.find((url: string) =>
      url.match(/\.(mp4|webm|mov)/i) || memory.media_type === 'video'
    ) || null;
  });

  const [audio, setAudio] = useState<string | null>(() => {
    if (!memory || !memory.media_urls) return null;
    return memory.media_urls.find((url: string) =>
      url.match(/\.(mp3|wav|ogg|m4a)/i) || memory.media_type === 'audio'
    ) || null;
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: File[], mediaType: 'image' | 'video' | 'audio') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sesión no encontrada.");

    const formData = new FormData();
    formData.append("childId", childId);
    formData.append("module", "pregnancy");
    formData.append("section", "memories");
    formData.append("mediaType", mediaType);
    formData.append("monthNumber", String(monthNumber));
    files.forEach(file => formData.append("files", file));

    const response = await fetch("/api/media", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "No se pudo subir el archivo.");

    return (payload.uploaded || []).map((item: { url: string }) => item.url);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      // Resetear el input para permitir volver a elegir la misma foto si se desea
      e.target.value = "";

      if (photos.length + selected.length > 3) {
        setError("Máximo 3 fotos.");
        return;
      }
      setLoading(true);
      setLoadingModal({
        isOpen: true,
        title: "Subiendo tus fotitos mágicas... ✨",
        subtitle: "Optimizando y preparando las imágenes con amor...",
      });
      try {
        const optimizedFiles = await optimizeImagesBatch(selected);
        const urls = await uploadFiles(optimizedFiles, 'image');
        setPhotos(prev => [...prev, ...urls].slice(0, 3));
        setError("");
      } catch (err: any) {
        setError("Error al subir fotos: " + err.message);
      } finally {
        setLoading(false);
        setLoadingModal({ isOpen: false });
      }
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      setFileToEdit(file);
    }
  };

  const onEditComplete = async (processedFile: File, type: 'video' | 'audio') => {
    setLoading(true);
    setFileToEdit(null);
    setLoadingModal({
      isOpen: true,
      title: type === 'video' ? "Subiendo tu video... 🎬" : "Subiendo tu audio... 🎵",
      subtitle: "Guardando archivo multimedia en la nube...",
    });
    try {
      const [url] = await uploadFiles([processedFile], type);
      if (type === 'video') {
        setVideo(url);
      } else {
        setAudio(url);
      }
      setError("");
    } catch (err: any) {
      setError("Error al procesar archivo: " + err.message);
    } finally {
      setLoading(false);
      setLoadingModal({ isOpen: false });
    }
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      const audioEl = new Audio();
      audioEl.preload = 'metadata';
      audioEl.onloadedmetadata = async () => {
        if (audioEl.duration > 30) {
          setError("El audio no puede durar más de 30 segundos.");
        } else {
          setLoading(true);
          setLoadingModal({
            isOpen: true,
            title: "Subiendo nota de voz... 🎵",
            subtitle: "Guardando audio en la nube...",
          });
          try {
            const [url] = await uploadFiles([file], 'audio');
            setAudio(url);
            setError("");
          } catch (err: any) {
            setError("Error al subir audio: " + err.message);
          } finally {
            setLoading(false);
            setLoadingModal({ isOpen: false });
          }
        }
      };
      audioEl.src = URL.createObjectURL(file);
    }
  };

  const handleSave = async () => {
    if (!title) {
      setError("Por favor, ponle un título.");
      return;
    }
    setLoading(true);
    setLoadingModal({
      isOpen: true,
      title: memory ? "Actualizando recuerdo... ✨" : "Sellando tu recuerdo... 🍼",
      subtitle: "Guardando este momento especial en la cápsula del tiempo...",
    });

    const allUrls = [...photos];
    if (video) allUrls.push(video);
    if (audio) allUrls.push(audio);

    let finalType: 'image' | 'video' | 'audio' | 'mixed' = 'image';
    const hasImages = photos.length > 0;
    const hasVideo = !!video;
    const hasAudio = !!audio;

    if ((hasImages && (hasVideo || hasAudio)) || (hasVideo && hasAudio)) {
      finalType = 'mixed';
    } else if (hasVideo) {
      finalType = 'video';
    } else if (hasAudio) {
      finalType = 'audio';
    }

    // Formatear fecha local YYYY-MM-DD para evitar desfase de huso horario
    const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const finalDescription = formatMemoryTextWithAuthor(description, author);

    const memoryData: any = {
      child_id: childId,
      title,
      description: finalDescription,
      month_number: monthNumber,
      memory_date: localDateStr,
      media_urls: allUrls,
      media_type: finalType,
      author: author || 'mom'
    };
    if (sectionId) {
      memoryData.section_id = sectionId;
    }

    let result;
    try {
      if (memory) {
        result = await supabase.from("pregnancy_memories").update(memoryData).eq("id", memory.id);
        if (result.error && (result.error.message?.includes('author') || result.error.code === 'PGRST204')) {
          delete memoryData.author;
          result = await supabase.from("pregnancy_memories").update(memoryData).eq("id", memory.id);
        }
      } else {
        result = await supabase.from("pregnancy_memories").insert(memoryData);
        if (result.error && (result.error.message?.includes('author') || result.error.code === 'PGRST204')) {
          delete memoryData.author;
          result = await supabase.from("pregnancy_memories").insert(memoryData);
        }
      }
    } finally {
      setLoading(false);
      setLoadingModal({ isOpen: false });
    }
    if (!result.error) {
      onComplete(memory ? "¡Recuerdo actualizado con éxito!" : "¡Recuerdo creado con éxito!");
    } else {
      setError("Error: " + result.error.message);
    }
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const [calMonth, setCalMonth] = useState(date.getMonth());
  const [calYear, setCalYear] = useState(date.getFullYear());
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className={`w-full space-y-6 pb-20 ${isMobile ? 'pt-24 px-4' : 'px-8 md:px-12'}`}>
      {/* CABECERA MÓVIL UNIFICADA */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-[150] bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between shadow-sm">
          <button
            type="button"
            onClick={() => onBack ? onBack() : onComplete()}
            className={`p-2 bg-white rounded-xl shadow-md ${theme.text} border ${theme.borderAccent}`}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex flex-col items-center">
            <h1 className={`text-base font-black ${theme.text} tracking-tighter italic`}>
              {memory ? 'Editar Recuerdo' : 'Nuevo Recuerdo'}
            </h1>
            {stageBadge && (
              <span className={`text-[9px] font-bold opacity-60 ${theme.text}`}>
                {stageBadge}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`w-10 h-10 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all disabled:opacity-50`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={22} />}
          </button>
        </div>
      )}

      {/* Header Escritorio */}
      {!isMobile && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 p-4 md:p-6 rounded-[2rem] border border-white shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}><Plus size={24} /></div>
            <div>
              <h2 className={`text-xl md:text-2xl font-outfit font-black ${theme.text}`}>
                {memory ? 'Editar' : 'Nuevo'} Recuerdo
              </h2>
              {stageBadge && (
                <p className={`text-xs font-bold ${theme.text} opacity-50 mt-0.5`}>
                  {stageBadge}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controles de Fecha y Semana / Mes Sincronizados Automáticamente */}
      <div className={`flex flex-wrap items-center gap-3 ${isMobile ? 'justify-between' : 'justify-end mt-[-70px] mr-6 relative z-10'}`}>
        {/* Selector de Fecha */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className={`bg-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl border ${theme.borderAccent} shadow-sm flex items-center gap-2 md:gap-3 hover:border-current transition-all`}
          >
            <CalendarIcon size={16} className={theme.text} />
            <span className={`text-xs md:text-sm font-bold ${theme.text}`}>
              {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </button>
          <AnimatePresence>
            {showCalendar && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute top-full left-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl p-5 z-[100] border ${theme.borderAccent}`}>
                <div className="flex justify-between items-center mb-4">
                  <button type="button" onClick={() => calMonth === 0 ? (setCalMonth(11), setCalYear(calYear - 1)) : setCalMonth(calMonth - 1)}><ChevronLeft size={20} /></button>
                  <span className={`text-sm font-black ${theme.text}`}>{months[calMonth]} {calYear}</span>
                  <button type="button" onClick={() => calMonth === 11 ? (setCalMonth(0), setCalYear(calYear + 1)) : setCalMonth(calMonth + 1)}><ChevronRight size={20} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth(calYear, calMonth) }).map((_, i) => <div key={i} />)}
                  {Array.from({ length: daysInMonth(calYear, calMonth) }).map((_, i) => {
                    const d = i + 1;
                    const isSelected = date.getDate() === d && date.getMonth() === calMonth && date.getFullYear() === calYear;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const newD = new Date(calYear, calMonth, d);
                          setDate(newD);
                          setShowCalendar(false);
                          applyStageCalculation(newD, childData, true);
                        }}
                        className={`aspect-square text-xs font-bold rounded-lg ${isSelected ? `${theme.primaryBg} ${theme.textActive} shadow-md` : `hover:${theme.bgLight} ${theme.text}`}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selector de Gestación (por Semana) o de Bebé Nacido (por Mes) */}
        {isGestationMode ? (
          <div className={`bg-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border ${theme.borderAccent} shadow-sm flex items-center gap-2`}>
            <span className={`text-[9px] md:text-[10px] font-black ${theme.text} opacity-40 uppercase`}>Semana:</span>
            <select
              value={gestationWeek}
              onChange={(e) => {
                const w = parseInt(e.target.value);
                setGestationWeek(w);
                let m = 1;
                if (w <= 4) m = 1;
                else if (w <= 8) m = 2;
                else if (w <= 13) m = 3;
                else if (w <= 17) m = 4;
                else if (w <= 22) m = 5;
                else if (w <= 27) m = 6;
                else if (w <= 31) m = 7;
                else if (w <= 35) m = 8;
                else m = 9;
                setMonthNumber(m);
                if (!userEditedTitle && !memory) {
                  setTitle(`Semana ${w} de gestación`);
                }
              }}
              className={`text-xs md:text-sm font-black ${theme.text} outline-none bg-transparent cursor-pointer`}
            >
              {[...Array(42)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Semana {i + 1}</option>
              ))}
            </select>
            <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full ${theme.bgLight} ${theme.text} opacity-70`}>
              Mes {monthNumber}
            </span>
          </div>
        ) : (
          <div className={`bg-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border ${theme.borderAccent} shadow-sm flex items-center gap-2`}>
            <span className={`text-[9px] md:text-[10px] font-black ${theme.text} opacity-40 uppercase`}>Mes:</span>
            <select
              value={monthNumber}
              onChange={(e) => setMonthNumber(parseInt(e.target.value))}
              className={`text-xs md:text-sm font-black ${theme.text} outline-none bg-transparent cursor-pointer`}
            >
              {[...Array(Math.max(24, monthNumber + 6))].map((_, i) => {
                const m = i + 1;
                let optLabel = `Mes ${m}`;
                if (m === 1) optLabel = "Mes 1 (Primer mes)";
                else if (m === 12) optLabel = "Mes 12 (1 año)";
                else if (m === 24) optLabel = "Mes 24 (2 años)";
                else if (m > 12) {
                  const y = Math.floor(m / 12);
                  const r = m % 12;
                  optLabel = `Mes ${m} (${y} año${y > 1 ? 's' : ''}${r > 0 ? ` y ${r} m` : ''})`;
                }
                return <option key={m} value={m}>{optLabel}</option>;
              })}
            </select>
            {stageBadge && (
              <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full ${theme.bgLight} ${theme.text} opacity-70 hidden sm:inline`}>
                {stageBadge}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Selector de Autor: Papá o Mamá */}
          <div className={`bg-white p-4 md:p-5 rounded-[2rem] border ${theme.borderAccent} shadow-sm`}>
            <MemoryAuthorSelector
              value={author}
              onChange={(newAuthor) => setAuthor(newAuthor)}
              theme={theme}
            />
          </div>

          <div className={`bg-white p-5 md:p-6 rounded-[2rem] border ${theme.borderAccent} shadow-sm`}>
            <label className={`block text-[10px] font-black ${theme.text} opacity-40 uppercase mb-2`}>Título</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setUserEditedTitle(true);
              }}
              placeholder={isGestationMode ? `Ej. Semana ${gestationWeek} de gestación...` : "Ej. Su primer diente, primera sonrisa..."}
              className={`w-full text-lg md:text-xl font-bold ${theme.text} outline-none`}
            />
          </div>
          <div className={`bg-white p-5 md:p-6 rounded-[2rem] border ${theme.borderAccent} shadow-sm`}>
            <label className={`block text-[10px] font-black ${theme.text} opacity-40 uppercase mb-2`}>Historia</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe aquí..."
              className={`w-full text-sm md:text-base ${theme.text} opacity-80 outline-none resize-none`}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${photos.length >= 3 ? `${theme.bgLight} ${theme.borderAccent}` : `bg-white hover:${theme.bgLight}`}`}
              style={photos.length < 3 ? { ['--hover-border' as any]: theme.hex } : undefined}
              onMouseEnter={(e) => { if (photos.length < 3) e.currentTarget.style.borderColor = theme.hex; }}
              onMouseLeave={(e) => { if (photos.length < 3) e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              <ImageIcon size={20} className={theme.text} />
              <span className={`text-[10px] font-black ${theme.text}`}>Fotos</span>
              <input type="file" ref={photoInputRef} className="hidden" multiple accept="image/*" onChange={handlePhotoChange} />
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${video ? `${theme.bgLight} ${theme.borderAccent}` : `bg-white hover:${theme.bgLight}`}`}
              style={!video ? { ['--hover-border' as any]: theme.hex } : undefined}
              onMouseEnter={(e) => { if (!video) e.currentTarget.style.borderColor = theme.hex; }}
              onMouseLeave={(e) => { if (!video) e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              <Film size={20} className={theme.text} />
              <span className={`text-[10px] font-black ${theme.text}`}>Video</span>
              <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoChange} />
            </button>
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${audio ? `${theme.bgLight} ${theme.borderAccent}` : `bg-white hover:${theme.bgLight}`}`}
              style={!audio ? { ['--hover-border' as any]: theme.hex } : undefined}
              onMouseEnter={(e) => { if (!audio) e.currentTarget.style.borderColor = theme.hex; }}
              onMouseLeave={(e) => { if (!audio) e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              <Music size={20} className={theme.text} />
              <span className={`text-[10px] font-black ${theme.text}`}>Audio</span>
              <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioChange} />
            </button>
          </div>

          <div className="bg-white/40 p-4 rounded-2xl border border-white min-h-[120px]">
            <label className={`block text-[10px] font-black ${theme.text} opacity-40 uppercase mb-3`}>Archivos Cargados</label>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group shadow-sm">
                  <img src={p} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className={`absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><X size={10} /></button>
                </div>
              ))}
              {video && (
                <div className={`relative w-20 h-20 rounded-lg bg-black/5 flex items-center justify-center group shadow-sm border ${theme.borderAccent}`}>
                  <Film size={24} className={`${theme.text} opacity-20`} />
                  <button type="button" onClick={() => setVideo(null)} className={`absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><X size={10} /></button>
                  <span className={`absolute bottom-1 text-[8px] font-black ${theme.text} opacity-40`}>VIDEO</span>
                </div>
              )}
              {audio && (
                <div className={`relative w-20 h-20 rounded-lg ${theme.bgLight} flex items-center justify-center group shadow-sm border ${theme.borderAccent}`}>
                  <Volume2 size={24} className={theme.text} />
                  <button type="button" onClick={() => setAudio(null)} className={`absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><X size={10} /></button>
                  <span className={`absolute bottom-1 text-[8px] font-black ${theme.text} opacity-40`}>AUDIO</span>
                </div>
              )}
              {!photos.length && !video && !audio && <p className={`text-[10px] ${theme.text} opacity-30 italic py-4`}>No hay archivos seleccionados.</p>}
            </div>
          </div>

          {error && <p className="text-[10px] font-bold text-red-500 ml-2 mt-2">{error}</p>}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`w-full mt-4 py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2 ${loading ? '' : `${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} hover:scale-[1.02] active:scale-95`} text-white`}
            style={loading ? { backgroundColor: `${theme.hex}80` } : {}}
          >
            {loading ? 'Guardando...' : <><Save size={20} /> Guardar Recuerdo</>}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {fileToEdit && (
          <MediaEditor
            file={fileToEdit}
            onClose={() => setFileToEdit(null)}
            onComplete={onEditComplete}
          />
        )}
      </AnimatePresence>

      {/* Modal de animación con Vg1.gif */}
      <MemoryLoadingModal
        isOpen={loadingModal.isOpen}
        title={loadingModal.title}
        subtitle={loadingModal.subtitle}
        theme={theme}
      />
    </div>
  );
}
