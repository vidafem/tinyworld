"use client";

import { motion } from "framer-motion";
import { Baby, Plus, LogOut, ChevronRight, User, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { themePalettes } from "@/lib/themes";
import BabyAvatar from "./Child/BabyAvatar";
import AppButton from "@/components/Common/AppButton";
import ModernModal from "@/components/Common/ModernModal";
import FloatingToast, { ToastData } from "@/components/Common/FloatingToast";
import CreateChildWizardModal from "./CreateChildWizardModal";

interface MobileProfileSelectorProps {
  onOpenProfile: () => void;
}

export default function MobileProfileSelector({ onOpenProfile }: MobileProfileSelectorProps) {
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
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="p-4 rounded-3xl bg-white shadow-xl flex items-center gap-3 text-taupe font-bold"
        >
          <Baby size={24} className="text-gold animate-bounce" />
          <span className="text-sm font-quicksand font-bold">Cargando tus pequeños...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-texture px-5 py-8 flex flex-col relative overflow-hidden pb-24">
      <FloatingToast toast={toast} onClose={() => setToast(null)} />

      {/* Header móvil */}
      <header className="flex justify-between items-center mb-8">
        <AppButton
          variant="secondary"
          size="icon"
          icon={<User size={18} className="text-taupe" />}
          onClick={onOpenProfile}
          className="shadow-sm w-11 h-11"
        />
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7 opacity-25" alt="TinyWorld" />
          <span className="font-outfit font-black text-taupe/30 tracking-widest uppercase text-[10px]">
            TinyWorld
          </span>
        </div>
        <AppButton
          variant="ghost"
          size="icon"
          icon={<LogOut size={18} className="text-red-400" />}
          onClick={handleLogout}
          className="hover:bg-red-50 w-11 h-11 text-red-500"
        />
      </header>

      {/* Título de bienvenida */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-sm text-[10px] font-black uppercase tracking-wider text-taupe/70 mb-2.5">
          <Sparkles size={11} className="text-gold" />
          <span>Mis Recuerdos</span>
        </div>
        <h1 className="text-3xl font-outfit font-black text-taupe leading-tight mb-1.5 tracking-tight">
          ¿Quién nos inspira hoy?
        </h1>
        <p className="text-xs text-taupe/60 font-bold uppercase tracking-widest font-quicksand">
          Selecciona un perfil para continuar
        </p>
      </motion.div>

      {/* Lista de perfiles con física táctil */}
      <div className="space-y-3 flex-1">
        {children.map((child, index) => {
          const theme = themePalettes[child.theme_color] || themePalettes.neutral;
          return (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 1) * 0.06, type: "spring", stiffness: 350, damping: 22 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(child.id)}
              className={`
                w-full p-3.5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl 
                rounded-[2rem] border border-white/80 dark:border-stone-800 shadow-md 
                flex items-center gap-3.5 cursor-pointer group active:shadow-inner
                transition-all duration-200
              `}
              style={{
                boxShadow: `0 8px 20px -6px ${theme.hex}25, inset 0 1px 0 rgba(255,255,255,0.8)`,
              }}
            >
              <div className="w-13 h-13 shrink-0">
                <BabyAvatar
                  gender={child.gender}
                  coverImage={child.cover_image || child.photo_url}
                  name={child.name}
                  size="sm"
                  className={`${theme.bg} border-3 border-white shadow-sm w-full h-full`}
                  iconClassName={theme.text}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-outfit font-black text-stone-800 dark:text-stone-100 tracking-tight truncate">
                  {child.name}
                </h3>
                {child.birth_date ? (
                  <p className="text-[10px] text-stone-400 font-bold font-quicksand">
                    Desde {new Date(child.birth_date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </p>
                ) : (
                  <p className="text-[10px] text-stone-400 font-bold font-quicksand">
                    Etapa de Gestación
                  </p>
                )}
              </div>
              <div className={`w-9 h-9 ${theme.bgLight} rounded-full flex items-center justify-center ${theme.text} transition-transform group-active:translate-x-1`}>
                <ChevronRight size={18} />
              </div>
            </motion.div>
          );
        })}

        {/* Botón Nuevo Bebé */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (children.length + 1) * 0.06 }}
          className="pt-2"
        >
          <AppButton
            variant="secondary"
            size="lg"
            onClick={() => setShowModal(true)}
            className="w-full py-4 rounded-[2rem] border-2 border-dashed border-taupe/20 bg-taupe/5 text-taupe/60 hover:text-taupe uppercase tracking-widest text-xs"
            icon={<Plus size={18} className="text-gold" />}
          >
            Nuevo Bebé
          </AppButton>
        </motion.div>
      </div>

      <footer className="mt-10 text-center opacity-30">
        <p className="text-[9px] text-taupe uppercase tracking-[0.4em] font-black">
          Studio Collective
        </p>
      </footer>

      <CreateChildWizardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(newId) => {
          fetchChildren();
          setToast({ type: "success", message: "¡Mundo creado con éxito!" });
          if (newId) {
            router.push(`/dashboard/child/${newId}`);
          }
        }}
      />
    </div>
  );
}

