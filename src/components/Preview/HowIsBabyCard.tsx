"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Ruler, Info, Sparkles, Box, Heart, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PREGNANCY_ADVICE } from "@/lib/pregnancyAdvice";
import Tilt3DCard from "@/components/Common/Tilt3DCard";

const calculateExactWeeks = (fumStr: string) => {
  const fum = new Date(fumStr + "T12:00:00");
  const today = new Date();
  if (isNaN(fum.getTime())) return 0;
  const diffDays = (today.getTime() - fum.getTime()) / (1000 * 60 * 60 * 24);
  let weeks = diffDays / 7;
  weeks = Math.min(42, Math.max(0, weeks));
  return weeks;
};

interface HowIsBabyCardProps {
  fum: string | null | undefined;
  theme: {
    bg: string;
    text: string;
    cardBg: string;
    cardHover: string;
    primaryBg: string;
    hoverBg: string;
    borderAccent: string;
    bgLight: string;
    textActive: string;
    hex: string;
  };
  initialOpen?: boolean;
}

const WEEK_DATA: { [key: number]: { length: number; weight: number; fruit: string; emoji: string; desc: string; image: string } } = {
  1: { length: 0.1, weight: 0.1, fruit: "Célula", emoji: "✨", desc: "El óvulo es fertilizado y comienza su división mitótica en su viaje hacia el útero.", image: "/images/preggers/week_1.png" },
  2: { length: 0.1, weight: 0.2, fruit: "Blastocisto", emoji: "✨", desc: "Las células continúan multiplicándose rápidamente formando una esfera que busca implantarse.", image: "/images/preggers/week_2.png" },
  3: { length: 0.1, weight: 0.3, fruit: "Embrión Inicial", emoji: "✨", desc: "El blastocisto se adhiere a la pared uterina; se forman las primeras capas celulares del bebé.", image: "/images/preggers/week_3.png" },
  4: { length: 0.2, weight: 1, fruit: "Semilla de Amapola", emoji: "🌱", desc: "El embrión se implanta en el útero y empieza a formarse el tubo neural, inicio del cerebro.", image: "/images/preggers/week_4.png" },
  5: { length: 0.3, weight: 1, fruit: "Semilla de Sésamo", emoji: "🌱", desc: "El embrión crece y el corazón primitivo comienza a latir de manera rítmica.", image: "/images/preggers/week_5.png" },
  6: { length: 0.5, weight: 1, fruit: "Lenteja", emoji: "🌱", desc: "Las facciones del rostro empiezan a definirse y brotan los esbozos de los brazos.", image: "/images/preggers/week_6.png" },
  7: { length: 1.2, weight: 2, fruit: "Arándano", emoji: "🫐", desc: "El cerebro se divide en hemisferios y las extremidades se alargan formando las articulaciones.", image: "/images/preggers/week_7.png" },
  8: { length: 1.6, weight: 3, fruit: "Frambuesa", emoji: "🍓", desc: "Brazos y piernas brotan. El corazón ya late con fuerza a unos 150-170 latidos por minuto.", image: "/images/preggers/week_8.png" },
  9: { length: 2.3, weight: 4, fruit: "Uva", emoji: "🍇", desc: "Los dedos de las manos y de los pies comienzan a formarse y la cola vestigial desaparece.", image: "/images/preggers/week_9.png" },
  10: { length: 3.1, weight: 5, fruit: "Kumquat", emoji: "🍊", desc: "El feto empieza a moverse en el líquido amniótico y sus riñones comienzan a producir orina.", image: "/images/preggers/week_10.png" },
  11: { length: 4.1, weight: 7, fruit: "Higo", emoji: "🫒", desc: "Las uñas empiezan a crecer y casi todos los órganos vitales ya están funcionando.", image: "/images/preggers/week_11.png" },
  12: { length: 5.4, weight: 14, fruit: "Limón", emoji: "🍋", desc: "El bebé ya tiene sus dedos separados, gesticula y sus reflejos de succión comienzan.", image: "/images/preggers/week_12.png" },
  13: { length: 7.4, weight: 23, fruit: "Vaina de Guisante", emoji: "🫛", desc: "Las huellas dactilares se forman en las yemas de sus dedos y el cuerpo crece más rápido.", image: "/images/preggers/week_13.png" },
  14: { length: 8.7, weight: 43, fruit: "Limón Verde", emoji: "🍋", desc: "La glándula tiroides comienza a secretar hormonas y el bebé empieza a practicar la respiración.", image: "/images/preggers/week_14.png" },
  15: { length: 10.1, weight: 70, fruit: "Manzana", emoji: "🍎", desc: "La piel es muy delgada y transparente; el bebé puede mover todas sus articulaciones.", image: "/images/preggers/week_15.png" },
  16: { length: 11.6, weight: 100, fruit: "Aguacate", emoji: "🥑", desc: "Los ojos se mueven bajo los párpados cerrados y el bebé ya puede oír voces externas.", image: "/images/preggers/week_16.png" },
  17: { length: 13.0, weight: 140, fruit: "Nectarina", emoji: "🍑", desc: "El esqueleto del bebé está cambiando de cartílago blando a hueso duro.", image: "/images/preggers/week_17.png" },
  18: { length: 14.2, weight: 190, fruit: "Camote", emoji: "🍠", desc: "El bebé bosteza, traga líquido amniótico y puede experimentar hipo.", image: "/images/preggers/week_18.png" },
  19: { length: 15.3, weight: 240, fruit: "Mango", emoji: "🥭", desc: "Se forma la vérnix caseosa, una capa grasa que protege la piel del líquido amniótico.", image: "/images/preggers/week_19.png" },
  20: { length: 25.6, weight: 300, fruit: "Plátano", emoji: "🍌", desc: "¡Punto medio! El cerebro desarrolla las áreas sensoriales: oído, vista, gusto y tacto.", image: "/images/preggers/week_20.png" },
  21: { length: 26.7, weight: 360, fruit: "Zanahoria", emoji: "🥕", desc: "El bebé traga líquido amniótico para entrenar su sistema digestivo en desarrollo.", image: "/images/preggers/week_21.png" },
  22: { length: 27.8, weight: 430, fruit: "Papaya", emoji: "🥭", desc: "Los párpados y cejas están completamente formados y el bebé tiene ciclos de sueño.", image: "/images/preggers/week_22.png" },
  23: { length: 28.9, weight: 500, fruit: "Pomelo", emoji: "🍊", desc: "El sentido del equilibrio en el oído interno se desarrolla; el bebé nota su posición.", image: "/images/preggers/week_23.png" },
  24: { length: 30.0, weight: 600, fruit: "Berenjena", emoji: "🍆", desc: "Los pulmones desarrollan surfactante para respirar al nacer. Reacciona a ruidos fuertes.", image: "/images/preggers/week_24.png" },
  25: { length: 34.6, weight: 660, fruit: "Nabo", emoji: "🥬", desc: "La piel se vuelve menos arrugada a medida que se acumula grasa subcutánea.", image: "/images/preggers/week_25.png" },
  26: { length: 35.6, weight: 760, fruit: "Pepino", emoji: "🥒", desc: "El bebé puede inhalar, exhalar y abrir los ojos. Se detecta actividad cerebral.", image: "/images/preggers/week_26.png" },
  27: { length: 36.6, weight: 875, fruit: "Coliflor", emoji: "🥦", desc: "El bebé empieza a reconocer tu voz y la de tu pareja con más claridad.", image: "/images/preggers/week_27.png" },
  28: { length: 37.6, weight: 1000, fruit: "Calabaza Butternut", emoji: "🎃", desc: "El cerebro crece a paso acelerado y forma los pliegues cerebrales característicos.", image: "/images/preggers/week_28.png" },
  29: { length: 38.6, weight: 1150, fruit: "Piña", emoji: "🍍", desc: "Los ojos ya se abren y se cierran, y las pestañas están completamente formadas.", image: "/images/preggers/week_29.png" },
  30: { length: 39.9, weight: 1300, fruit: "Repollo", emoji: "🥬", desc: "La médula espinal asume la producción de glóbulos rojos en lugar del bazo.", image: "/images/preggers/week_30.png" },
  31: { length: 41.1, weight: 1500, fruit: "Coco", emoji: "🥥", desc: "El bebé puede girar la cabeza de un lado a otro y se mueve activamente.", image: "/images/preggers/week_31.png" },
  32: { length: 42.4, weight: 1700, fruit: "Jícama", emoji: "🍈", desc: "Uñas de manos y pies terminadas. El bebé practica la respiración constantemente.", image: "/images/preggers/week_32.png" },
  33: { length: 43.7, weight: 1900, fruit: "Piña Mediana", emoji: "🍍", desc: "Los huesos se endurecen pero los del cráneo siguen flexibles para el parto.", image: "/images/preggers/week_33.png" },
  34: { length: 45.0, weight: 2100, fruit: "Cantalupo", emoji: "🍈", desc: "El sistema inmunológico del bebé recibe anticuerpos protectores de la madre.", image: "/images/preggers/week_34.png" },
  35: { length: 46.2, weight: 2380, fruit: "Melón Honeydew", emoji: "🍈", desc: "La mayoría del lanugo (vello fino) ha desaparecido de su piel.", image: "/images/preggers/week_35.png" },
  36: { length: 47.4, weight: 2600, fruit: "Lechuga Romana", emoji: "🥬", desc: "El bebé acumula grasa en sus mejillas y extremidades. Suele colocarse de cabeza.", image: "/images/preggers/week_36.png" },
  37: { length: 48.6, weight: 2860, fruit: "Acelga", emoji: "🥬", desc: "El bebé se considera casi a término; sus pulmones están listos para respirar.", image: "/images/preggers/week_37.png" },
  38: { length: 49.8, weight: 3100, fruit: "Puerro", emoji: "🥦", desc: "El bebé sigue acumulando grasa para regular su temperatura al nacer.", image: "/images/preggers/week_38.png" },
  39: { length: 50.7, weight: 3290, fruit: "Sandía Pequeña", emoji: "🍉", desc: "El cerebro y los pulmones continúan madurando en sus etapas finales.", image: "/images/preggers/week_39.png" },
  40: { length: 51.2, weight: 3400, fruit: "Sandía Grande", emoji: "🍉", desc: "¡Desarrollo completo! El bebé está 100% listo para nacer y conocer a su familia.", image: "/images/preggers/week_40.png" },
  41: { length: 51.7, weight: 3550, fruit: "Calabaza Gigante", emoji: "🎃", desc: "El bebé está listo para nacer en cualquier momento. ¡Monitorea las contracciones!", image: "/images/preggers/week_41.png" },
  42: { length: 52.2, weight: 3700, fruit: "Melón Gigante", emoji: "🍈", desc: "¡Cualquier día es el nacimiento! Felicidades y paciencia en la dulce espera.", image: "/images/preggers/week_42.png" }
};

export default function HowIsBabyCard({ fum, theme, initialOpen }: HowIsBabyCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(initialOpen || false);
  const [activeWeek, setActiveWeek] = useState<number>(24);
  const [activeOverlay, setActiveOverlay] = useState<"ruler" | "info" | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"baby" | "health" | "love" | "todo">("baby");
  const panContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isModalOpen) {
      setActiveTab("baby");
    }
  }, [isModalOpen]);

  // Sync isMobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync with initialOpen
  useEffect(() => {
    if (initialOpen) {
      setIsModalOpen(true);
    }
  }, [initialOpen]);

  // Sync with FUM
  useEffect(() => {
    if (fum) {
      const calculated = calculateExactWeeks(fum);
      setActiveWeek(calculated > 0 ? Math.max(1, Math.min(42, calculated)) : 24);
    } else {
      const demoFum = "2025-09-20";
      const calculated = calculateExactWeeks(demoFum);
      setActiveWeek(calculated > 0 ? Math.max(1, Math.min(42, calculated)) : 34);
    }
  }, [fum]);

  // Fade effect on week change
  useEffect(() => {
    setIsChanging(true);
    const t = setTimeout(() => setIsChanging(false), 200);
    return () => clearTimeout(t);
  }, [activeWeek]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const roundedWeek = Math.max(1, Math.min(42, Math.floor(activeWeek)));
  const currentWeekData = WEEK_DATA[roundedWeek] || WEEK_DATA[24];
  const decimalDays = Math.round((activeWeek % 1) * 7);

  const formattedCalculatedWeek = fum 
    ? `${Math.floor(calculateExactWeeks(fum))} Semanas`
    : `${Math.floor(activeWeek)} Semanas (Demo)`;

  const toggleOverlay = (mode: "ruler" | "info") => {
    if (activeOverlay === mode) {
      setActiveOverlay(null);
    } else {
      setActiveOverlay(mode);
    }
  };

  // Generate dynamic gradient background colors based on active theme
  const getDynamicModalBg = () => {
    return {
      background: `radial-gradient(circle at center, ${theme.hex}15 0%, #07080d 100%)`
    };
  };

  return (
    <>
      {/* COLLAPSED PREVIEW CARD (Dashboard Card) */}
      <Tilt3DCard className="w-full">
        <motion.button 
          onClick={() => setIsModalOpen(true)}
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          className={`
            bg-white/60 hover:bg-white p-3 md:p-6 rounded-[2.5rem] md:rounded-[3rem] 
            shadow-sm hover:shadow-xl transition-all border border-white/50 
            flex flex-row md:flex-col items-center gap-4 md:gap-5 group w-full text-left md:text-center
            backdrop-blur-md
          `}
        >
          <div className={`
            w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full ${theme.bg} 
            flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner
            border-4 border-white
          `}>
            <div className={theme.text}>
              <Sparkles size={24} className="animate-pulse" />
            </div>
          </div>
          <div className="flex-1 md:w-full">
            <h2 className={`text-base md:text-xl font-black ${theme.text} leading-tight tracking-tighter`}>
              ¿Cómo está el bebé?
            </h2>
            <p className={`${theme.text} opacity-40 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-1`}>
              Experiencia Inmersiva • {formattedCalculatedWeek}
            </p>
          </div>
          <div className="md:hidden opacity-20"><ChevronRight size={18} /></div>
        </motion.button>
      </Tilt3DCard>

      {/* IMMERSIVE 3D VISUALIZER FULL SCREEN OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 overflow-hidden animate-fade-in select-none">
          {/* Injecting range input thumb color styles based on current child theme */}
          <style dangerouslySetInnerHTML={{ __html: `
            .custom-range-input::-webkit-slider-thumb {
              background: ${theme.hex} !important;
              border: 2.5px solid #fff !important;
              border-radius: 9999px !important;
              width: 22px !important;
              height: 22px !important;
              appearance: none !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              cursor: grab;
              transition: transform 0.1s ease;
            }
            .custom-range-input::-webkit-slider-thumb:active {
              cursor: grabbing;
              transform: scale(1.2);
            }
            .custom-range-input::-moz-range-thumb {
              background: ${theme.hex} !important;
              border: 2.5px solid #fff !important;
              border-radius: 9999px !important;
              width: 22px !important;
              height: 22px !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              cursor: grab;
              transition: transform 0.1s ease;
            }
            .custom-range-input::-moz-range-thumb:active {
              cursor: grabbing;
              transform: scale(1.2);
            }
          `}} />

          {/* Main App Canvas Container (Responsive Smartphone-ratio Mock) */}
          <div 
            style={getDynamicModalBg()}
            className="w-full h-full md:w-[390px] md:h-[844px] md:max-h-[92vh] rounded-none md:rounded-[3.2rem] md:border-[10px] md:border-neutral-900 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] relative flex flex-col justify-between overflow-hidden transition-all duration-300 bg-[#07080d]"
          >
            {/* Dynamic Island / Notch Mock for Desktop */}
            <div className="hidden md:block absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-neutral-900 rounded-full z-45 shadow-inner border border-neutral-800/40 pointer-events-none" />

            {/* Top Header */}
            <div className="absolute top-0 left-0 right-0 pt-8 md:pt-12 pb-6 px-6 flex items-center justify-between z-30 select-none bg-gradient-to-b from-black/85 to-transparent">
              {/* Back Button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl shrink-0"
              >
                <ChevronLeft size={22} className="stroke-[2.5]" />
              </button>

              <div className="flex flex-col items-center select-none text-center">
                <span className="text-[10px] font-black tracking-[0.2em] text-white/50 uppercase leading-none mb-1">
                  Desarrollo del Bebé
                </span>
                <span className={`font-outfit font-black text-xs uppercase tracking-widest`} style={{ color: theme.hex }}>
                  Semana {Math.floor(activeWeek)}
                </span>
              </div>

              <div className="w-11 h-11" />
            </div>

            {/* Tabs for Pregnancy Advice */}
            <div className="absolute top-20 md:top-24 left-0 right-0 px-6 z-30 flex items-center gap-1 justify-center select-none">
              {[
                { id: "baby", label: "👶 Bebé" },
                { id: "health", label: "🤰 Mamá" },
                { id: "love", label: "💖 Pareja" },
                { id: "todo", label: "✅ Tareas" }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    activeTab === t.id
                      ? "bg-white text-black border-white shadow-md scale-105"
                      : "bg-black/35 text-white/60 border-white/10 hover:bg-black/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Immersive 3D Visual Content (fills 100% of background) */}
            {activeTab === "baby" ? (
              <div ref={panContainerRef} className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-auto">
                {/* Drag-to-pan Background Image */}
                <motion.img 
                  key={roundedWeek}
                  drag="x"
                  dragConstraints={panContainerRef}
                  dragElastic={0.08}
                  dragMomentum={true}
                  src={currentWeekData.image} 
                  alt={`Feto semana ${roundedWeek}`}
                  className={`h-full max-w-none object-cover select-none cursor-grab active:cursor-grabbing transition-opacity duration-300 absolute ${
                    isChanging ? "opacity-0 blur-md" : "opacity-100 blur-0"
                  }`}
                  style={{
                    width: "160%",
                    left: "-30%",
                    objectPosition: "center 38%",
                    filter: "brightness(0.85) contrast(1.05)"
                  }}
                />
                {/* Bottom and Top gradients for visual blending */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-transparent to-black/55 pointer-events-none z-10" />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full z-0 flex flex-col justify-center px-6 pt-32 pb-44 overflow-y-auto pointer-events-auto bg-[#07080d]/90">
                {/* Content Card */}
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 text-left space-y-6 shadow-2xl flex-1 flex flex-col justify-center min-h-[300px]"
                  style={{ borderLeftColor: theme.hex, borderLeftWidth: "4px" }}
                >
                  {activeTab === "health" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl"><Sparkles size={22} /></div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Salud y Nutrición</h3>
                      </div>
                      <p className="text-gray-200 font-medium text-xs leading-relaxed">
                        {PREGNANCY_ADVICE[roundedWeek]?.health || "Mantén hábitos saludables y consulta a tu obstetra ante cualquier duda."}
                      </p>
                    </div>
                  )}

                  {activeTab === "love" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-pink-500/10 text-pink-400 rounded-2xl"><Heart size={22} className="text-pink-400" /></div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Conexión y Pareja</h3>
                      </div>
                      <p className="text-gray-200 font-medium text-xs leading-relaxed">
                        {PREGNANCY_ADVICE[roundedWeek]?.love || "El apoyo mutuo es fundamental en esta etapa. Compartan momentos juntos."}
                      </p>
                    </div>
                  )}

                  {activeTab === "todo" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl"><CheckCircle size={22} className="text-sky-400" /></div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Pendientes Semanales</h3>
                      </div>
                      <ul className="space-y-3">
                        {(PREGNANCY_ADVICE[roundedWeek]?.todo || ["Seguir con tus citas de control"]).map((todoItem, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-200 font-medium">
                            <span className="text-[10px] mt-0.5" style={{ color: theme.hex }}>✦</span>
                            <span>{todoItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {/* INFORMATION OVERLAYS */}
            {activeTab === "baby" && (
              <div className="absolute bottom-[220px] left-6 right-20 z-20 pointer-events-none">
                <AnimatePresence mode="wait">
                  {activeOverlay === "ruler" && (
                    <motion.div
                      key="ruler-overlay"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="max-w-[280px] bg-black/85 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-5 text-left shadow-2xl pointer-events-auto"
                      style={{ borderLeftColor: theme.hex, borderLeftWidth: "3px" }}
                    >
                      <span className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: theme.hex }}>
                        Comparativa de Tamaño
                      </span>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl select-none">{currentWeekData.emoji}</span>
                        <span className="font-outfit font-black text-sm text-white uppercase tracking-tight">
                          {currentWeekData.fruit}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-200 font-medium leading-relaxed">
                        Tu bebé mide aproximadamente lo mismo que un/a <strong className="text-white font-bold">{currentWeekData.fruit.toLowerCase()}</strong> esta semana.
                      </p>
                    </motion.div>
                  )}

                  {activeOverlay === "info" && (
                    <motion.div
                      key="info-overlay"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="max-w-[280px] bg-black/85 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-5 text-left shadow-2xl pointer-events-auto"
                      style={{ borderLeftColor: theme.hex, borderLeftWidth: "3px" }}
                    >
                      <div className="text-[8.5px] font-black uppercase tracking-wider mb-1.5" style={{ color: theme.hex }}>
                        🤰🏻 desarrollo esta semana
                      </div>
                      <p className="text-[11.5px] text-gray-200 font-medium leading-relaxed">
                        {currentWeekData.desc}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mode Button Stack & Metrics (Floating Lower Right Sidebar) */}
            {activeTab === "baby" ? (
              <div className="absolute bottom-[220px] right-5 flex flex-col items-center gap-3.5 z-30">
              {/* Length Capsule */}
              <div 
                className="bg-black/45 backdrop-blur-md border border-white/10 rounded-2xl py-2.5 w-12 text-center select-none shadow-xl flex flex-col items-center justify-center transition-all duration-300"
                style={{ borderColor: `${theme.hex}25` }}
              >
                <span className="text-[7.5px] font-black uppercase tracking-widest block mb-0.5" style={{ color: theme.hex }}>LONG</span>
                <span className="text-sm font-extrabold text-white leading-none">
                  {currentWeekData.length >= 1 ? Math.round(currentWeekData.length) : currentWeekData.length}
                  <span className="text-[9px] font-bold text-gray-400 block mt-0.5">cm</span>
                </span>
              </div>

              {/* Weight Capsule */}
              <div 
                className="bg-black/45 backdrop-blur-md border border-white/10 rounded-2xl py-2.5 w-12 text-center select-none shadow-xl flex flex-col items-center justify-center transition-all duration-300"
                style={{ borderColor: `${theme.hex}25` }}
              >
                <span className="text-[7.5px] font-black uppercase tracking-widest block mb-0.5" style={{ color: theme.hex }}>PESO</span>
                <span className="text-sm font-extrabold text-white leading-none">
                  {currentWeekData.weight >= 1 ? Math.round(currentWeekData.weight) : currentWeekData.weight}
                  <span className="text-[9px] font-bold text-gray-400 block mt-0.5">g</span>
                </span>
              </div>

              <div className="w-8 h-px bg-white/10 my-0.5" />

              {/* Fruit Ruler Button */}
              <button 
                onClick={() => toggleOverlay("ruler")}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                  activeOverlay === "ruler" 
                    ? "text-white scale-110 shadow-lg" 
                    : "bg-black/35 backdrop-blur-md text-gray-300 border border-white/10 hover:bg-black/80 hover:text-white"
                }`}
                style={{ 
                  backgroundColor: activeOverlay === "ruler" ? theme.hex : undefined,
                  boxShadow: activeOverlay === "ruler" ? `0 0 15px ${theme.hex}50` : undefined
                }}
                title="Comparativa de tamaño"
              >
                <Ruler size={19} className="stroke-[2]" />
              </button>

              {/* Info Text Toggle Button */}
              <button 
                onClick={() => toggleOverlay("info")}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                  activeOverlay === "info" 
                    ? "text-white scale-110 shadow-lg" 
                    : "bg-black/35 backdrop-blur-md text-gray-300 border border-white/10 hover:bg-black/80 hover:text-white"
                }`}
                style={{ 
                  backgroundColor: activeOverlay === "info" ? theme.hex : undefined,
                  boxShadow: activeOverlay === "info" ? `0 0 15px ${theme.hex}50` : undefined
                }}
                title="Detalles de desarrollo"
              >
                <Info size={19} className="stroke-[2]" />
              </button>
            </div>
            ) : null}

            {/* Bottom Panel (Transparent container for Weeks Slider & Capsule) */}
            <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 flex flex-col gap-4 z-20 bg-gradient-to-t from-black/75 via-black/40 to-transparent">
              {/* Weeks Navigation / Progress slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                  <span>Semana 1</span>
                  <span className="font-black" style={{ color: theme.hex }}>SEMANA SELECCIONADA: {Math.floor(activeWeek)}</span>
                  <span>Semana 42</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="42"
                  step="1"
                  value={Math.floor(activeWeek)}
                  onChange={(e) => setActiveWeek(parseInt(e.target.value))}
                  className="w-full cursor-pointer h-2 bg-white/10 rounded-lg appearance-none outline-none custom-range-input"
                  style={{
                    background: `linear-gradient(to right, ${theme.hex} 0%, ${theme.hex} ${((Math.floor(activeWeek) - 1) / 41) * 100}%, rgba(255,255,255,0.1) ${((Math.floor(activeWeek) - 1) / 41) * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-[8px] text-gray-500 px-1 font-black uppercase tracking-wider">
                  <span>Embrión</span>
                  <span>Mitad Gestación</span>
                  <span>A Término</span>
                </div>
              </div>

              {/* Week Display (Moved below the slider, at the very bottom of the screen) */}
              <div className="flex items-center justify-center gap-4 mt-2">
                {/* Left navigation arrow */}
                <button
                  disabled={Math.floor(activeWeek) <= 1}
                  onClick={() => setActiveWeek(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-full bg-black/35 border border-white/10 flex items-center justify-center text-white hover:bg-black/85 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Week Capsule */}
                <div 
                  className="flex items-baseline justify-center gap-1.5 bg-black/45 backdrop-blur-xl border border-white/10 py-2.5 px-7 rounded-full select-none shadow-2xl min-w-[140px]"
                  style={{ borderColor: `${theme.hex}40` }}
                >
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: theme.hex }}>SEMANA</span>
                  <span className="text-3xl font-extrabold text-white leading-none">{Math.floor(activeWeek)}</span>
                  {decimalDays > 0 && (
                    <span className="text-sm font-semibold text-rose-200 ml-0.5">+{decimalDays}d</span>
                  )}
                </div>

                {/* Right navigation arrow */}
                <button
                  disabled={Math.floor(activeWeek) >= 42}
                  onClick={() => setActiveWeek(prev => Math.min(42, prev + 1))}
                  className="w-10 h-10 rounded-full bg-black/35 border border-white/10 flex items-center justify-center text-white hover:bg-black/85 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
