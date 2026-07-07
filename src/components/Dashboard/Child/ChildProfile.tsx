"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Loader2, ChevronLeft, CheckCircle2, Baby, 
  QrCode, Copy, Share2, Eye, X, BookOpen, Heart, CalendarDays, Images, Sparkles,
  Trash2
} from "lucide-react";
import { themePalettes } from "@/lib/themes";
import BabyAvatar from "./BabyAvatar";

export default function ChildProfile({ childId }: { childId: string }) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

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
      setToastMessage("Foto de perfil actualizada con éxito");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err: any) {
      console.error(err);
      alert(`Error al cambiar la foto de perfil: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChild = async () => {
    if (confirmName.trim() !== (formData.name || child.name).trim()) {
      alert("El nombre no coincide. Escribe el nombre exacto del bebé.");
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

      setToastMessage("Bebé eliminado correctamente");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Error al eliminar bebé: ${err.message}`);
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
      setToastMessage("Perfil guardado con éxito");
      setChild({ ...child, ...formData });
      setTimeout(() => setToastMessage(""), 3000);
    } else {
      setToastMessage("Error al guardar");
      console.error(error);
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  if (loading || !child) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-sage" size={40} />
      </div>
    );
  }

  const theme = themePalettes[formData.theme_color] || themePalettes.neutral;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/preview/code/${formData.access_code}` : "";

  const copyShareLink = () => {
    if (!formData.access_code) {
      setToastMessage("¡Primero genera un código!");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }
    navigator.clipboard.writeText(shareUrl);
    setToastMessage("¡Enlace de compartición copiado!");
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture transition-colors duration-500 pb-20 flex flex-col items-center`}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-0 z-[110] bg-white ${theme.text} px-6 py-3 rounded-full shadow-lg font-outfit font-bold flex items-center gap-2 border ${theme.borderAccent}`}
          >
            <CheckCircle2 size={18} style={{ color: theme.hex }} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal QR Code */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQRModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative border ${theme.borderAccent} text-center z-10`}
            >
              <button 
                onClick={() => setShowQRModal(false)}
                className={`absolute top-6 right-6 p-2 hover:${theme.bgLight} rounded-full ${theme.text} transition-colors`}
              >
                <X size={20} />
              </button>

              <div className="mb-6 mt-2">
                <div className={`w-14 h-14 rounded-full ${theme.bg} mx-auto flex items-center justify-center shadow-inner`}>
                  <QrCode size={26} className={theme.text} />
                </div>
              </div>

              <h3 className={`font-outfit font-black text-2xl ${theme.text} mb-1`}>
                Código QR de {formData.name || child.name}
              </h3>
              <p className={`text-xs ${theme.text} opacity-50 uppercase tracking-widest font-bold mb-6`}>
                Escanea para ver la Preview
              </p>

              <div className={`bg-white border-2 border-dashed ${theme.borderAccent} rounded-3xl p-4 inline-block mb-6 shadow-inner`}>
                {formData.access_code ? (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto rounded-xl object-contain"
                  />
                ) : (
                  <div className={`w-48 h-48 flex items-center justify-center ${theme.text} opacity-40 text-sm font-bold`}>
                    Genera un código primero
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={copyShareLink}
                  className={`flex-1 py-4 ${theme.primaryBg} ${theme.textActive} rounded-2xl font-bold hover:${theme.hoverBg} transition-all text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2`}
                >
                  <Copy size={16} /> Copiar Enlace
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="w-full px-6 py-4 flex items-center gap-4">
        <button 
          onClick={() => router.push(`/dashboard/child/${childId}`)}
          className={`w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm ${theme.text} hover:scale-105 active:scale-95 transition-transform shrink-0`}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col">
          <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${theme.text} opacity-40`}>Perfil de</span>
          <span className={`font-outfit font-black text-lg leading-none ${theme.text}`}>{formData.name || child.name}</span>
        </div>
      </header>

      <main className="w-full max-w-6xl px-4 mt-2 mb-4 space-y-6">
        {/* Formulario Principal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-5 md:p-8 shadow-xl relative"
        >
          <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            
            {/* Columna Izquierda: Foto Avatar */}
            <div className="flex flex-col items-center md:w-1/4 md:mt-2 shrink-0">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer active:scale-95 transition-transform group relative overflow-visible"
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
                <div className="absolute inset-0 bg-black/5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                   <span className="text-white text-xs font-bold drop-shadow-md">CAMBIAR</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <p className={`text-[10px] uppercase tracking-widest font-bold mt-4 ${theme.text} opacity-40`}>Cambiar Foto</p>
            </div>

            {/* Columna Derecha: Formulario (Grid) */}
            <div className="w-full md:w-3/4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 md:gap-x-5 md:gap-y-4 items-end">
              
              <div className="col-span-2 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Nombre Real</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Apodo Cariñoso</label>
                <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} placeholder="ej. Frijolito" className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} />
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
                  className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm appearance-none ${theme.text}`}
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
                  className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} 
                />
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Género</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm appearance-none ${theme.text}`}>
                  <option value="">Seleccionar...</option>
                  <option value="boy">Niño</option>
                  <option value="girl">Niña</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Fecha Nacimiento</label>
                <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Hora Nacimiento</label>
                <input type="time" name="birth_time" value={formData.birth_time} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Peso</label>
                <input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="3.5 kg" className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Medida</label>
                <input type="text" name="height" value={formData.height} onChange={handleChange} placeholder="50 cm" className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Hospital Nacimiento</label>
                <input type="text" name="birth_hospital" value={formData.birth_hospital} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-2 md:col-span-2">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Nombre del Padre</label>
                <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              <div className="col-span-2 md:col-span-2">
                <label className={`block text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text} opacity-60`}>Nombre de la Madre</label>
                <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} />
              </div>

              {/* Selector de Tema y Botón */}
              <div className="col-span-2 md:col-span-4 mt-2 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-gray-100 pt-4">
                <div className="flex flex-col items-center md:items-start w-full md:w-auto">
                  <label className={`block text-[9px] font-bold uppercase tracking-wider mb-2 ${theme.text} opacity-60`}>Color del Tema</label>
                  <div className="flex justify-center md:justify-start gap-2">
                    {Object.entries(themePalettes).map(([key, pal]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, theme_color: key }))}
                        className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-[3px] transition-transform ${formData.theme_color === key ? 'border-white ring-2 ring-black/25 scale-110' : 'border-transparent hover:scale-110'} ${pal.bg}`}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  disabled={saving}
                  type="submit" 
                  className={`w-full md:w-64 py-3 rounded-full font-bold ${theme.textActive} ${theme.primaryBg} hover:${theme.hoverBg} shadow-md active:scale-95 transition-all flex items-center justify-center text-sm`}
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : "Guardar Perfil"}
                </button>
              </div>

            </div>
          </form>
        </motion.div>

        {/* Nueva Sección: Compartir y Acceso Invitado */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-xl border ${theme.borderAccent}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
              <Share2 size={24} />
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
                <p className={`text-xs ${theme.text} opacity-60 mb-4 leading-relaxed`}>Con este código único, tus familiares podrán acceder directamente ingresándolo en la página principal.</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={formData.access_code} 
                  placeholder="Sin código generado"
                  className={`flex-1 px-4 py-3 bg-white border ${theme.borderAccent} rounded-xl outline-none font-outfit text-sm font-black text-center tracking-[0.2em] ${theme.text}`} 
                />
                <button 
                  type="button"
                  onClick={generateAccessCode}
                  className={`px-4 py-3 bg-white ${theme.text} border ${theme.borderAccent} hover:border-current rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0`}
                >
                  Generar
                </button>
              </div>
            </div>

            {/* URL Compartible */}
            <div className={`${theme.bgLight} rounded-3xl p-5 flex flex-col justify-between`}>
              <div>
                <h4 className={`font-outfit font-black text-sm ${theme.text} uppercase tracking-wider mb-2`}>Enlace de Compartición</h4>
                <p className={`text-xs ${theme.text} opacity-60 mb-4 leading-relaxed`}>Comparte este enlace directamente por WhatsApp o redes para dar acceso directo a la Preview.</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={formData.access_code ? shareUrl : "Genera un código primero"} 
                  className={`flex-1 px-4 py-3 bg-white border ${theme.borderAccent} rounded-xl outline-none font-outfit text-xs ${theme.text} opacity-70 truncate`} 
                />
                <button 
                  type="button"
                  onClick={copyShareLink}
                  className={`p-3.5 bg-white ${theme.text} border ${theme.borderAccent} hover:border-current rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0`}
                  title="Copiar Enlace"
                >
                  <Copy size={16} />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (!formData.access_code) {
                      setToastMessage("¡Primero genera un código!");
                      setTimeout(() => setToastMessage(""), 3000);
                      return;
                    }
                    setShowQRModal(true);
                  }}
                  className={`p-3.5 bg-white ${theme.text} border ${theme.borderAccent} hover:border-current rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0`}
                  title="Ver Código QR"
                >
                  <QrCode size={16} />
                </button>
              </div>
            </div>

            {/* Permisos de Secciones */}
            <div className={`${theme.bgLight} rounded-3xl p-5`}>
              <h4 className={`font-outfit font-black text-sm ${theme.text} uppercase tracking-wider mb-3`}>Secciones Visibles</h4>
              <p className={`text-xs ${theme.text} opacity-60 mb-4 leading-relaxed`}>Selecciona qué pestañas del diario podrán ver tus invitados.</p>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-2.5 bg-white rounded-xl border ${theme.borderAccent}`}>
                  <div className={`flex items-center gap-2 ${theme.text}`}>
                    <Heart size={16} style={{ color: theme.hex }} />
                    <span className="text-xs font-bold uppercase tracking-wider">Embarazo</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTogglePermission("show_pregnancy")}
                    style={{ backgroundColor: formData.preview_config?.show_pregnancy ? theme.hex : '#E5E7EB' }}
                    className="w-10 h-6 rounded-full p-1 transition-colors duration-300"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_pregnancy ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className={`flex items-center justify-between p-2.5 bg-white rounded-xl border ${theme.borderAccent}`}>
                  <div className={`flex items-center gap-2 ${theme.text}`}>
                    <Images size={16} style={{ color: theme.hex }} />
                    <span className="text-xs font-bold uppercase tracking-wider">Galería</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTogglePermission("show_gallery")}
                    style={{ backgroundColor: formData.preview_config?.show_gallery ? theme.hex : '#E5E7EB' }}
                    className="w-10 h-6 rounded-full p-1 transition-colors duration-300"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_gallery ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className={`flex items-center justify-between p-2.5 bg-white rounded-xl border ${theme.borderAccent}`}>
                  <div className={`flex items-center gap-2 ${theme.text}`}>
                    <CalendarDays size={16} style={{ color: theme.hex }} />
                    <span className="text-xs font-bold uppercase tracking-wider">Calendarios</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTogglePermission("show_calendars")}
                    style={{ backgroundColor: formData.preview_config?.show_calendars ? theme.hex : '#E5E7EB' }}
                    className="w-10 h-6 rounded-full p-1 transition-colors duration-300"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_calendars ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className={`flex items-center justify-between p-2.5 bg-white rounded-xl border ${theme.borderAccent}`}>
                  <div className={`flex items-center gap-2 ${theme.text}`}>
                    <BookOpen size={16} style={{ color: theme.hex }} />
                    <span className="text-xs font-bold uppercase tracking-wider">Libro / Álbum</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTogglePermission("show_album")}
                    style={{ backgroundColor: formData.preview_config?.show_album ? theme.hex : '#E5E7EB' }}
                    className="w-10 h-6 rounded-full p-1 transition-colors duration-300"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_album ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div className={`mt-6 flex justify-end border-t ${theme.borderAccent} pt-4`}>
            <button 
              onClick={handleSave}
              disabled={saving}
              className={`w-full md:w-72 py-4 ${theme.primaryBg} ${theme.textActive} rounded-full font-bold shadow-md hover:${theme.hoverBg} active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2`}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Guardar Compartibilidad"}
            </button>
          </div>
        </motion.div>

        {/* Zona de Peligro */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50/50 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-xl border border-red-100 mt-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-red-100 text-red-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-outfit font-black text-xl text-red-900">Zona de Peligro</h3>
              <p className="text-xs text-red-700/60 font-bold uppercase tracking-wider mt-0.5">Acciones irreversibles de la cuenta</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h4 className="font-outfit font-black text-sm text-red-950 uppercase tracking-wider mb-1">Eliminar Perfil de Bebé</h4>
              <p className="text-xs text-red-700 leading-relaxed">
                Al eliminar este perfil, se borrará **permanentemente todo su historial, recuerdos, calendarios, álbumes digitales y archivos multimedia** tanto de la base de datos como de nuestro almacenamiento físico. Esta acción no se puede deshacer.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-md active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shrink-0"
            >
              <Trash2 size={16} /> Eliminar Bebé
            </button>
          </div>
        </motion.div>
      </main>

      {/* Modal Confirmación de Eliminación */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative border border-red-100 text-center z-10"
            >
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6 mt-2">
                <div className="w-14 h-14 rounded-full bg-red-100 mx-auto flex items-center justify-center shadow-inner">
                  <Trash2 size={26} className="text-red-600" />
                </div>
              </div>

              <h3 className="font-outfit font-black text-2xl text-red-900 mb-2">
                ¿Estás absolutamente seguro?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                Esta acción es irreversible. Se borrarán permanentemente todos los datos y archivos del bebé.
                Para confirmar, escribe el nombre del bebé a continuación: <strong className="text-red-700">{formData.name || child.name}</strong>
              </p>

              <input 
                type="text" 
                value={confirmName} 
                onChange={(e) => setConfirmName(e.target.value)} 
                placeholder="Escribe el nombre del bebé..."
                className="w-full px-4 py-3 bg-red-50/50 border border-red-100 rounded-xl outline-none text-center font-outfit text-sm font-bold text-red-900 placeholder-red-300 mb-6"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteChild}
                  disabled={deleting || confirmName.trim() !== (formData.name || child.name).trim()}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-2xl font-bold transition-all text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : "Sí, Eliminar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
