"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Baby, 
  QrCode, Copy, Share2, Eye, BookOpen, Heart, CalendarDays, Images, Sparkles,
  Trash2, Save, Sparkle
} from "lucide-react";
import { themePalettes } from "@/lib/themes";
import BabyAvatar from "./BabyAvatar";
import AppButton from "@/components/Common/AppButton";
import ModernModal from "@/components/Common/ModernModal";
import FloatingToast, { ToastData } from "@/components/Common/FloatingToast";

export default function ChildProfile({ childId }: { childId: string }) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión no activa.");

      const formDataObj = new FormData();
      formDataObj.append("childId", childId);
      formDataObj.append("module", "profile");
      formDataObj.append("section", "avatar");
      formDataObj.append("mediaType", "image");
      formDataObj.append("files", file);

      const response = await fetch("/api/media", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formDataObj,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al subir la imagen");
      }

      const payload = await response.json();
      const url = payload.uploaded?.[0]?.url;

      if (!url) throw new Error("No se obtuvo la URL de la imagen subida.");

      // Actualizar cover_image en la base de datos
      const { error } = await supabase
        .from("children")
        .update({ cover_image: url })
        .eq("id", childId);

      if (error) throw error;

      setChild((prev: any) => ({ ...prev, cover_image: url, photo_url: url }));
      setToast({ type: "success", message: "¡Foto de perfil actualizada con éxito!" });
    } catch (err: any) {
      console.error(err);
      setToast({ type: "error", message: `Error al subir imagen: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChild = async () => {
    if (confirmName.trim() !== (formData.name || child.name).trim()) {
      setToast({ type: "warning", message: "El nombre no coincide. Escribe el nombre exacto." });
      return;
    }

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión no activa.");

      const response = await fetch(`/api/children/${childId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Error al eliminar.");
      }

      setToast({ type: "success", message: "Bebé eliminado correctamente" });
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setToast({ type: "error", message: `Error al eliminar bebé: ${err.message}` });
      setDeleting(false);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    birth_date: "",
    birth_time: "",
    weight: "",
    height: "",
    gender: "",
    father_name: "",
    mother_name: "",
    birth_hospital: "",
    theme_color: "neutral",
    access_code: "",
    preview_config: {
      show_pregnancy: true,
      show_gallery: true,
      show_calendars: true,
      show_album: true,
      status: "pregnancy",
      fum: ""
    }
  });

  useEffect(() => {
    async function fetchChild() {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("id", childId)
        .single();

      if (error) {
        console.error("Error fetching child:", error);
        router.push("/dashboard"); 
      } else {
        setChild(data);
        setFormData({
          name: data.name || "",
          nickname: data.nickname || "",
          birth_date: data.birth_date || "",
          birth_time: data.birth_time || "",
          weight: data.weight || "",
          height: data.height || "",
          gender: data.gender || "",
          father_name: data.father_name || "",
          mother_name: data.mother_name || "",
          birth_hospital: data.birth_hospital || "",
          theme_color: data.theme_color || "neutral",
          access_code: data.access_code || "",
          preview_config: {
            show_pregnancy: true,
            show_gallery: true,
            show_calendars: true,
            show_album: true,
            status: "pregnancy",
            fum: "",
            ...(data.preview_config || {})
          }
        });
      }
      setLoading(false);
    }

    fetchChild();
  }, [childId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTogglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      preview_config: {
        ...prev.preview_config,
        [key]: !((prev.preview_config as any)[key])
      }
    }));
  };

  const generateAccessCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "TW-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, access_code: code }));
    setToast({ type: "info", message: `Código generado: ${code}` });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Evitar error 400 con date/time vacío
    const dataToSave = { ...formData };
    if (!dataToSave.birth_date) dataToSave.birth_date = null as any;
    if (!dataToSave.birth_time) dataToSave.birth_time = null as any;

    const { error } = await supabase
      .from("children")
      .update(dataToSave)
      .eq("id", childId);
      
    setSaving(false);
    if (!error) {
      setToast({ type: "success", message: "¡Perfil guardado con éxito!" });
      setChild({ ...child, ...formData });
    } else {
      setToast({ type: "error", message: "Error al guardar el perfil" });
      console.error(error);
    }
  };

  if (loading || !child) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="p-4 rounded-3xl bg-white shadow-xl flex items-center gap-3 text-taupe font-bold"
        >
          <Baby size={28} className="text-gold animate-bounce" />
          <span>Cargando perfil...</span>
        </motion.div>
      </div>
    );
  }

  const theme = themePalettes[formData.theme_color] || themePalettes.neutral;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/preview/code/${formData.access_code}` : "";

  const copyShareLink = () => {
    if (!formData.access_code) {
      setToast({ type: "warning", message: "¡Primero genera un código de acceso!" });
      return;
    }
    navigator.clipboard.writeText(shareUrl);
    setToast({ type: "success", message: "¡Enlace de compartición copiado al portapapeles!" });
  };

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture transition-colors duration-500 pb-20 flex flex-col items-center`}>
      <FloatingToast toast={toast} onClose={() => setToast(null)} theme={theme} />

      {/* Header Superior */}
      <header className="w-full px-6 py-4 flex items-center justify-between sticky top-0 z-40 bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl border-b border-white/50 dark:border-white/10">
        <div className="flex items-center gap-3.5">
          <AppButton
            variant="secondary"
            size="icon"
            onClick={() => router.push(`/dashboard/child/${childId}`)}
            icon={<ChevronLeft size={18} className={theme.text} />}
            className="shadow-sm"
          />
          <div className="flex flex-col">
            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${theme.text} opacity-50`}>
              Ajustes de Perfil
            </span>
            <span className={`font-outfit font-black text-lg leading-tight ${theme.text}`}>
              {formData.name || child.name}
            </span>
          </div>
        </div>

        <AppButton
          variant="primary"
          size="sm"
          theme={theme}
          onClick={handleSave}
          loading={saving}
          glare
          icon={<Save size={15} />}
          className="shadow-sm"
        >
          Guardar
        </AppButton>
      </header>

      <main className="w-full max-w-6xl px-4 mt-6 mb-4 space-y-6">
        {/* Formulario Principal */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className={`bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 shadow-xl border ${theme.borderAccent} relative`}
        >
          <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            
            {/* Columna Izquierda: Foto Avatar */}
            <div className="flex flex-col items-center md:w-1/4 md:mt-2 shrink-0">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer group relative overflow-visible"
              >
                <BabyAvatar
                  gender={formData.gender || child.gender}
                  coverImage={child.cover_image}
                  name={formData.name || child.name}
                  size="lg"
                  className={theme.bg}
                  iconClassName={theme.text}
                  style={{ borderColor: theme.hex }}
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-xs">
                   <span className="text-white text-[10px] font-black tracking-widest drop-shadow-md">CAMBIAR</span>
                </div>
              </motion.div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <AppButton
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-[10px] uppercase tracking-widest font-black"
                theme={theme}
              >
                Cambiar Foto
              </AppButton>
            </div>

            {/* Columna Derecha: Formulario (Grid) */}
            <div className="w-full md:w-3/4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 md:gap-x-5 md:gap-y-4 items-end">
              
              <div className="col-span-2 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Nombre Real</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Apodo Cariñoso</label>
                <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} placeholder="ej. Frijolito" className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Estado del Bebé</label>
                <select 
                  name="status" 
                  value={formData.preview_config?.status || "pregnancy"} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      preview_config: {
                        ...prev.preview_config,
                        status: val
                      }
                    }));
                  }} 
                  className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm appearance-none ${theme.text}`}
                >
                  <option value="pregnancy">En Gestación (Embarazo)</option>
                  <option value="born">Ya Nacido</option>
                </select>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>FUM (Última Regla)</label>
                <input 
                  type="date" 
                  name="fum" 
                  value={formData.preview_config?.fum || ""} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      preview_config: {
                        ...prev.preview_config,
                        fum: val
                      }
                    }));
                  }} 
                  className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm ${theme.text}`} 
                />
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Género</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm appearance-none ${theme.text}`}>
                  <option value="">Seleccionar...</option>
                  <option value="boy">Niño</option>
                  <option value="girl">Niña</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Fecha Nacimiento</label>
                <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Hora Nacimiento</label>
                <input type="time" name="birth_time" value={formData.birth_time} onChange={handleChange} className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Peso</label>
                <input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="3.5 kg" className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Medida</label>
                <input type="text" name="height" value={formData.height} onChange={handleChange} placeholder="50 cm" className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Hospital Nacimiento</label>
                <input type="text" name="birth_hospital" value={formData.birth_hospital} onChange={handleChange} className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-2 md:col-span-2">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Nombre del Padre</label>
                <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-2 md:col-span-2">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Nombre de la Madre</label>
                <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              {/* Selector de Tema y Botón */}
              <div className="col-span-2 md:col-span-4 mt-2 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-stone-100 dark:border-stone-800 pt-4">
                <div className="flex flex-col items-center md:items-start w-full md:w-auto">
                  <label className={`block text-[9px] font-bold uppercase tracking-wider mb-2 ${theme.text} opacity-60`}>Color del Tema</label>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 max-w-full md:max-w-xl">
                    {Object.entries(themePalettes).map(([key, pal]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, theme_color: key }))}
                        className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-[3px] transition-transform ${
                          formData.theme_color === key 
                            ? 'border-stone-800 dark:border-white ring-2 ring-gold/40 scale-110' 
                            : 'border-stone-200 dark:border-stone-700/60 opacity-80 hover:scale-105 shadow-sm'
                        } ${pal.bg}`}
                      />
                    ))}
                  </div>
                </div>

                <AppButton 
                  disabled={saving}
                  type="submit" 
                  variant="primary"
                  size="md"
                  theme={theme}
                  loading={saving}
                  glare
                  className="w-full md:w-64 py-3.5"
                  icon={<Save size={16} />}
                >
                  Guardar Perfil
                </AppButton>
              </div>

            </div>
          </form>
        </motion.div>

        {/* Sección: Compartir y Acceso Invitado */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 350, damping: 25 }}
          className={`bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 shadow-xl border ${theme.borderAccent}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
              <Share2 size={22} />
            </div>
            <div>
              <h3 className={`font-outfit font-black text-xl ${theme.text}`}>Compartir y Acceso Invitado</h3>
              <p className={`text-xs ${theme.text} opacity-50 font-bold uppercase tracking-wider mt-0.5`}>Controla quién puede ver la historia de tu bebé sin registrarse</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Generación de Código */}
            <div className={`${theme.bgLight} rounded-3xl p-5 flex flex-col justify-between`}>
              <div>
                <h4 className={`font-outfit font-black text-sm ${theme.text} uppercase tracking-wider mb-2`}>Código de Acceso</h4>
                <p className={`text-xs ${theme.text} opacity-60 mb-4 leading-relaxed font-quicksand`}>Con este código único, tus familiares podrán acceder directamente ingresándolo en la página principal.</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={formData.access_code} 
                  placeholder="Sin código generado"
                  className={`flex-1 px-4 py-3 bg-white dark:bg-stone-800 border ${theme.borderAccent} rounded-2xl outline-none font-outfit text-sm font-black text-center tracking-[0.2em] ${theme.text}`} 
                />
                <AppButton 
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={generateAccessCode}
                  className="shrink-0"
                >
                  Generar
                </AppButton>
              </div>
            </div>

            {/* URL Compartible */}
            <div className={`${theme.bgLight} rounded-3xl p-5 flex flex-col justify-between`}>
              <div>
                <h4 className={`font-outfit font-black text-sm ${theme.text} uppercase tracking-wider mb-2`}>Enlace de Compartición</h4>
                <p className={`text-xs ${theme.text} opacity-60 mb-4 leading-relaxed font-quicksand`}>Comparte este enlace directamente por WhatsApp o redes para dar acceso directo a la Preview.</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={formData.access_code ? shareUrl : "Genera un código primero"} 
                  className={`flex-1 px-4 py-3 bg-white dark:bg-stone-800 border ${theme.borderAccent} rounded-2xl outline-none font-outfit text-xs ${theme.text} opacity-70 truncate`} 
                />
                <AppButton 
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={copyShareLink}
                  icon={<Copy size={16} />}
                  title="Copiar Enlace"
                />
                <AppButton 
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    if (!formData.access_code) {
                      setToast({ type: "warning", message: "¡Primero genera un código!" });
                      return;
                    }
                    setShowQRModal(true);
                  }}
                  icon={<QrCode size={16} />}
                  title="Ver Código QR"
                />
              </div>
            </div>

            {/* Permisos de Secciones */}
            <div className={`${theme.bgLight} rounded-3xl p-5`}>
              <h4 className={`font-outfit font-black text-sm ${theme.text} uppercase tracking-wider mb-2`}>Secciones Visibles</h4>
              <p className={`text-xs ${theme.text} opacity-60 mb-3 leading-relaxed font-quicksand`}>Selecciona qué pestañas del diario podrán ver tus invitados.</p>
              <div className="space-y-2.5">
                <div className={`flex items-center justify-between p-2.5 bg-white dark:bg-stone-800/80 rounded-2xl border ${theme.borderAccent}`}>
                  <div className={`flex items-center gap-2 ${theme.text}`}>
                    <Heart size={15} style={{ color: theme.hex }} />
                    <span className="text-xs font-bold uppercase tracking-wider">Embarazo</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTogglePermission("show_pregnancy")}
                    style={{ backgroundColor: formData.preview_config?.show_pregnancy ? theme.hex : '#E5E7EB' }}
                    className="w-10 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_pregnancy ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className={`flex items-center justify-between p-2.5 bg-white dark:bg-stone-800/80 rounded-2xl border ${theme.borderAccent}`}>
                  <div className={`flex items-center gap-2 ${theme.text}`}>
                    <Images size={15} style={{ color: theme.hex }} />
                    <span className="text-xs font-bold uppercase tracking-wider">Galería</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTogglePermission("show_gallery")}
                    style={{ backgroundColor: formData.preview_config?.show_gallery ? theme.hex : '#E5E7EB' }}
                    className="w-10 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_gallery ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className={`flex items-center justify-between p-2.5 bg-white dark:bg-stone-800/80 rounded-2xl border ${theme.borderAccent}`}>
                  <div className={`flex items-center gap-2 ${theme.text}`}>
                    <CalendarDays size={15} style={{ color: theme.hex }} />
                    <span className="text-xs font-bold uppercase tracking-wider">Calendarios</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTogglePermission("show_calendars")}
                    style={{ backgroundColor: formData.preview_config?.show_calendars ? theme.hex : '#E5E7EB' }}
                    className="w-10 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_calendars ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className={`flex items-center justify-between p-2.5 bg-white dark:bg-stone-800/80 rounded-2xl border ${theme.borderAccent}`}>
                  <div className={`flex items-center gap-2 ${theme.text}`}>
                    <BookOpen size={15} style={{ color: theme.hex }} />
                    <span className="text-xs font-bold uppercase tracking-wider">Libro / Álbum</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTogglePermission("show_album")}
                    style={{ backgroundColor: formData.preview_config?.show_album ? theme.hex : '#E5E7EB' }}
                    className="w-10 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_album ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div className={`mt-6 flex justify-end border-t ${theme.borderAccent} pt-4`}>
            <AppButton 
              onClick={handleSave}
              disabled={saving}
              variant="primary"
              size="md"
              theme={theme}
              loading={saving}
              glare
              className="w-full md:w-72 py-3.5 text-xs uppercase tracking-widest"
            >
              Guardar Compartibilidad
            </AppButton>
          </div>
        </motion.div>

        {/* Sección Especial: Configuración de Asistente IA (TinyAI) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 350, damping: 25 }}
          className={`bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 shadow-xl border ${theme.borderAccent}`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-sm">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className={`font-outfit font-black text-xl ${theme.text}`}>Asistente de IA (TinyAI)</h3>
                <p className={`text-xs ${theme.text} opacity-60 font-bold tracking-wide mt-0.5 font-quicksand`}>
                  Activa o desactiva la burbuja del chatbot para consultas 24/7 y cartas emotivas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-stone-100 dark:bg-stone-800 px-5 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 w-full md:w-auto justify-between md:justify-start">
              <span className={`text-xs font-black uppercase tracking-widest ${aiEnabled ? 'text-purple-700 dark:text-purple-300' : 'text-stone-400'}`}>
                {aiEnabled ? "IA Activada (ON)" : "IA Apagada (OFF)"}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !aiEnabled;
                  setAiEnabled(next);
                  localStorage.setItem("tinyworld_ai_disabled", next ? "false" : "true");
                  window.dispatchEvent(new CustomEvent("tinyworld_ai_toggle"));
                  setToast({ type: "info", message: next ? "¡Asistente de IA Activado!" : "Asistente de IA Desactivado" });
                }}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out cursor-pointer ${
                  aiEnabled ? "bg-purple-600" : "bg-stone-300 dark:bg-stone-700"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                    aiEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Zona de Peligro */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 350, damping: 25 }}
          className="bg-red-50/60 dark:bg-red-950/20 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-red-100 dark:border-red-900/40"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-outfit font-black text-xl text-red-900 dark:text-red-300">Zona de Peligro</h3>
              <p className="text-xs text-red-700/60 dark:text-red-400/60 font-bold uppercase tracking-wider mt-0.5">Acciones irreversibles de la cuenta</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h4 className="font-outfit font-black text-sm text-red-950 dark:text-red-200 uppercase tracking-wider mb-1">Eliminar Perfil de Bebé</h4>
              <p className="text-xs text-red-700 dark:text-red-300/80 leading-relaxed font-quicksand">
                Al eliminar este perfil, se borrará **permanentemente todo su historial, recuerdos, calendarios, álbumes digitales y archivos multimedia** tanto de la base de datos como de nuestro almacenamiento físico. Esta acción no se puede deshacer.
              </p>
            </div>
            <AppButton 
              type="button"
              variant="danger"
              size="md"
              onClick={() => setShowDeleteModal(true)}
              className="py-4 text-xs uppercase tracking-widest shrink-0"
              icon={<Trash2 size={16} />}
            >
              Eliminar Bebé
            </AppButton>
          </div>
        </motion.div>
      </main>

      {/* Modal QR Code */}
      <ModernModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={`Código QR de ${formData.name || child.name}`}
        subtitle="Escanea para ver la Preview"
        icon={<QrCode size={22} className={theme.text} />}
        theme={theme}
        maxWidth="sm"
      >
        <div className="text-center py-2">
          <div className={`bg-white border-2 border-dashed ${theme.borderAccent} rounded-3xl p-4 inline-block mb-5 shadow-inner`}>
            {formData.access_code ? (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                alt="QR Code"
                className="w-48 h-48 mx-auto rounded-2xl object-contain"
              />
            ) : (
              <div className={`w-48 h-48 flex items-center justify-center ${theme.text} opacity-40 text-sm font-bold`}>
                Genera un código primero
              </div>
            )}
          </div>

          <AppButton 
            onClick={copyShareLink}
            variant="primary"
            size="lg"
            theme={theme}
            glare
            className="w-full py-4 text-xs uppercase tracking-widest"
            icon={<Copy size={16} />}
          >
            Copiar Enlace de Invitado
          </AppButton>
        </div>
      </ModernModal>

      {/* Modal Confirmación de Eliminación */}
      <ModernModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="¿Estás absolutamente seguro?"
        subtitle="Esta acción es irreversible y permanente."
        icon={<Trash2 size={22} className="text-red-500" />}
        maxWidth="md"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-quicksand">
            Se borrarán permanentemente todos los datos, fotos, audios y calendarios del bebé.
            Para confirmar, escribe el nombre exacto del bebé a continuación: <strong className="text-red-600 font-bold">{formData.name || child.name}</strong>
          </p>

          <input 
            type="text" 
            value={confirmName} 
            onChange={(e) => setConfirmName(e.target.value)} 
            placeholder="Escribe el nombre del bebé..."
            className="w-full px-4 py-3.5 bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl outline-none text-center font-outfit text-sm font-bold text-red-900 dark:text-red-200 placeholder-red-300"
          />

          <div className="flex gap-3 pt-2">
            <AppButton 
              onClick={() => setShowDeleteModal(false)}
              variant="secondary"
              size="lg"
              className="flex-1 py-4 text-xs uppercase tracking-widest"
            >
              Cancelar
            </AppButton>
            <AppButton 
              onClick={handleDeleteChild}
              disabled={deleting || confirmName.trim() !== (formData.name || child.name).trim()}
              loading={deleting}
              variant="danger"
              size="lg"
              className="flex-1 py-4 text-xs uppercase tracking-widest shadow-md"
            >
              Sí, Eliminar
            </AppButton>
          </div>
        </div>
      </ModernModal>
    </div>
  );
}

