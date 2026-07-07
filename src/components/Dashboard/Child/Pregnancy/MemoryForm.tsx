"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, X, Film, Image as ImageIcon, Music, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Upload, CheckCircle2, Trash2, Plus, Volume2, Loader2, Check
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import MediaEditor from "@/components/Common/MediaEditor";

interface MemoryFormProps {
  childId: string;
  sectionId?: string | null;
  memory?: any;
  theme: any;
  isMobile?: boolean;
  onComplete: () => void;
  onBack?: () => void;
}

export default function MemoryForm({ childId, sectionId = null, memory, theme, isMobile, onComplete, onBack }: MemoryFormProps) {
  const [date, setDate] = useState(memory ? new Date(memory.memory_date) : new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [title, setTitle] = useState(memory ? memory.title : "");
  const [description, setDescription] = useState(memory ? memory.description : "");
  const [monthNumber, setMonthNumber] = useState<number>(memory ? (memory.month_number || 1) : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);
  
  // Medios
  const [photos, setPhotos] = useState<string[]>(() => {
    if (!memory || !memory.media_urls) return [];
    // Si es tipo 'image', devolvemos todo. Si es mixto, filtramos por extensiones de imagen comunes
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
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (photos.length + selected.length > 3) {
        setError("Máximo 3 fotos.");
        return;
      }
      setLoading(true);
      try {
        const urls = await uploadFiles(selected, 'image');
        setPhotos(prev => [...prev, ...urls].slice(0, 3));
        setError("");
      } catch (err: any) {
        setError("Error al subir fotos: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToEdit(file);
    }
  };

  const onEditComplete = async (processedFile: File, type: 'video' | 'audio') => {
    setLoading(true);
    setFileToEdit(null);
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
    }
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const audioEl = new Audio();
      audioEl.preload = 'metadata';
      audioEl.onloadedmetadata = async () => {
        if (audioEl.duration > 30) {
          setError("El audio no puede durar más de 30 segundos.");
        } else {
          setLoading(true);
          try {
            const [url] = await uploadFiles([file], 'audio');
            setAudio(url);
            setError("");
          } catch (err: any) {
            setError("Error al subir audio: " + err.message);
          } finally {
            setLoading(false);
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

    const allUrls = [...photos];
    if (video) allUrls.push(video);
    if (audio) allUrls.push(audio);

    // Determinamos el tipo principal o marcamos como mixto
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

    const memoryData: any = {
      child_id: childId,
      title,
      description,
      month_number: monthNumber,
      memory_date: date.toISOString().split('T')[0],
      media_urls: allUrls,
      media_type: finalType
    };
    if (sectionId) {
      memoryData.section_id = sectionId;
    }

    let result;
    if (memory) {
      result = await supabase.from("pregnancy_memories").update(memoryData).eq("id", memory.id);
    } else {
      result = await supabase.from("pregnancy_memories").insert(memoryData);
    }

    setLoading(false);
    if (!result.error) {
      onComplete();
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
      {/* CABECERA MÓVIL UNIFICADA (Estilo Baúl) */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-[150] bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between shadow-sm">
          <button 
            onClick={onBack || onComplete} 
            className={`p-2 bg-white rounded-xl shadow-md ${theme.text} border ${theme.borderAccent}`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <h1 className={`text-lg font-black ${theme.text} tracking-tighter italic`}>
            {memory ? 'Editar Recuerdo' : 'Nuevo Recuerdo'}
          </h1>

          <button 
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
            <h2 className={`text-xl md:text-2xl font-outfit font-black ${theme.text}`}>{memory ? 'Editar' : 'Nuevo'} Recuerdo</h2>
          </div>
        </div>
      )}

      {/* Controles de Fecha y Mes (Visibles en Móvil y Escritorio) */}
      <div className={`flex flex-wrap gap-3 ${isMobile ? 'justify-between' : 'justify-end mt-[-70px] mr-6 relative z-10'}`}>
        <div className="relative">
          <button onClick={() => setShowCalendar(!showCalendar)} className={`bg-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl border ${theme.borderAccent} shadow-sm flex items-center gap-2 md:gap-3`}>
            <CalendarIcon size={16} className={theme.text} />
            <span className={`text-xs md:text-sm font-bold ${theme.text}`}>{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </button>
          <AnimatePresence>
            {showCalendar && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`absolute top-full left-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl p-5 z-[100] border ${theme.borderAccent}`}>
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => calMonth === 0 ? (setCalMonth(11), setCalYear(calYear-1)) : setCalMonth(calMonth-1)}><ChevronLeft size={20}/></button>
                  <span className={`text-sm font-black ${theme.text}`}>{months[calMonth]} {calYear}</span>
                  <button onClick={() => calMonth === 11 ? (setCalMonth(0), setCalYear(calYear+1)) : setCalMonth(calMonth+1)}><ChevronRight size={20}/></button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({length: firstDayOfMonth(calYear, calMonth)}).map((_, i) => <div key={i} />)}
                  {Array.from({length: daysInMonth(calYear, calMonth)}).map((_, i) => {
                    const d = i + 1;
                    const isSelected = date.getDate() === d && date.getMonth() === calMonth;
                    return (
                      <button key={d} onClick={() => { setDate(new Date(calYear, calMonth, d)); setShowCalendar(false); }} className={`aspect-square text-xs font-bold rounded-lg ${isSelected ? `${theme.primaryBg} ${theme.textActive} shadow-md` : `hover:${theme.bgLight} ${theme.text}`}`}>{d}</button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className={`bg-white px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl border ${theme.borderAccent} shadow-sm flex items-center gap-2 md:gap-3`}>
          <span className={`text-[9px] md:text-[10px] font-black ${theme.text} opacity-40 uppercase`}>Mes:</span>
          <select 
            value={monthNumber} 
            onChange={(e) => setMonthNumber(parseInt(e.target.value))}
            className={`text-xs md:text-sm font-black ${theme.text} outline-none bg-transparent cursor-pointer`}
          >
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>Mes {i+1}</option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className={`bg-white p-5 md:p-6 rounded-[2rem] border ${theme.borderAccent} shadow-sm`}>
            <label className={`block text-[10px] font-black ${theme.text} opacity-40 uppercase mb-2`}>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. El primer latido..." className={`w-full text-lg md:text-xl font-bold ${theme.text} outline-none`} />
          </div>
          <div className={`bg-white p-5 md:p-6 rounded-[2rem] border ${theme.borderAccent} shadow-sm`}>
            <label className={`block text-[10px] font-black ${theme.text} opacity-40 uppercase mb-2`}>Historia</label>
            <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Escribe aquí..." className={`w-full text-sm md:text-base ${theme.text} opacity-80 outline-none resize-none`} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => photoInputRef.current?.click()} className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${photos.length >= 3 ? `${theme.bgLight} ${theme.borderAccent}` : `bg-white hover:${theme.bgLight}`}`} style={photos.length < 3 ? { ['--hover-border' as any]: theme.hex } : undefined} onMouseEnter={(e) => { if(photos.length < 3) e.currentTarget.style.borderColor = theme.hex; }} onMouseLeave={(e) => { if(photos.length < 3) e.currentTarget.style.borderColor = '#e5e7eb'; }}>
              <ImageIcon size={20} className={theme.text} />
              <span className={`text-[10px] font-black ${theme.text}`}>Fotos</span>
              <input type="file" ref={photoInputRef} className="hidden" multiple accept="image/*" onChange={handlePhotoChange} />
            </button>
            <button onClick={() => videoInputRef.current?.click()} className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${video ? `${theme.bgLight} ${theme.borderAccent}` : `bg-white hover:${theme.bgLight}`}`} style={!video ? { ['--hover-border' as any]: theme.hex } : undefined} onMouseEnter={(e) => { if(!video) e.currentTarget.style.borderColor = theme.hex; }} onMouseLeave={(e) => { if(!video) e.currentTarget.style.borderColor = '#e5e7eb'; }}>
              <Film size={20} className={theme.text} />
              <span className={`text-[10px] font-black ${theme.text}`}>Video</span>
              <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoChange} />
            </button>
            <button onClick={() => audioInputRef.current?.click()} className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${audio ? `${theme.bgLight} ${theme.borderAccent}` : `bg-white hover:${theme.bgLight}`}`} style={!audio ? { ['--hover-border' as any]: theme.hex } : undefined} onMouseEnter={(e) => { if(!audio) e.currentTarget.style.borderColor = theme.hex; }} onMouseLeave={(e) => { if(!audio) e.currentTarget.style.borderColor = '#e5e7eb'; }}>
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
                  <button onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className={`absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><X size={10}/></button>
                </div>
              ))}
              {video && (
                <div className={`relative w-20 h-20 rounded-lg bg-black/5 flex items-center justify-center group shadow-sm border ${theme.borderAccent}`}>
                  <Film size={24} className={`${theme.text} opacity-20`} />
                  <button onClick={() => setVideo(null)} className={`absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><X size={10}/></button>
                  <span className={`absolute bottom-1 text-[8px] font-black ${theme.text} opacity-40`}>VIDEO</span>
                </div>
              )}
              {audio && (
                <div className={`relative w-20 h-20 rounded-lg ${theme.bgLight} flex items-center justify-center group shadow-sm border ${theme.borderAccent}`}>
                  <Volume2 size={24} className={theme.text} />
                  <button onClick={() => setAudio(null)} className={`absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><X size={10}/></button>
                  <span className={`absolute bottom-1 text-[8px] font-black ${theme.text} opacity-40`}>AUDIO</span>
                </div>
              )}
              {!photos.length && !video && !audio && <p className={`text-[10px] ${theme.text} opacity-30 italic py-4`}>No hay archivos seleccionados.</p>}
            </div>
          </div>

          {error && <p className="text-[10px] font-bold text-red-500 ml-2 mt-2">{error}</p>}
          <button onClick={handleSave} disabled={loading} className={`w-full mt-4 py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2 ${loading ? '' : `${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} hover:scale-[1.02] active:scale-95`} text-white`} style={loading ? { backgroundColor: `${theme.hex}80` } : {}}>
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
    </div>
  );
}
