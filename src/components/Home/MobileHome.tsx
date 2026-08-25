"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Lock, LogIn, Menu, X, Heart, Camera, Clock, Music, Sun, Star, Loader2, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { playSoftPop, playActionSnap } from "@/lib/pageSound";

const TOTAL_STICKERS = 20;

export default function MobileHome() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [randomStickers, setRandomStickers] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [guestCode, setGuestCode] = useState("");
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState("");

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestCode.trim()) return;
    setIsCheckingCode(true);
    setCodeError("");

    try {
      const { data, error } = await supabase
        .from("children")
        .select("id")
        .eq("access_code", guestCode.trim().toUpperCase())
        .single();

      if (error || !data) {
        setCodeError("Código no válido. Inténtalo de nuevo.");
      } else {
        setIsSidebarOpen(false);
        setShowCodeModal(false);
        router.push(`/preview/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      setCodeError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsCheckingCode(false);
    }
  };

  useEffect(() => {
    // Generar stickers aleatorios en cliente
    const generateStickers = () => {
      const newStickers = [];
      const zones = [
        // MARCO HERO (Mobile 0-100vh) - Reducidos a 3 clave para optimizar rendimiento móvil
        { sec: 0, t: [5, 12], l: [2, 10], leftSide: true },
        { sec: 0, t: [20, 28], l: [75, 85], leftSide: false },
        { sec: 0, t: [45, 55], l: [4, 12], leftSide: true },
        
        // Seccion 2 (100-200vh) - Reducidos a 2
        { sec: 1, t: [120, 135], l: [75, 85], leftSide: false },
        { sec: 1, t: [160, 175], l: [4, 12], leftSide: true },
        
        // Seccion 3 (200-300vh) - Reducidos a 2
        { sec: 2, t: [215, 230], l: [75, 85], leftSide: false },
        { sec: 2, t: [255, 270], l: [4, 12], leftSide: true }
      ];
      
      const stickerImages = Array.from({length: 20}, (_, i) => i + 1).sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        const randomTop = Math.floor(Math.random() * (zone.t[1] - zone.t[0] + 1)) + zone.t[0];
        const randomLeft = Math.floor(Math.random() * (zone.l[1] - zone.l[0] + 1)) + zone.l[0];
        const stickerNum = stickerImages[i % 20];
        
        newStickers.push({
          id: i,
          src: `/stickers/st${stickerNum}.png`,
          top: `${randomTop}vh`,
          left: `${randomLeft}vw`,
          section: zone.sec,
          isLeft: zone.leftSide,
          delay: 0.1 + (Math.random() * 0.5)
        });
      }
      setRandomStickers(newStickers);
    };

    generateStickers();
  }, []);



  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Animaciones optimizadas para móvil
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.9]);

  // Contenido de revelado
  const revealY = useTransform(scrollYProgress, [0.15, 0.3], [100, 0]);
  const revealOpacity = useTransform(scrollYProgress, [0.15, 0.3], [0, 1]);

  return (
    <div ref={containerRef} className="relative min-h-[250vh] selection:bg-gold/30">


      
      {/* Botones Móvil: Menú */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <button 
          onClick={() => {
            setIsSidebarOpen(true);
            playActionSnap();
          }}
          className="p-3 bg-white/50 backdrop-blur-md rounded-full shadow-sm text-taupe transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar Móvil */}
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: isSidebarOpen ? 0 : "100%" }}
        className="fixed inset-0 z-[70] flex justify-end"
      >
        <div className="w-4/5 h-full glass-panel p-6 flex flex-col shadow-2xl">
          <button 
            onClick={() => {
              setIsSidebarOpen(false);
              playActionSnap();
            }}
            className="self-end p-2 bg-beige/30 rounded-full mb-10 text-taupe"
          >
            <X size={24} />
          </button>
          <h3 className="font-outfit text-2xl mb-8 text-taupe">TinyWorld</h3>
          <div className="space-y-4">
            <Link href="/login" onClick={() => playSoftPop()} className="flex items-center gap-4 w-full p-5 rounded-2xl bg-white/50 border border-taupe/10">
              <LogIn size={24} className="text-sage" />
              <div className="text-left">
                <p className="font-bold text-base">Iniciar Sesión</p>
                <p className="text-xs opacity-50">Acceso padres</p>
              </div>
            </Link>
            <button 
              onClick={() => {
                setIsSidebarOpen(false);
                setShowCodeModal(true);
                playActionSnap();
              }}
              className="flex items-center gap-4 w-full p-5 rounded-2xl bg-white/50 border border-taupe/10 text-left cursor-pointer"
            >
              <Lock size={24} className="text-gold" />
              <div>
                <p className="font-bold text-base">Ingresar Código</p>
                <p className="text-xs opacity-50">Acceso invitados</p>
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stickers Cortina Móvil - En capa superior z-40 para que no se oculten */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {randomStickers.map((sticker) => (
          <StickerItem 
            key={sticker.id} 
            sticker={sticker} 
            scrollYProgress={scrollYProgress} 
          />
        ))}
      </div>

      {/* Hero Móvil */}
      <section className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6 z-30">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="mb-6 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5 }}
              className="relative w-48 h-48 mx-auto z-10 neon-logo-yellow -mb-16"
            >
              <Image 
                src="/logo.png" 
                alt="Logo" 
                fill
                priority
                sizes="192px"
                className="object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </motion.div>
          </div>

          <h1 className="text-6xl md:text-7xl font-outfit font-bold title-glow mb-2 leading-none tracking-[-0.1em] transition-colors z-20 relative">
            TinyWorld
          </h1>
          <p className="text-lg neon-text-white font-light max-w-xs mx-auto leading-tight transition-colors z-20 relative">
            "Every Memory Begins Small." <br />
            El diario interactivo de su primer gran viaje.
          </p>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 flex flex-col items-center gap-1 opacity-40"
        >
          <span className="text-[8px] uppercase tracking-widest text-taupe font-bold">Scroll</span>
          <div className="w-[1px] h-6 bg-taupe/30 rounded-full" />
        </motion.div>
      </section>

      {/* Sección Reveal Móvil con fundido */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-20 z-30 px-6">
        <div className="absolute inset-0 notebook-lines opacity-60 dark:opacity-20 fade-mask-y" />

        <motion.div 
          style={{ y: revealY, opacity: revealOpacity }}
          className="w-full space-y-12 relative z-10"
        >
          <div className="bg-white p-3 shadow-xl rotate-[-2deg] rounded-sm max-w-xs mx-auto">
            <div className="aspect-square bg-beige/20 flex items-center justify-center">
              <Camera size={48} className="text-taupe/10" />
            </div>
            <p className="mt-3 font-outfit text-sm text-center text-taupe/40 italic">Momentos únicos...</p>
          </div>

          <div className="text-center space-y-6">
            <h2 className="text-4xl font-outfit font-bold text-taupe dark:neon-text-taupe leading-tight transition-colors">
              Un libro <br /> <span className="text-sage dark:neon-text-sage italic underline decoration-gold/20">que respira.</span>
            </h2>
            <p className="text-base text-taupe/70 dark:text-taupe/90 dark:neon-text-taupe leading-relaxed transition-colors">
              En TinyWorld, cada recuerdo es físico. Arrastra stickers y guarda audios de sus primeras risas.
            </p>
            
            <div className="flex flex-col gap-4 items-center">
              <div className="flex items-center gap-3 w-full max-w-xs p-4 bg-white/50 rounded-2xl border border-taupe/5">
                <div className="p-3 bg-sage/10 rounded-full text-sage"><Clock size={20} /></div>
                <span className="text-sm font-bold">Cápsula del Tiempo</span>
              </div>
              <div className="flex items-center gap-3 w-full max-w-xs p-4 bg-white/50 rounded-2xl border border-taupe/5">
                <div className="p-3 bg-gold/10 rounded-full text-gold"><Music size={20} /></div>
                <span className="text-sm font-bold">Memoria Auditiva</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer Móvil */}
      <section className="h-screen flex items-center justify-center text-center px-8 relative z-30">
        <div className="space-y-10">
          <h2 className="text-4xl font-outfit font-bold text-taupe dark:neon-text-taupe transition-colors">¿Empezamos la historia?</h2>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => playSoftPop()}
              className="w-full py-5 bg-sage text-white rounded-2xl font-bold shadow-lg shadow-sage/20"
            >
              Crear Nuevo Diario
            </button>
            <button 
              onClick={() => {
                setShowCodeModal(true);
                playActionSnap();
              }}
              className="w-full py-5 border-2 border-taupe/10 text-taupe rounded-2xl font-bold cursor-pointer"
            >
              Ver Demo
            </button>
          </div>
          <p className="text-sm text-taupe/40 italic">"No recordamos días, recordamos momentos."</p>
        </div>
      </section>

      {/* Modal para Ingresar Código de Acceso */}
      <AnimatePresence>
        {showCodeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCodeModal(false);
                setCodeError("");
                setGuestCode("");
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl relative border border-taupe/10 text-center z-10 overflow-hidden"
            >
              <button 
                onClick={() => {
                  setShowCodeModal(false);
                  setCodeError("");
                  setGuestCode("");
                  playActionSnap();
                }}
                className="absolute top-6 right-6 p-2 hover:bg-taupe/5 rounded-full text-taupe transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6 mt-2">
                <div className="w-16 h-16 bg-gold/10 rounded-full mx-auto flex items-center justify-center shadow-inner">
                  <Lock size={28} className="text-gold" />
                </div>
              </div>

              <h3 className="font-outfit font-black text-2xl text-taupe mb-2">
                Acceso Invitado
              </h3>
              <p className="text-xs text-taupe/50 uppercase tracking-widest font-bold mb-8">
                Ingresa el código único del bebé
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <input 
                    type="text" 
                    value={guestCode}
                    onChange={(e) => setGuestCode(e.target.value)}
                    placeholder="E.g. TW-X8Y9"
                    maxLength={15}
                    className="w-full px-4 py-3.5 bg-taupe/5 border-2 border-dashed border-taupe/20 rounded-2xl outline-none font-outfit text-base font-black text-center tracking-[0.2em] text-taupe focus:border-gold focus:bg-white transition-all uppercase"
                  />
                  {codeError && (
                    <p className="text-red-500 text-xs font-bold mt-2">{codeError}</p>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isCheckingCode}
                  onClick={() => playSoftPop()}
                  className="w-full py-4 bg-taupe text-white rounded-2xl font-bold hover:bg-taupe/90 active:scale-98 transition-all text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCheckingCode ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={16} className="text-gold animate-pulse" />
                      Entrar al Álbum
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponente para evitar el error de "Rules of Hooks" al usar useTransform en un array
function StickerItem({ sticker, scrollYProgress }: any) {
  const isHero = sticker.section === 0;
  const isSec1 = sticker.section === 1;
  const isSec2 = sticker.section === 2;

  // Ajustado a 80px en móvil para evitar que se desborden de la pantalla
  const xMove = sticker.isLeft ? -80 : 80; 
  
  const domain = isHero ? [0, 0.15, 0.3, 1] : 
                 isSec1 ? [0, 0.2, 0.35, 0.45, 0.6, 1] : 
                          [0, 0.5, 0.7, 1];
                          
  const xValues = isHero ? [0, 0, xMove, xMove] :
                  isSec1 ? [xMove, xMove, 0, 0, xMove, xMove] :
                           [xMove, xMove, 0, 0];
                           
  const opacityValues = isHero ? [1, 1, 0, 0] :
                        isSec1 ? [0, 0, 1, 1, 0, 0] :
                                 [0, 0, 1, 1];

  const xTransform = useTransform(scrollYProgress, domain, xValues);
  const opacityTransform = useTransform(scrollYProgress, domain, opacityValues);

  return (
    <motion.div 
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: isHero ? 1 : 0 }}
      transition={{ duration: 1.5, delay: sticker.delay }}
      style={{
        position: "absolute",
        top: sticker.top,
        left: sticker.left,
        x: xTransform,
        opacity: opacityTransform
      }}
    >
      <motion.div
        // Flotación atenuada sólo en Hero para móvil para optimizar drásticamente el uso de CPU/Batería
        animate={isHero ? { 
          y: [0, -8, 0],
          rotate: [0, sticker.id % 2 === 0 ? 3 : -3, 0] 
        } : undefined}
        transition={{ 
          duration: 4.5 + (sticker.id % 4) * 0.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative w-32 h-32 drop-shadow-xl hover:scale-105 transition-transform duration-300"
      >
        <Image 
          src={sticker.src} 
          alt="Sticker" 
          fill 
          className="object-contain transition-all duration-700"
          sizes="96px"
        />
      </motion.div>
    </motion.div>
  );
}
