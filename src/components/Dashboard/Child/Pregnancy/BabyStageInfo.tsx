"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Camera, Loader2, Save, Baby, Calendar, Scale, Ruler 
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BabyStageInfoProps {
  childId: string;
  sectionId: string;
  theme: any;
  isMobile?: boolean;
  onBack: () => void;
}

export default function BabyStageInfo({ childId, sectionId, theme, isMobile, onBack }: BabyStageInfoProps) {
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [childRes, sectionRes] = await Promise.all([
          supabase.from("children").select("*").eq("id", childId).single(),
          supabase.from("life_sections").select("*").eq("id", sectionId).single()
        ]);

        if (childRes.data) setChild(childRes.data);
        
        if (sectionRes.data) {
          setWeight(sectionRes.data.baby_weight || "");
          setHeight(sectionRes.data.baby_height || "");
          setPhotoUrl(sectionRes.data.baby_photo || null);
        }
      } catch (err) {
        console.error("Error loading stage baby info:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [childId, sectionId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión no encontrada.");

      const formData = new FormData();
      formData.append("childId", childId);
      formData.append("module", "pregnancy");
      formData.append("section", "baby_info");
      formData.append("mediaType", "image");
      formData.append("monthNumber", "1");
      formData.append("files", file);

      const response = await fetch("/api/media", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Error al subir la imagen");

      const uploadedUrl = payload.uploaded?.[0]?.url;
      if (uploadedUrl) {
        setPhotoUrl(uploadedUrl);
      }
    } catch (err: any) {
      console.error(err);
      setError("Error al subir la foto: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const { error } = await supabase
        .from("life_sections")
        .update({
          baby_weight: weight,
          baby_height: height,
          baby_photo: photoUrl
        })
        .eq("id", sectionId);

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !child) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin opacity-20" size={42} />
      </div>
    );
  }

  const genderLabel = child.gender === "girl" ? "Niña 🎀" : child.gender === "boy" ? "Niño 🧸" : "Sin especificar";

  return (
    <div className={`w-full space-y-6 pb-20 ${isMobile ? 'pt-24 px-4' : 'px-8 md:px-12'}`}>
      
      {/* CABECERA MÓVIL UNIFICADA */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-[150] bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between shadow-sm">
          <button 
            onClick={onBack} 
            className={`p-2 bg-white rounded-xl shadow-md ${theme.text} border ${theme.borderAccent}`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <h1 className={`text-lg font-black ${theme.text} tracking-tighter italic`}>
            Ficha del Bebé
          </h1>

          <button 
            onClick={handleSave}
            disabled={saving}
            className={`w-10 h-10 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all disabled:opacity-50`}
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={20} />}
          </button>
        </div>
      )}

      {/* Cabecera Escritorio */}
      {!isMobile && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 p-4 md:p-6 rounded-[2rem] border border-white shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}><Baby size={24} /></div>
            <div>
              <h2 className={`text-xl md:text-2xl font-outfit font-black ${theme.text}`}>Información del Bebé</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">Estadísticas específicas de esta etapa</p>
            </div>
          </div>
          <button 
            onClick={onBack}
            className={`px-5 py-3 rounded-2xl bg-white ${theme.text} border ${theme.borderAccent} font-black hover:scale-105 active:scale-95 transition-all shadow-sm text-[10px] md:text-base uppercase tracking-widest`}
          >
            Volver
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
        
        {/* Columna Izquierda: Foto de Perfil de la Etapa */}
        <div className="flex flex-col items-center bg-white/50 border border-white p-6 rounded-[2.5rem] shadow-sm backdrop-blur-md">
          <h3 className={`text-xs md:text-sm font-black ${theme.text} uppercase tracking-wider mb-6`}>Foto de la Etapa</h3>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-white shadow-xl overflow-hidden cursor-pointer bg-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            {photoUrl ? (
              <img src={photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Bebé" />
            ) : (
              <Baby size={54} className="text-gray-300 group-hover:scale-110 transition-transform" />
            )}
            
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />

          <p className="text-[10px] text-gray-400 mt-4 text-center font-medium leading-relaxed">
            Pulsa el círculo para subir una foto representativa de esta etapa de vida.
          </p>
        </div>

        {/* Columna Derecha/Medio: Campos del Formulario */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Ficha Sincronizada del Perfil Global */}
          <div className="bg-white/50 border border-white p-5 rounded-[2.5rem] shadow-sm backdrop-blur-md space-y-4">
            <h3 className={`text-xs md:text-sm font-black ${theme.text} uppercase tracking-wider`}>Datos del Perfil (Sincronizado)</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/80 p-4 rounded-2xl border border-white/40 shadow-inner flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gray-100 ${theme.text}`}><Baby size={18} /></div>
                <div>
                  <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">Nombre</span>
                  <span className={`text-sm font-black ${theme.text} leading-none`}>{child.name}</span>
                </div>
              </div>
              <div className="bg-white/80 p-4 rounded-2xl border border-white/40 shadow-inner flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gray-100 ${theme.text}`}><Calendar size={18} /></div>
                <div>
                  <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">Sexo / Género</span>
                  <span className={`text-sm font-black ${theme.text} leading-none`}>{genderLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas de esta etapa */}
          <div className="bg-white/50 border border-white p-5 rounded-[2.5rem] shadow-sm backdrop-blur-md space-y-4">
            <h3 className={`text-xs md:text-sm font-black ${theme.text} uppercase tracking-wider`}>Medidas de esta Etapa</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gray-50 ${theme.text}`}><Scale size={18} /></div>
                <div className="flex-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 ml-0.5">Peso</label>
                  <input 
                    type="text" 
                    value={weight} 
                    onChange={(e) => setWeight(e.target.value)} 
                    placeholder="ej. 8.4 kg" 
                    className={`w-full text-sm font-black outline-none bg-transparent ${theme.text}`} 
                  />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gray-50 ${theme.text}`}><Ruler size={18} /></div>
                <div className="flex-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 ml-0.5">Estatura</label>
                  <input 
                    type="text" 
                    value={height} 
                    onChange={(e) => setHeight(e.target.value)} 
                    placeholder="ej. 68 cm" 
                    className={`w-full text-sm font-black outline-none bg-transparent ${theme.text}`} 
                  />
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-xs font-black text-red-500 ml-2">{error}</p>}
          {success && <p className="text-xs font-black text-green-600 ml-2">✓ ¡Ficha del bebé guardada con éxito!</p>}

          {!isMobile && (
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2 ${saving ? 'opacity-50' : `${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} hover:scale-[1.02] active:scale-95`} text-white`}
            >
              {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Guardar Cambios</>}
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
