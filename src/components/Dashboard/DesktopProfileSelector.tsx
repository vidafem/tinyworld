"use client";

import { motion } from "framer-motion";
import { Baby, Plus, LogOut, User, Palette, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { themePalettes } from "@/lib/themes";
import BabyAvatar from "./Child/BabyAvatar";
import AppButton from "@/components/Common/AppButton";
import ModernModal from "@/components/Common/ModernModal";
import FloatingToast, { ToastData } from "@/components/Common/FloatingToast";
import CreateChildWizardModal from "./CreateChildWizardModal";

interface DesktopProfileSelectorProps {
  onOpenProfile: () => void;
}

export default function DesktopProfileSelector({ onOpenProfile }: DesktopProfileSelectorProps) {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);



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
      .eq("parent_id", session.user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching children:", error);
    } else {
      setChildren(data || []);
    }
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSelect = (id: string) => {
    router.push(`/dashboard/child/${id}`);
  };

  const selectedThemeObj = themePalettes.neutral;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="p-4 rounded-3xl bg-white shadow-xl flex items-center gap-3 text-taupe font-bold"
        >
          <Baby size={28} className="text-gold animate-bounce" />
          <span>Abriendo TinyWorld...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-texture p-12 flex flex-col items-center justify-center relative overflow-hidden">
      <FloatingToast toast={toast} onClose={() => setToast(null)} />

      {/* Barra superior de acciones */}
      <div className="absolute top-10 right-10 flex gap-3 z-20">
        <AppButton
          variant="secondary"
          size="sm"
          icon={<User size={16} className="text-taupe" />}
          onClick={onOpenProfile}
          className="shadow-sm"
        >
          Mi Perfil
        </AppButton>
        <AppButton
          variant="ghost"
          size="sm"
          icon={<LogOut size={16} className="text-red-500" />}
          onClick={handleLogout}
          className="text-red-600 hover:bg-red-50"
        >
          Salir
        </AppButton>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-sm text-[11px] font-black uppercase tracking-widest text-taupe/70 mb-4">
          <Sparkles size={13} className="text-gold" />
          <span>Elige un Diario</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-outfit font-black text-taupe mb-3 tracking-tight">
          ¿Quién nos inspira hoy?
        </h1>
        <p className="text-base md:text-lg text-taupe/75 font-medium italic font-quicksand">
          Selecciona a tu pequeño o gestiona tu espacio creativo.
        </p>
      </motion.div>

      {/* Grid de Bebés y Perfil */}
      <div className="flex flex-wrap justify-center gap-10 max-w-6xl z-10">
        {/* MI PERFIL (Estudio Creativo) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 20 } }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpenProfile}
          className="group relative cursor-pointer flex flex-col items-center"
        >
          <div className="w-36 h-36 bg-gradient-to-br from-gold/30 via-white to-taupe/10 rounded-full border-4 border-white shadow-xl group-hover:shadow-2xl group-hover:border-gold/30 transition-all duration-300 flex items-center justify-center mb-5 relative">
            <User size={56} className="text-taupe transition-transform group-hover:scale-105" />
            <div className="absolute -bottom-2.5 bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-full shadow-md border border-gold/30 flex items-center gap-1.5">
              <Palette size={12} className="text-gold" />
              <span className="text-[9px] font-black uppercase text-gold tracking-wider">Estudio</span>
            </div>
          </div>
          <h3 className="text-xl font-outfit font-black text-taupe mb-0.5 group-hover:text-gold transition-colors">
            Mi Perfil
          </h3>
          <p className="text-[10px] text-taupe/50 font-black uppercase tracking-widest">
            Mis Stickers & Fondos
          </p>
        </motion.div>

        {/* Lista de Niños */}
        {children.map((child, index) => {
          const theme = themePalettes[child.theme_color] || themePalettes.neutral;
          return (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (index + 1) * 0.08, type: "spring", stiffness: 350, damping: 22 }}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 20 } }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelect(child.id)}
              className="group relative cursor-pointer flex flex-col items-center"
            >
              <div className="w-36 h-36 mb-5 transition-transform duration-300">
                <BabyAvatar
                  gender={child.gender}
                  coverImage={child.cover_image || child.photo_url}
                  name={child.name}
                  size="xl"
                  className={`${theme.bg} border-4 border-white shadow-xl group-hover:shadow-2xl w-full h-full`}
                  iconClassName={theme.text}
                />
              </div>
              <h3 className="text-xl font-outfit font-bold text-taupe mb-0.5 group-hover:text-gold transition-colors">
                {child.name}
              </h3>
              {child.birth_date && (
                <p className="text-[10px] text-taupe/50 font-black uppercase tracking-widest">
                  {new Date(child.birth_date).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          );
        })}

        {/* Botón de Añadir Nuevo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: (children.length + 1) * 0.08, type: "spring", stiffness: 350, damping: 22 }}
          whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 20 } }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          className="group cursor-pointer flex flex-col items-center"
        >
          <div className="w-36 h-36 rounded-full border-3 border-dashed border-taupe/25 flex flex-col items-center justify-center mb-5 bg-white/40 hover:bg-white/80 hover:border-gold/50 transition-all shadow-sm duration-300">
            <Plus size={36} className="text-taupe/40 group-hover:text-gold group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-lg font-outfit font-black text-taupe/50 group-hover:text-gold transition-colors">
            Añadir Bebé
          </h3>
        </motion.div>
      </div>

      <p className="absolute bottom-8 text-[10px] text-taupe/60 uppercase tracking-[0.4em] font-black">
        TinyWorld™ Creative Studio
      </p>

      <CreateChildWizardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(newId) => {
          fetchChildren();
          setToast({ type: "success", message: "¡Perfil de bebé creado con éxito!" });
          if (newId) {
            router.push(`/dashboard/child/${newId}`);
          }
        }}
      />
    </div>
  );
}

