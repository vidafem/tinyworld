"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Camera, Heart, X, PartyPopper, Calendar, ArrowRight, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { playSoftPop, playActionSnap } from "@/lib/pageSound";
import { 
  MilestoneInfo, 
  StoredMilestoneCelebration, 
  checkTodayMilestone, 
  fetchOrGenerateCelebration,
  triggerSilentUpcomingGeneration,
  formatDateToLocalISO
} from "@/lib/celebrationEngine";
import { supabase } from "@/lib/supabase";

interface MilestoneCelebrationModalProps {
  child: any;
  theme: any;
  lifeSections?: any[];
}

export default function MilestoneCelebrationModal({
  child,
  theme,
  lifeSections = []
}: MilestoneCelebrationModalProps) {
  const router = useRouter();
  const [milestone, setMilestone] = useState<MilestoneInfo | null>(null);
  const [celebration, setCelebration] = useState<StoredMilestoneCelebration | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  // Disparo de fuegos artificiales de confeti
  const launchFestiveConfetti = useCallback(() => {
    try {
      const duration = 2500;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 45 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: 0.15 + Math.random() * 0.2, y: Math.random() - 0.2 },
          colors: ["#FF6B8B", "#FFD166", "#06D6A0", "#118AB2", "#8338EC", "#F72585"]
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: 0.65 + Math.random() * 0.2, y: Math.random() - 0.2 },
          colors: ["#FF6B8B", "#FFD166", "#06D6A0", "#118AB2", "#8338EC", "#F72585"]
        });
      }, 250);
    } catch (e) {
      // Ignorar si el navegador restringe canvas
    }
  }, []);

  // Verificar hito de hoy al cargar
  useEffect(() => {
    if (!child) return;

    const todayMilestone = checkTodayMilestone(child, lifeSections);
    if (!todayMilestone) {
      // Si no hay hito hoy, verificar si hay hitos próximos para pre-generar silenciosamente
      supabase.auth.getSession().then(({ data }) => {
        triggerSilentUpcomingGeneration(child, lifeSections, data.session?.access_token);
      });
      return;
    }

    setMilestone(todayMilestone);

    // Revisar si ya fue cerrado en esta sesión de navegación específica
    const todayStr = formatDateToLocalISO(new Date());
    const sessionKey = `tw_celebration_seen_${child.id}_${todayMilestone.milestoneKey}_${todayStr}`;
    const alreadyDismissedInSession = sessionStorage.getItem(sessionKey) === "dismissed";

    // Cargar o solicitar la celebración
    async function initCelebration() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const celeb = await fetchOrGenerateCelebration(child, todayMilestone, session?.access_token);
      setCelebration(celeb);
      setLoading(false);

      if (!alreadyDismissedInSession) {
        setIsOpen(true);
        setTimeout(() => {
          playSoftPop();
          launchFestiveConfetti();
        }, 300);
      } else {
        setHasDismissed(true);
      }

      // También disparar la pregeneración de próximos hitos
      triggerSilentUpcomingGeneration(child, lifeSections, session?.access_token);
    }

    initCelebration();
  }, [child, lifeSections, launchFestiveConfetti]);

  const handleDismiss = () => {
    playActionSnap();
    if (milestone) {
      const todayStr = formatDateToLocalISO(new Date());
      sessionStorage.setItem(`tw_celebration_seen_${child.id}_${milestone.milestoneKey}_${todayStr}`, "dismissed");
    }
    setIsOpen(false);
    setHasDismissed(true);
  };

  const handleOpenAgain = () => {
    playSoftPop();
    setIsOpen(true);
    launchFestiveConfetti();
  };

  const handleAddMemory = () => {
    playActionSnap();
    setIsOpen(false);
    if (celebration?.target_route) {
      router.push(celebration.target_route);
    } else if (milestone?.targetRoute) {
      router.push(milestone.targetRoute);
    } else {
      router.push(`/dashboard/child/${child.id}`);
    }
  };

  if (!milestone) return null;

  const childName = child.nickname || child.name || "tu bebé";

  return (
    <>
      {/* Botón flotante festivo para reabrir durante todo el día del hito */}
      <AnimatePresence>
        {hasDismissed && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-16 right-4 z-[90] max-w-[90vw]"
          >
            <button
              onClick={handleOpenAgain}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border border-amber-300/60 bg-gradient-to-r from-amber-400/90 via-rose-400/90 to-purple-400/90 text-white font-bold text-xs backdrop-blur-md hover:scale-105 active:scale-95 transition-all group`}
            >
              <PartyPopper size={16} className="animate-bounce" />
              <span className="truncate">¡Hito de Hoy: {milestone.milestoneType === "pregnancy_week" ? `${milestone.milestoneNumber} Semanas` : milestone.title.split("!")[0]?.replace("¡", "") || "Celebración"}!</span>
              <Sparkles size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Principal de Celebración */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop con desenfoque elegante */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDismiss}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Contenedor de la Tarjeta Celebratoria */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-2xl border-2 border-amber-300/50 dark:border-amber-500/30 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Brillos y gradientes festivos de fondo */}
              <div className="absolute -top-24 -left-24 w-60 h-60 bg-rose-400/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-400/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-400/15 rounded-full blur-3xl pointer-events-none" />

              {/* Botón cerrar X */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-stone-500 dark:text-stone-300 transition-colors"
                aria-label="Cerrar celebración"
              >
                <X size={20} />
              </button>

              <div className="p-6 md:p-8 flex flex-col items-center text-center overflow-y-auto custom-scrollbar relative z-10">
                {/* Emblema Animado con Confeti */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.25, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ delay: 0.15, duration: 0.7, type: "spring" }}
                  className="relative mb-4 mt-2"
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-400 to-purple-500 p-1 shadow-xl flex items-center justify-center">
                    <div className="w-full h-full bg-white dark:bg-stone-900 rounded-[1.35rem] flex items-center justify-center text-4xl md:text-5xl shadow-inner">
                      {milestone.badgeEmoji || "🎉"}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="absolute -top-2 -right-2 text-amber-500"
                  >
                    <Sparkles size={22} />
                  </motion.div>
                </motion.div>

                {/* Título de Celebración */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-outfit font-black text-2xl md:text-3xl text-stone-900 dark:text-white leading-tight tracking-tight mb-2"
                >
                  {celebration?.title || milestone.title}
                </motion.h2>

                {/* Subtítulo identificando al bebé */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 text-xs font-bold mb-4"
                >
                  <Heart size={12} className="fill-amber-500 text-amber-500" />
                  <span>Un gran día en el diario de {childName}</span>
                </motion.div>

                {/* Caja de Mensaje Poético Personalizado de TinyAI */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full p-4 md:p-5 rounded-2xl bg-amber-50/70 dark:bg-stone-800/70 border border-amber-200/80 dark:border-amber-700/30 text-stone-700 dark:text-stone-200 text-sm md:text-base leading-relaxed font-quicksand font-medium relative mb-6 shadow-sm"
                >
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2 text-stone-400">
                      <Loader2 size={24} className="animate-spin text-amber-500" />
                      <span className="text-xs">Preparando mensaje personalizado...</span>
                    </div>
                  ) : (
                    <>
                      <p className="italic">
                        "{celebration?.message}"
                      </p>
                      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                        <Sparkles size={11} />
                        <span>TinyAI con Amor Familiar</span>
                      </div>
                    </>
                  )}
                </motion.div>

                {/* Botones de Acción */}
                <div className="w-full flex flex-col sm:flex-row gap-3">
                  {/* Botón Principal: Anotar este Recuerdo y Adjuntar Fotos */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddMemory}
                    className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-black text-sm shadow-lg shadow-rose-500/25 transition-all cursor-pointer group"
                  >
                    <Camera size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>Anotar este Recuerdo</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  {/* Botón Secundario: Celebrar y Continuar */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDismiss}
                    className="sm:w-auto py-3.5 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-sm transition-all cursor-pointer"
                  >
                    ¡Celebrar! 🎉
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
