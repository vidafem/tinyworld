"use client";

import { motion } from "framer-motion";
import { Baby, Plus, Eye, Settings, LogOut, Loader2, X, User, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { themePalettes } from "@/lib/themes";
import BabyAvatar from "./Child/BabyAvatar";

interface DesktopProfileSelectorProps {
  onOpenProfile: () => void;
}

export default function DesktopProfileSelector({ onOpenProfile }: DesktopProfileSelectorProps) {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Formulario para nuevo bebé
  const [newName, setNewName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newTheme, setNewTheme] = useState("neutral");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  async function fetchChildren() {
    const { data: { session } } = await supabase.auth.getSession();

    // Traer todos los bebés de la base de datos
    const { data, error } = await supabase
      .from("children")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching children:", error);
    } else {
      const list = data || [];
      if (session?.user?.id) {
        const unlinked = list.filter(c => !c.parent_id);
        if (unlinked.length > 0) {
          for (const c of unlinked) {
            await supabase.from("children").update({ parent_id: session.user.id }).eq("id", c.id);
          }
        }
      }
      setChildren(list);
    }
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setCreating(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("children").insert([{
      parent_id: session.user.id,
      name: newName,
      birth_date: newBirthDate || null,
      theme_color: newTheme
    }]);

    setCreating(false);
    if (!error) {
      setShowModal(false);
      setNewName("");
      setNewBirthDate("");
      setNewTheme("neutral");
      fetchChildren();
    } else {
      alert("Error al crear perfil");
      console.error(error);
    }
  };

  const handleSelect = (id: string) => {
    router.push(`/dashboard/child/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-sage" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-texture p-12 flex flex-col items-center justify-center relative overflow-hidden">
      
      <div className="absolute top-10 right-10 flex gap-4">
        <button onClick={onOpenProfile} className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-full shadow-sm text-taupe/80 hover:text-gold hover:shadow-md transition-all font-outfit text-sm font-bold uppercase tracking-widest border border-taupe/5">
          <User size={18} /> Mi Perfil
        </button>
        <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-2.5 bg-red-50/50 rounded-full text-red-600/80 hover:bg-red-50 hover:text-red-600 transition-all font-outfit text-sm font-bold uppercase tracking-widest border border-red-100">
          <LogOut size={18} /> Salir
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-6xl font-outfit font-black text-taupe mb-4 tracking-tighter">¿Quién nos inspira hoy?</h1>
        <p className="text-xl text-taupe/80 font-medium italic">Selecciona un pequeño o gestiona tu estudio creativo.</p>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-12 max-w-6xl">
        {/* MI PERFIL (BOTÓN ESPECIAL) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onOpenProfile}
          className="group relative cursor-pointer flex flex-col items-center"
        >
          <div className="w-40 h-40 bg-gradient-to-br from-gold/40 to-taupe/10 rounded-full border-4 border-white shadow-xl group-hover:shadow-2xl group-hover:border-gold/20 transition-all duration-500 flex items-center justify-center mb-6 group-hover:-translate-y-4">
            <User size={64} className="text-taupe" />
            <div className="absolute -bottom-2 bg-white px-4 py-1 rounded-full shadow-sm border border-gold/20 flex items-center gap-2">
              <Palette size={14} className="text-gold" />
              <span className="text-[10px] font-black uppercase text-gold">Estudio</span>
            </div>
          </div>
          <h3 className="text-2xl font-outfit font-black text-taupe mb-1 group-hover:text-gold transition-colors">Mi Perfil</h3>
          <p className="text-[10px] text-taupe/40 font-black uppercase tracking-widest">Mis Stickers & Fondos</p>
        </motion.div>

        {children.map((child, index) => {
          const theme = themePalettes[child.theme_color] || themePalettes.neutral;
          return (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (index + 1) * 0.1 }}
              onClick={() => handleSelect(child.id)}
              className="group relative cursor-pointer flex flex-col items-center"
            >
              <div className="w-40 h-40 mb-6 group-hover:-translate-y-4 transition-all duration-500">
                <BabyAvatar
                  gender={child.gender}
                  coverImage={child.cover_image || child.photo_url}
                  name={child.name}
                  size="xl"
                  className={`${theme.bg} border-4 border-white shadow-xl group-hover:shadow-2xl w-full h-full`}
                  iconClassName={theme.text}
                />
              </div>
              <h3 className="text-2xl font-outfit font-bold text-taupe mb-1 group-hover:text-gold transition-colors">{child.name}</h3>
              {child.birth_date && (
                <p className="text-[10px] text-taupe/40 font-black uppercase tracking-widest">{new Date(child.birth_date).toLocaleDateString()}</p>
              )}
            </motion.div>
          );
        })}

        {/* Botón de Añadir Nuevo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: (children.length + 1) * 0.1 }}
          onClick={() => setShowModal(true)}
          className="group cursor-pointer flex flex-col items-center"
        >
          <div className="w-40 h-40 rounded-full border-4 border-dashed border-taupe/20 flex flex-col items-center justify-center mb-6 hover:border-gold/40 hover:bg-gold/5 transition-all shadow-sm group-hover:-translate-y-4 duration-500">
            <Plus size={40} className="text-taupe/30 group-hover:text-gold group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xl font-outfit font-black text-taupe/40 group-hover:text-gold transition-colors">Añadir Bebé</h3>
        </motion.div>
      </div>

      <p className="absolute bottom-10 text-[10px] text-taupe/80 uppercase tracking-[0.5em] font-black">TinyWorld™ Creative Studio</p>

      {/* Modal Crear Perfil */}
      {showModal && (
        <div className="fixed inset-0 bg-taupe/20 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-taupe/40 hover:text-taupe transition-colors"><X size={24} /></button>
            <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-6"><Baby size={32} /></div>
            <h3 className="text-3xl font-outfit font-bold text-taupe mb-2">Nuevo Perfil</h3>
            <p className="text-sm text-taupe/60 mb-8">Crea un espacio mágico y privado para tu pequeño.</p>
            <form onSubmit={handleCreateChild} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-taupe/60 uppercase tracking-wider mb-2">Nombre</label>
                <input required type="text" placeholder="Ej. Mateo" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-4 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-gold/30 text-taupe font-outfit text-lg" />
              </div>
              <div>
                <label className="block text-xs font-bold text-taupe/60 uppercase tracking-wider mb-2">Fecha de Nacimiento</label>
                <input type="date" value={newBirthDate} onChange={e => setNewBirthDate(e.target.value)} className="w-full p-4 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-gold/30 text-taupe font-outfit" />
              </div>
              <div>
                <label className="block text-xs font-bold text-taupe/60 uppercase tracking-wider mb-3">Color del Tema</label>
                <div className="flex justify-between gap-2">
                  {Object.entries(themePalettes).map(([key, theme]: [string, any]) => (
                    <button key={key} type="button" onClick={() => setNewTheme(key)} className={`w-12 h-12 rounded-full ${theme.bg} border-2 transition-all flex items-center justify-center ${newTheme === key ? 'border-taupe scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}><Baby size={20} className={theme.text} /></button>
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <button disabled={creating} type="submit" className="w-full p-4 bg-taupe text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2">{creating ? <Loader2 size={20} className="animate-spin" /> : <><Plus size={20} /> Crear Perfil</>}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
