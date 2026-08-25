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

export default function DesktopHome() {
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
    // Generar stickers aleatorios en cliente para evitar hydration mismatch
    const generateStickers = () => {
      const newStickers = [];
      
      // ZONAS SEGURAS (x, y en porcentajes) para no tocar nunca el centro ni los textos
      const zones = [
        // === SECTION 0 (HERO 0-100vh) - Exactamente las 7 zonas de los círculos azules ===
        { sec: 0, t: [5, 15], l: [10, 25], leftSide: true },
        { sec: 0, t: [5, 12], l: [45, 55], leftSide: Math.random() > 0.5 },
        { sec: 0, t: [15, 25], l: [75, 90], leftSide: false },
        { sec: 0, t: [35, 45], l: [5, 15], leftSide: true },
        { sec: 0, t: [35, 45], l: [80, 95], leftSide: false },
        { sec: 0, t: [70, 80], l: [15, 25], leftSide: true },
        { sec: 0, t: [70, 80], l: [70, 85], leftSide: false },

        // === SECTION 1 (100-200vh) ===
        { sec: 1, t: [110, 120], l: [5, 15], leftSide: true },
        { sec: 1, t: [140, 150], l: [2, 10], leftSide: true },
        { sec: 1, t: [180, 190], l: [10, 20], leftSide: true },
        { sec: 1, t: [110, 120], l: [75, 85], leftSide: false },
        { sec: 1, t: [140, 150], l: [85, 95], leftSide: false },
        { sec: 1, t: [180, 190], l: [75, 85], leftSide: false },

        // === SECTION 2 (200-300vh) ===
        { sec: 2, t: [210, 220], l: [10, 20], leftSide: true },
        { sec: 2, t: [240, 250], l: [5, 15], leftSide: true },
        { sec: 2, t: [280, 290], l: [15, 25], leftSide: true },
        { sec: 2, t: [210, 220], l: [75, 85], leftSide: false },
        { sec: 2, t: [240, 250], l: [85, 95], leftSide: false },
        { sec: 2, t: [280, 290], l: [70, 85], leftSide: false }
      ];
      
      // Shuffle images to never repeat early
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

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const heroPointerEvents = useTransform(scrollYProgress, [0, 0.15], ["auto", "none"]);

  const leftX = useTransform(scrollYProgress, [0.2, 0.5], [-200, 0]);
  const rightX = useTransform(scrollYProgress, [0.2, 0.5], [200, 0]);
  const imageOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

  return (
    <div ref={containerRef} className="relative min-h-[300vh] selection:bg-gold/30">


      
      {/* Toggle Sidebar */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <button 
          onClick={() => {
            setIsSidebarOpen(true);
            playActionSnap();
          }}
          className="p-3 rounded-full bg-white/50 backdrop-blur-md shadow-lg border border-taupe/10 hover:scale-110 transition-transform text-taupe"
        >
          <Menu size={20} />
        </button>
      </div>

      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: isSidebarOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-72 glass-panel z-[60] p-8 flex flex-col shadow-2xl"
      >
        <button 
          onClick={() => {
            setIsSidebarOpen(false);
            playActionSnap();
          }}
          className="self-end p-2 hover:bg-beige/50 rounded-full mb-8 text-taupe"
        >
          <X size={24} />
        </button>
        <h3 className="font-outfit text-xl mb-10 text-taupe border-b border-taupe/10 pb-2">Acceso</h3>
        <div className="space-y-6">
          <Link href="/login" onClick={() => playSoftPop()} className="flex items-center gap-4 w-full p-4 rounded-xl border border-taupe/20 hover:border-gold hover:bg-white transition-all group">
            <LogIn size={20} className="group-hover:text-gold" />
            <div className="text-left">
              <p className="font-semibold text-sm">Soy Papá/Mamá</p>
              <p className="text-xs opacity-60">Iniciar sesión</p>
            </div>
          </Link>
          <button 
            onClick={() => {
              setIsSidebarOpen(false);
              setShowCodeModal(true);
              playActionSnap();
            }} 
            className="flex items-center gap-4 w-full p-4 rounded-xl border border-taupe/20 hover:border-gold hover:bg-white transition-all group text-left cursor-pointer"
          >
            <Lock size={20} className="group-hover:text-gold" />
            <div>
              <p className="font-semibold text-sm">Tengo un Código</p>
              <p className="text-xs opacity-60">Acceso familiar</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Stickers Cortina - En capa superior z-40 para que no se oculten */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {randomStickers.map((sticker) => (
          <StickerItem 
            key={sticker.id} 
            sticker={sticker} 
            scrollYProgress={scrollYProgress} 
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6 z-30">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ opacity: heroOpacity, scale: heroScale, pointerEvents: heroPointerEvents }}
          className="max-w-4xl"
        >
          <div className="mb-2 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="relative w-64 h-64 md:w-80 md:h-80 mx-auto z-10 neon-logo-yellow -mb-24"
            >
              <Image 
                src="/logo.png" 
                alt="TinyWorld Logo" 
                fill
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-contain drop-shadow-2xl"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </motion.div>
          </div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="text-7xl md:text-[11rem] font-outfit font-bold title-glow mb-2 tracking-tightest leading-none transition-colors relative z-20"
          >
            TinyWorld
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="text-2xl md:text-3xl neon-text-white font-light max-w-2xl mx-auto leading-relaxed transition-colors"
          >
            "Every Memory Begins Small." <br />
            El diario interactivo de su primer gran viaje.
          </motion.p>
        </motion.div>

        <motion.div 
          style={{ opacity: heroOpacity }}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute bottom-6 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-taupe/40 font-bold">Scroll</span>
          <div className="w-[1px] h-8 bg-taupe/20 rounded-full" />
        </motion.div>
      </section>

      {/* Sección 2 con Fundido de Líneas de Cuaderno */}
      <section className="relative min-h-[100vh] flex items-center justify-center py-32 z-30">
        {/* Fondo de Cuaderno con máscara de degradado para fundido suave */}
        <div className="absolute inset-0 notebook-lines opacity-60 dark:opacity-20 fade-mask-y" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <motion.div 
              style={{ x: leftX, opacity: imageOpacity }}
              className="relative aspect-[4/5] bg-white p-4 shadow-2xl rotate-[-3deg] rounded-sm group hover:rotate-0 transition-transform duration-500"
            >
              <div className="w-full h-full bg-beige/30 flex items-center justify-center overflow-hidden">
                <Camera size={64} className="text-taupe/20" />
              </div>
              <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-24 h-10 bg-gold/40 backdrop-blur-sm -rotate-2" />
              <p className="mt-4 font-outfit text-center text-taupe/60 italic">Primeras sonrisas...</p>
            </motion.div>
            <motion.div 
              style={{ x: rightX, opacity: imageOpacity }}
              className="space-y-8"
            >
              <h2 className="text-5xl md:text-6xl font-outfit font-bold text-taupe dark:neon-text-taupe leading-tight transition-colors">
                Más que fotos, <br />
                <span className="text-sage dark:neon-text-sage italic underline decoration-gold/30">un libro que respira.</span>
              </h2>
              <p className="text-xl text-taupe/80 leading-relaxed max-w-md">
                En TinyWorld, cada recuerdo se siente físico. Arrastra stickers, guarda audios de sus primeras palabras y crea una cápsula del tiempo para el futuro.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-4 bg-sage/10 rounded-full text-sage"><Clock size={24} /></div>
                  <span className="text-base font-semibold">Cápsula del Tiempo</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-4 bg-gold/10 rounded-full text-gold"><Music size={24} /></div>
                  <span className="text-base font-semibold">Memoria Auditiva</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="h-screen flex items-center justify-center text-center px-6 relative z-30">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl"
        >
          <h2 className="text-5xl font-outfit font-bold text-taupe dark:neon-text-taupe mb-8 transition-colors">¿Listo para empezar la historia?</h2>
          <p className="text-xl mb-12 text-taupe/70 dark:text-taupe/90 dark:neon-text-taupe italic transition-colors">"No recordamos días, recordamos momentos."</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => playSoftPop()}
              className="px-10 py-5 bg-sage text-white rounded-full font-bold text-lg shadow-lg shadow-sage/30 hover:bg-sage/90 transition-all hover:scale-105 active:scale-95"
            >
              Crear Nuevo Diario
            </button>
            <button 
              onClick={() => {
                setShowCodeModal(true);
                playActionSnap();
              }}
              className="px-10 py-5 border-2 border-taupe/20 text-taupe rounded-full font-bold text-lg hover:bg-white transition-all cursor-pointer"
            >
              Ver Demo de Invitado
            </button>
          </div>
        </motion.div>
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
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative border border-taupe/10 text-center z-10 overflow-hidden"
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

              <h3 className="font-outfit font-black text-3xl text-taupe mb-2">
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
                    className="w-full px-6 py-4 bg-taupe/5 border-2 border-dashed border-taupe/20 rounded-2xl outline-none font-outfit text-lg font-black text-center tracking-[0.2em] text-taupe focus:border-gold focus:bg-white transition-all uppercase"
                  />
                  {codeError && (
                    <p className="text-red-500 text-xs font-bold mt-2">{codeError}</p>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isCheckingCode}
                  onClick={() => playSoftPop()}
                  className="w-full py-4 bg-taupe text-white rounded-2xl font-bold hover:bg-taupe/90 active:scale-98 transition-all text-sm uppercase tracking-widest shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCheckingCode ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={18} className="text-gold animate-pulse" />
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

// Subcomponente para animar stickers de forma dinámica según la sección
function StickerItem({ sticker, scrollYProgress }: any) {
  const isHero = sticker.section === 0;
  const isSec1 = sticker.section === 1;
  const isSec2 = sticker.section === 2;

  // Animaciones de entrada/salida lateral fluidas
  const xMove = sticker.isLeft ? -400 : 400; // Distancia para salir de pantalla
  
  // Dominios de scroll mapeados para cada sección
  const domain = isHero ? [0, 0.15, 0.3, 1] : 
                 isSec1 ? [0, 0.25, 0.4, 0.55, 0.7, 1] : 
                          [0, 0.6, 0.8, 1];
                          
  // En Hero: inician en 0, y salen disparados hacia los lados al bajar (xMove)
  // En Sec1: inician afuera (xMove), entran (0), y vuelven a salir (xMove)
  // En Sec2: inician afuera (xMove) y entran (0)
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
      animate={{ scale: 1, opacity: isHero ? 1 : 0 }} // Solo los hero son visibles al cargar
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
        animate={{ 
          y: [0, -25, 0], 
          x: [0, sticker.id % 2 === 0 ? 12 : -12, 0],
          rotate: [0, sticker.id % 2 === 0 ? 8 : -8, sticker.id % 2 === 0 ? -8 : 8, 0] 
        }}
        transition={{ 
          duration: 4 + (sticker.id % 4) * 0.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative w-40 h-40 md:w-56 md:h-56 drop-shadow-2xl hover:scale-110 transition-transform duration-300"
      >
        <Image 
          src={sticker.src} 
          alt="Sticker" 
          fill 
          className="object-contain transition-all duration-700"
          sizes="(max-width: 768px) 128px, 192px"
        />
      </motion.div>
    </motion.div>
  );
}
