"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, BookOpen, CalendarDays, Eye, 
  ChevronRight, User, Plus, 
  Trash2, Edit3, Loader2, Menu, X, Home, LogOut, ChevronLeft, Settings2,
  Sparkles, Images, Baby
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";

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
        <Loader2 className="animate-spin text-black/20" size={48} />
      </div>
    );
  }

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;

  const hubOptions = [
    { id: "pregnancy", title: "Embarazo", desc: "Dulce espera", icon: <Heart size={isMobile ? 22 : 32} />, route: `/dashboard/child/${child.id}/pregnancy`, delay: 0.1 },
    { id: "lifetime", title: "Toda una Vida", desc: "Etapas y Recuerdos", icon: <Sparkles size={isMobile ? 22 : 32} />, route: `/dashboard/child/${child.id}/lifetime`, delay: 0.15 },
    { id: "gallery", title: "Galería", desc: "Todo el Media", icon: <Images size={isMobile ? 22 : 32} />, route: `/dashboard/child/${child.id}/gallery`, delay: 0.2 },
    { id: "book", title: "Libro", desc: "Álbumes y fotos", icon: <BookOpen size={isMobile ? 22 : 32} />, route: `/dashboard/child/${child.id}/book`, delay: 0.25 },
    { id: "calendar", title: "Calendarios", desc: "Bóveda Premium", icon: <CalendarDays size={isMobile ? 22 : 32} />, route: `/dashboard/child/${child.id}/calendar`, delay: 0.3 },
    { id: "preview", title: "Preview", desc: "Vista Invitado", icon: <Eye size={isMobile ? 22 : 32} />, route: `/preview/${child.id}`, delay: 0.35 }
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

      <header className="px-4 md:px-6 py-4 flex items-center justify-between bg-white/60 backdrop-blur-xl sticky top-0 z-[100] shadow-sm border-b border-white/50">
        <div className="flex items-center gap-2 md:gap-4 z-[110]">
          <button onClick={() => router.push("/dashboard")} className={`p-2.5 bg-white rounded-2xl shadow-sm ${theme.text} hover:scale-110 transition-all border ${theme.borderAccent}`}><ChevronLeft size={22} /></button>
          <div className="relative">
            <button onClick={() => setShowMasterMenu(!showMasterMenu)} className={`p-2.5 bg-white rounded-2xl shadow-sm ${theme.text} hover:scale-110 transition-all border ${theme.borderAccent}`}><Menu size={22} /></button>
            <AnimatePresence>
              {showMasterMenu && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMasterMenu(false)} className="fixed inset-0 z-[-1]" />
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className={`absolute top-16 left-0 w-64 bg-white rounded-[2rem] shadow-2xl border ${theme.borderAccent} p-3 overflow-hidden`}>
                    <div className="flex flex-col gap-1">
                       <button onClick={() => window.location.href = '/dashboard'} className={`w-full p-4 hover:${theme.bgLight} rounded-2xl flex items-center gap-4 ${theme.text} transition-colors group`}><div className={`p-2 ${theme.bgLight} rounded-xl group-hover:${theme.primaryBg} group-hover:text-white transition-colors`}><Home size={18}/></div><span className="font-black uppercase tracking-widest text-[10px]">Mis Bebés</span></button>
                       <button onClick={() => router.push('/dashboard?view=profile')} className={`w-full p-4 hover:${theme.bgLight} rounded-2xl flex items-center gap-4 ${theme.text} transition-colors group`}><div className={`p-2 ${theme.bgLight} rounded-xl group-hover:${theme.primaryBg} group-hover:text-white transition-colors`}><User size={18}/></div><span className="font-black uppercase tracking-widest text-[10px]">Mi Perfil</span></button>
                       <div className={`h-px ${theme.borderAccent} opacity-50 my-1 mx-4`} />
                       <button onClick={handleLogout} className="w-full p-4 hover:bg-red-50 rounded-2xl flex items-center gap-4 text-red-500 transition-colors group"><div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors"><LogOut size={18}/></div><span className="font-black uppercase tracking-widest text-[10px]">Cerrar Sesión</span></button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3"><img src="/logo.png" className="w-8 h-8 md:w-10 md:h-10 object-contain opacity-20" /><span className={`hidden sm:inline font-outfit font-black ${theme.text} opacity-20 tracking-[0.4em] uppercase text-xs`}>TinyWorld</span></div>
        <div className="flex items-center gap-2 md:gap-4 z-[110]"><button onClick={() => router.push(`/dashboard/child/${child.id}/profile`)} className={`p-2.5 bg-white rounded-2xl shadow-sm ${theme.text} hover:scale-110 transition-all border ${theme.borderAccent}`}><Settings2 size={22} /></button></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-10 py-8 md:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 md:mb-10 w-full max-w-5xl flex flex-col items-center">
          <div className="flex flex-col md:flex-row justify-center items-center gap-y-2 md:gap-x-4">
            <div className="flex justify-center items-center gap-x-0.5 md:gap-x-1">
              {prefix.split("").map((letter, i) => (
                <motion.span key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.05, ease: "easeInOut" }} className={`font-outfit font-black inline-block ${letter === " " ? "w-2 md:w-4" : ""} ${theme.text} leading-none`} style={{ fontSize: isMobile ? 'clamp(1.8rem, 10vw, 3rem)' : 'clamp(3rem, 5vw, 6rem)' }}>{letter}</motion.span>
              ))}
            </div>
            <div className="flex justify-center items-center gap-x-0.5 md:gap-x-1">
              {babyName.split("").map((letter: string, i: number) => (
                <motion.span key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: (prefix.length + i) * 0.05, ease: "easeInOut" }} className={`font-outfit font-black inline-block ${letter === " " ? "w-2 md:w-4" : ""} ${theme.text} leading-none`} style={{ fontSize: isMobile ? 'clamp(1.8rem, 10vw, 3rem)' : 'clamp(3rem, 5vw, 6rem)' }}>{letter}</motion.span>
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
              const parts = [];
              if (weeks > 0) parts.push(weeks === 1 ? "1 semana" : `${weeks} semanas`);
              if (remDays > 0) parts.push(remDays === 1 ? "1 día" : `${remDays} días`);
              if (parts.length === 0) return "Recién nacido";
              return parts.join(" y ");
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
                transition={{ delay: 0.5 }}
                onClick={() => {
                  if (isClickable) {
                    router.push(`/dashboard/child/${child.id}/pregnancy?openVisualizer=true`);
                  }
                }}
                className={`mt-4 inline-flex flex-col items-center gap-1 relative z-10 ${
                  isClickable ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
                }`}
              >
                <div className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black tracking-wider shadow-sm border ${theme.borderAccent} bg-white/90 ${theme.text} uppercase flex items-center gap-1.5`}>
                  <Baby size={12} className={theme.text} />
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

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 w-full max-w-6xl px-2">
          {hubOptions.map((opt) => (
            <motion.button
              key={opt.id}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setExpandingCard(opt.id);
                setTimeout(() => router.push(opt.route), 400);
              }}
              className={`
                bg-white/60 hover:bg-white backdrop-blur-md 
                p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] 
                shadow-sm hover:shadow-xl transition-all border border-white/50 
                flex flex-col items-center gap-3 md:gap-6 group w-full text-center
                relative overflow-hidden
              `}
            >
              <div className={`
                w-12 h-12 md:w-24 md:h-24 shrink-0 rounded-full ${theme.bg} 
                flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner
                border-2 md:border-4 border-white
              `}>
                <div className={theme.text}>{opt.icon}</div>
              </div>
              <div className="w-full">
                <h2 className={`text-[11px] md:text-2xl font-black ${theme.text} leading-tight tracking-tighter uppercase md:normal-case`}>{opt.title}</h2>
                <p className={`hidden md:block ${theme.text} opacity-40 text-[10px] md:text-sm font-bold uppercase tracking-widest mt-1`}>{opt.desc}</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
            </motion.button>
          ))}
        </div>
      </main>

      <footer className="p-8 text-center mt-auto opacity-20">
        <p className={`text-[10px] font-black ${theme.text} uppercase tracking-[0.5em]`}>TinyWorld Studio</p>
      </footer>
    </div>
  );
}
