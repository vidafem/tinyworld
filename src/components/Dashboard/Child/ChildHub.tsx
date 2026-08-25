"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, BookOpen, CalendarDays, Eye, 
  User, Loader2, Menu, Home, LogOut, ChevronLeft, Settings2,
  Sparkles, Images, Baby
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import TinyAIAssistantModal from "@/components/Common/TinyAIAssistantModal";
import AppButton from "@/components/Common/AppButton";

interface ChildHubProps {
  childId: string;
}

export default function ChildHub({ childId }: ChildHubProps) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandingCard, setExpandingCard] = useState<string | null>(null);
  const [showMasterMenu, setShowMasterMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    
    async function loadChild() {
      const { data } = await supabase.from("children").select("*").eq("id", childId).single();
      if (data) setChild(data);
      setLoading(false);
    }
    loadChild();
    return () => window.removeEventListener('resize', syncViewport);
  }, [childId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-texture">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="p-4 rounded-3xl bg-white shadow-xl flex items-center gap-3 text-taupe font-bold"
        >
          <Baby size={28} className="text-gold animate-bounce" />
          <span className="font-quicksand">Abriendo el mundo...</span>
        </motion.div>
      </div>
    );
  }

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;

  const hubOptions = [
    { id: "pregnancy", title: "Embarazo", desc: "Dulce espera & Hitos", icon: <Heart size={isMobile ? 22 : 32} />, route: `/dashboard/child/${child.id}/pregnancy`, delay: 0.05 },
    { id: "lifetime", title: "Toda una Vida", desc: "Etapas y Recuerdos", icon: <Sparkles size={isMobile ? 22 : 32} />, route: `/dashboard/child/${child.id}/lifetime`, delay: 0.1 },
    { id: "gallery", title: "Galería", desc: "Fotos, Videos y Audios", icon: <Images size={isMobile ? 22 : 32} />, route: `/dashboard/child/${child.id}/gallery`, delay: 0.15 },
    { id: "book", title: "Libro", desc: "Álbumes Digitales", icon: <BookOpen size={isMobile ? 22 : 32} />, route: `/dashboard/child/${child.id}/book`, delay: 0.2 },
    { id: "calendar", title: "Calendarios", desc: "Bóveda Mensual", icon: <CalendarDays size={isMobile ? 22 : 32} />, route: `/dashboard/child/${child.id}/calendar`, delay: 0.25 },
    { id: "preview", title: "Preview", desc: "Vista Pública / Invitado", icon: <Eye size={isMobile ? 22 : 32} />, route: `/preview/${child.id}`, delay: 0.3 }
  ];

  const prefix = "El Mundo de";
  const babyName = child.nickname || child.name;

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture transition-colors duration-500 flex flex-col relative pb-20`}>
      
      <AnimatePresence>
        {expandingCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[100] ${theme.bg}`} />
        )}
      </AnimatePresence>

      <header className="px-4 md:px-6 py-3.5 flex items-center justify-between bg-white/70 dark:bg-stone-900/70 backdrop-blur-2xl sticky top-0 z-[100] shadow-sm border-b border-white/60 dark:border-white/10">
        <div className="flex items-center gap-2 md:gap-3 z-[110]">
          <AppButton
            variant="secondary"
            size="icon"
            onClick={() => router.push("/dashboard")}
            icon={<ChevronLeft size={20} className={theme.text} />}
            className="shadow-sm"
          />
          
          <div className="relative">
            <AppButton
              variant="secondary"
              size="icon"
              onClick={() => setShowMasterMenu(!showMasterMenu)}
              icon={<Menu size={20} className={theme.text} />}
              className="shadow-sm"
            />
            
            <AnimatePresence>
              {showMasterMenu && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMasterMenu(false)} className="fixed inset-0 z-[-1]" />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.94, filter: "blur(4px)" }} 
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} 
                    exit={{ opacity: 0, y: 8, scale: 0.95, filter: "blur(4px)" }} 
                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                    className={`absolute top-14 left-0 w-64 bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border ${theme.borderAccent} p-2.5 overflow-hidden z-50`}
                  >
                    <div className="flex flex-col gap-1">
                       <button onClick={() => router.push('/dashboard')} className={`w-full p-3.5 hover:${theme.bgLight} rounded-2xl flex items-center gap-3.5 ${theme.text} transition-colors group text-left`}><div className={`p-2 ${theme.bgLight} rounded-xl group-hover:${theme.primaryBg} group-hover:text-white transition-colors`}><Home size={17}/></div><span className="font-black uppercase tracking-widest text-[10px]">Mis Bebés</span></button>
                       <button onClick={() => router.push('/dashboard?view=profile')} className={`w-full p-3.5 hover:${theme.bgLight} rounded-2xl flex items-center gap-3.5 ${theme.text} transition-colors group text-left`}><div className={`p-2 ${theme.bgLight} rounded-xl group-hover:${theme.primaryBg} group-hover:text-white transition-colors`}><User size={17}/></div><span className="font-black uppercase tracking-widest text-[10px]">Mi Perfil</span></button>
                       <div className={`h-px ${theme.borderAccent} opacity-40 my-1 mx-3`} />
                       <button onClick={handleLogout} className="w-full p-3.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-2xl flex items-center gap-3.5 text-red-500 transition-colors group text-left"><div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors"><LogOut size={17}/></div><span className="font-black uppercase tracking-widest text-[10px]">Cerrar Sesión</span></button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3">
          <img src="/logo.png" className="w-8 h-8 md:w-9 md:h-9 object-contain opacity-25" alt="TinyWorld" />
          <span className={`hidden sm:inline font-outfit font-black ${theme.text} opacity-30 tracking-[0.4em] uppercase text-xs`}>
            TinyWorld
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3 z-[110]">
          <AppButton
            variant="secondary"
            size="icon"
            onClick={() => router.push(`/dashboard/child/${child.id}/profile`)}
            icon={<Settings2 size={20} className={theme.text} />}
            className="shadow-sm"
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-10 py-6 md:py-14">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 350, damping: 25 }} className="text-center mb-6 md:mb-10 w-full max-w-5xl flex flex-col items-center">
          <div className="flex flex-col md:flex-row justify-center items-center gap-y-1.5 md:gap-x-3.5">
            <div className="flex justify-center items-center gap-x-0.5 md:gap-x-1">
              {prefix.split("").map((letter, i) => (
                <motion.span key={i} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.04, ease: "easeInOut" }} className={`font-outfit font-black inline-block ${letter === " " ? "w-2 md:w-3" : ""} ${theme.text} leading-none`} style={{ fontSize: isMobile ? 'clamp(1.8rem, 9vw, 2.8rem)' : 'clamp(2.8rem, 4.5vw, 5.5rem)' }}>{letter}</motion.span>
              ))}
            </div>
            <div className="flex justify-center items-center gap-x-0.5 md:gap-x-1">
              {babyName.split("").map((letter: string, i: number) => (
                <motion.span key={i} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: (prefix.length + i) * 0.04, ease: "easeInOut" }} className={`font-outfit font-black inline-block ${letter === " " ? "w-2 md:w-3" : ""} ${theme.text} leading-none`} style={{ fontSize: isMobile ? 'clamp(1.8rem, 9vw, 2.8rem)' : 'clamp(2.8rem, 4.5vw, 5.5rem)' }}>{letter}</motion.span>
              ))}
            </div>
          </div>

          {(() => {
            const config = child.preview_config || {};
            const isPregnancy = config.status !== "born";
            let label = "";
            let subLabel = "";

            const calculateGestation = (fumStr: string) => {
              if (!fumStr) return null;
              const fum = new Date(fumStr + "T12:00:00");
              const now = new Date();
              const diffTime = now.getTime() - fum.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays < 0) return { weeks: 0, days: 0, fpp: new Date(fum.getTime() + 280 * 24 * 60 * 60 * 1000) };
              const weeks = Math.floor(diffDays / 7);
              const days = diffDays % 7;
              const fpp = new Date(fum.getTime() + 280 * 24 * 60 * 60 * 1000);
              return { weeks, days, fpp };
            };

            const calculateAge = (birthDateStr: string) => {
              if (!birthDateStr) return null;
              const birth = new Date(birthDateStr + "T12:00:00");
              const now = new Date();
              const diffTime = now.getTime() - birth.getTime();
              if (diffTime < 0) return "¡Por nacer!";
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              let years = now.getFullYear() - birth.getFullYear();
              let months = now.getMonth() - birth.getMonth();
              let days = now.getDate() - birth.getDate();
              
              if (days < 0) {
                months--;
                const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                days += prevMonth.getDate();
              }
              if (months < 0) {
                years--;
                months += 12;
              }
              
              if (years > 0) {
                const parts = [];
                parts.push(years === 1 ? "1 año" : `${years} años`);
                if (months > 0) parts.push(months === 1 ? "1 mes" : `${months} meses`);
                return parts.join(" y ");
              }
              
              if (months > 0) {
                const parts = [];
                parts.push(months === 1 ? "1 mes" : `${months} meses`);
                const weeks = Math.floor(days / 7);
                const remDays = days % 7;
                if (weeks > 0) parts.push(weeks === 1 ? "1 semana" : `${weeks} semanas`);
                if (weeks === 0 && remDays > 0) parts.push(remDays === 1 ? "1 día" : `${remDays} días`);
                return parts.join(" y ");
              }
              
              const weeks = Math.floor(diffDays / 7);
              const remDays = diffDays % 7;
              if (weeks > 0) return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
              if (remDays > 0) return `${remDays} ${remDays === 1 ? 'día' : 'días'}`;
              return "Recién nacido";
            };

            if (isPregnancy && config.fum) {
              const gest = calculateGestation(config.fum);
              if (gest) {
                label = `${gest.weeks} ${gest.weeks === 1 ? 'Semana' : 'Semanas'}${gest.days > 0 ? ` y ${gest.days} ${gest.days === 1 ? 'Día' : 'Días'}` : ''} de Gestación`;
                const fppFormatted = gest.fpp.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                subLabel = `FPP: ${fppFormatted}`;
              }
            } else if (!isPregnancy && child.birth_date) {
              const ageStr = calculateAge(child.birth_date);
              if (ageStr) {
                label = `Edad: ${ageStr}`;
              }
            }

            if (!label) return null;

            const isClickable = isPregnancy && config.fum;

            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => {
                  if (isClickable) {
                    router.push(`/dashboard/child/${child.id}/pregnancy?openVisualizer=true`);
                  }
                }}
                className={`mt-3.5 inline-flex flex-col items-center gap-1 relative z-10 ${
                  isClickable ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
                }`}
              >
                <div className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black tracking-wider shadow-md border ${theme.borderAccent} bg-white/95 dark:bg-stone-900/95 ${theme.text} uppercase flex items-center gap-1.5 backdrop-blur-md`}>
                  <Baby size={13} className={theme.text} />
                  <span>{label}</span>
                </div>
                {subLabel && (
                  <span className={`text-[8.5px] uppercase tracking-widest font-black ${theme.text} opacity-50`}>
                    {subLabel}
                  </span>
                )}
              </motion.div>
            );
          })()}
        </motion.div>

        {/* Las 6 Tarjetas de Acceso del Hub con Micro-Elevación y Sombras Teñidas */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-7 w-full max-w-6xl px-2">
          {hubOptions.map((opt) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: opt.delay, type: "spring", stiffness: 350, damping: 22 }}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 20 } }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setExpandingCard(opt.id);
                setTimeout(() => router.push(opt.route), 350);
              }}
              className={`
                bg-white/75 dark:bg-stone-900/75 hover:bg-white dark:hover:bg-stone-900 
                backdrop-blur-xl p-4 md:p-7 rounded-[2rem] md:rounded-[2.5rem] 
                shadow-sm hover:shadow-2xl transition-all border border-white/70 dark:border-stone-800 
                flex flex-col items-center gap-3 md:gap-5 group w-full text-center
                relative overflow-hidden cursor-pointer
              `}
              style={{
                boxShadow: `0 10px 25px -8px ${theme.hex}22, inset 0 1px 0 rgba(255,255,255,0.7)`,
              }}
            >
              <div className={`
                w-13 h-13 md:w-20 md:h-20 shrink-0 rounded-full ${theme.bg} 
                flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner
                border-2 md:border-3 border-white dark:border-stone-800
              `}>
                <div className={theme.text}>{opt.icon}</div>
              </div>
              <div className="w-full">
                <h2 className={`text-xs md:text-xl font-black ${theme.text} leading-tight tracking-tight uppercase md:normal-case font-outfit`}>
                  {opt.title}
                </h2>
                <p className={`hidden md:block ${theme.text} opacity-50 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5 font-quicksand`}>
                  {opt.desc}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </main>

      <footer className="p-6 text-center mt-auto opacity-25">
        <p className={`text-[9px] font-black ${theme.text} uppercase tracking-[0.4em]`}>
          TinyWorld Studio
        </p>
      </footer>

      <TinyAIAssistantModal theme={theme} childName={child?.name || "el Bebé"} child={child} />
    </div>
  );
}

