"use client";

import { motion } from "framer-motion";
import { Baby, Plus, LogOut, ChevronRight, Loader2, X, User, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { themePalettes } from "@/lib/themes";
import BabyAvatar from "./Child/BabyAvatar";

interface MobileProfileSelectorProps {
  onOpenProfile: () => void;
}

export default function MobileProfileSelector({ onOpenProfile }: MobileProfileSelectorProps) {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newTheme, setNewTheme] = useState("neutral");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  async function fetchChildren() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("children")
      .select("*")
      .or(`parent_id.eq.${session.user.id},parent_id.is.null`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching children:", error);
    } else {
      const list = data || [];
      const unlinked = list.filter(c => !c.parent_id);
      if (unlinked.length > 0) {
        for (const c of unlinked) {
          await supabase.from("children").update({ parent_id: session.user.id }).eq("id", c.id);
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
    <div className="min-h-screen bg-background bg-texture px-6 py-10 flex flex-col relative overflow-hidden pb-24">
      
      <header className="flex justify-between items-center mb-10">
        <button onClick={onOpenProfile} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-taupe/5 active:scale-90 transition-transform">
          <User size={22} className="text-taupe/40" />
        </button>
        <div className="flex items-center gap-2">
           <img src="/logo.png" className="w-8 h-8 opacity-20" />
           <span className="font-outfit font-black text-taupe/20 tracking-widest uppercase text-[10px]">TinyWorld</span>
        </div>
        <button onClick={handleLogout} className="w-12 h-12 bg-red-50 rounded-2xl text-red-400 flex items-center justify-center active:scale-90 transition-transform">
          <LogOut size={20} />
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-outfit font-black text-taupe leading-tight mb-2 tracking-tighter italic">¿Quién nos <br/> inspira hoy?</h1>
        <p className="text-xs text-taupe/40 font-black uppercase tracking-widest">Selecciona un perfil para continuar</p>
      </motion.div>

      <div className="space-y-3 flex-1">
        {children.map((child, index) => {
          const theme = themePalettes[child.theme_color] || themePalettes.neutral;
          return (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 1) * 0.1 }}
              onClick={() => handleSelect(child.id)}
              className={`
                w-full p-3.5 bg-white/60 backdrop-blur-md 
                rounded-[2.5rem] border-2 border-white shadow-sm 
                flex items-center gap-4 active:scale-[0.98] active:shadow-inner
                transition-all cursor-pointer group
              `}
            >
              <div className="w-14 h-14 shrink-0">
                <BabyAvatar
                  gender={child.gender}
                  coverImage={child.cover_image || child.photo_url}
                  name={child.name}
                  size="sm"
                  className={`${theme.bg} border-4 border-white shadow-inner w-full h-full`}
                  iconClassName={theme.text}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-taupe tracking-tighter truncate">{child.name}</h3>
                {child.birth_date ? (
                  <p className="text-[9px] text-taupe/30 uppercase tracking-[0.2em] font-black italic">Desde {new Date(child.birth_date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                ) : (
                  <p className="text-[9px] text-taupe/30 uppercase tracking-[0.2em] font-black italic">Etapa de Gestación</p>
                )}
              </div>
              <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center text-taupe/20 group-hover:text-gold transition-colors">
                <ChevronRight size={18} />
              </div>
            </motion.div>
          );
        })}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: (children.length + 1) * 0.1 }}
          onClick={() => setShowModal(true)}
          className="w-full p-5 bg-taupe/5 border-2 border-dashed border-taupe/10 rounded-[2.5rem] flex items-center justify-center gap-3 text-taupe/30 font-black uppercase tracking-[0.3em] text-[10px] active:bg-taupe/10 transition-all mt-4"
        >
          <Plus size={18} />
          Nuevo Bebé
        </motion.button>
      </div>

      <footer className="mt-12 text-center opacity-20">
        <p className="text-[10px] text-taupe uppercase tracking-[0.5em] font-black">Studio Collective</p>
      </footer>

      {/* Modal Crear Perfil: También con estilo Cápsula */}
      {showModal && (
        <div className="fixed inset-0 bg-taupe/40 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl relative border-4 border-white">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-taupe/20 hover:text-red-500 transition-colors"><X size={24} /></button>
            <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-6 shadow-inner"><Baby size={32} /></div>
            <h3 className="text-2xl font-black text-taupe mb-2 tracking-tighter italic">Nuevo Perfil</h3>
            <p className="text-xs text-taupe/40 mb-6 font-black uppercase tracking-widest">Comienza una nueva historia</p>
            <form onSubmit={handleCreateChild} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-taupe/30 uppercase tracking-widest mb-2 ml-1">Nombre</label>
                <input required type="text" placeholder="Ej. Mateo" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-4 bg-taupe/5 rounded-2xl outline-none focus:border-gold/20 border-2 border-transparent transition-all text-taupe font-black text-lg placeholder:text-taupe/10" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-taupe/30 uppercase tracking-widest mb-3 ml-1">Color del Tema</label>
                <div className="flex justify-between gap-2">
                  {Object.entries(themePalettes).map(([key, theme]: [string, any]) => (
                    <button key={key} type="button" onClick={() => setNewTheme(key)} className={`w-9 h-9 rounded-full ${theme.bg} border-4 transition-all flex items-center justify-center shadow-sm ${newTheme === key ? 'border-taupe scale-110' : 'border-white'}`}><Baby size={16} className={theme.text} /></button>
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <button disabled={creating} type="submit" className="w-full p-4 bg-taupe text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest">{creating ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Crear Perfil</>}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
