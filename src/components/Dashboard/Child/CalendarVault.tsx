"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Calendar as CalendarIcon, 
  Download, Loader2, Menu, Home, User, LogOut,
  X, Eye, Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import dynamic from "next/dynamic";

const PregnancyCalendar = dynamic(() => import("@/components/Dashboard/Child/Pregnancy/PregnancyCalendar"), {
  loading: () => (
    <div className="fixed inset-0 z-[2000] bg-white flex items-center justify-center">
      <Loader2 className="animate-spin text-taupe/20" size={48} />
    </div>
  ),
});

interface CalendarVaultProps {
  childId: string;
}

export default function CalendarVault({ childId }: CalendarVaultProps) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [showMasterMenu, setShowMasterMenu] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [autoDownloadId, setAutoDownloadId] = useState<string | null>(null);

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    
    async function loadData() {
      console.log("Cargando Bóveda para ChildID:", childId);
      const { data: childData } = await supabase.from("children").select("*").eq("id", childId).single();
      if (childData) setChild(childData);

      const { data: cals, error } = await supabase.from("pregnancy_calendars")
        .select("id,title,display_name,created_at,layout_config")
        .eq("child_id", childId)
        .order('created_at', { ascending: false });
      
      if (error) console.error("Error cargando calendarios:", error);
      if (cals) {
        console.log("Calendarios encontrados:", cals.length);
        setCalendars(cals);
      }
      setLoading(false);
    }
    loadData();
    return () => window.removeEventListener('resize', syncViewport);
  }, [childId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading && !child) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-texture">
        <Loader2 className="animate-spin text-black/20" size={48} />
      </div>
    );
  }

  if (!child) return null;
  const theme = themePalettes[child.theme_color || 'neutral'] || themePalettes.neutral;

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture transition-colors duration-500 pb-20`}>
      <header className="px-4 md:px-6 py-4 flex items-center justify-between bg-white/60 backdrop-blur-xl sticky top-0 z-[100] shadow-sm border-b border-white/50">
        <div className="flex items-center gap-2 md:gap-4 z-[110]">
          <button 
            onClick={() => router.push(`/dashboard/child/${childId}`)} 
            className={`p-2.5 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all border`}
            style={{ borderColor: `${theme.hex}1a`, color: theme.hex }}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMasterMenu(!showMasterMenu)} 
              className={`p-2.5 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all border`}
              style={{ borderColor: `${theme.hex}1a`, color: theme.hex }}
            >
              <Menu size={22} />
            </button>
            <AnimatePresence>
              {showMasterMenu && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMasterMenu(false)} className="fixed inset-0 z-[-1]" />
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-16 left-0 w-64 bg-white rounded-[2rem] shadow-2xl border p-3 overflow-hidden" style={{ borderColor: `${theme.hex}1a` }}>
                    <div className="flex flex-col gap-1">
                       <button 
                         onClick={() => window.location.href = '/dashboard'} 
                         onMouseEnter={() => setHoveredButton('babies')}
                         onMouseLeave={() => setHoveredButton(null)}
                         style={{ 
                           backgroundColor: hoveredButton === 'babies' ? `${theme.hex}1a` : 'transparent',
                           color: theme.hex
                         }}
                         className="w-full p-4 rounded-2xl flex items-center gap-4 transition-colors group"
                       >
                         <div 
                           className="p-2 rounded-xl transition-colors"
                           style={{ 
                             backgroundColor: hoveredButton === 'babies' ? theme.hex : `${theme.hex}1a`,
                             color: hoveredButton === 'babies' ? '#fff' : theme.hex
                           }}
                         >
                           <Home size={18}/>
                         </div>
                         <span className="font-black uppercase tracking-widest text-[10px]">Mis Bebés</span>
                       </button>
                       
                       <button 
                         onClick={() => router.push('/dashboard?view=profile')}
                         onMouseEnter={() => setHoveredButton('profile')}
                         onMouseLeave={() => setHoveredButton(null)}
                         style={{ 
                           backgroundColor: hoveredButton === 'profile' ? `${theme.hex}1a` : 'transparent',
                           color: theme.hex
                         }}
                         className="w-full p-4 rounded-2xl flex items-center gap-4 transition-colors group"
                       >
                         <div 
                           className="p-2 rounded-xl transition-colors"
                           style={{ 
                             backgroundColor: hoveredButton === 'profile' ? theme.hex : `${theme.hex}1a`,
                             color: hoveredButton === 'profile' ? '#fff' : theme.hex
                           }}
                         >
                           <User size={18}/>
                         </div>
                         <span className="font-black uppercase tracking-widest text-[10px]">Mi Perfil</span>
                       </button>
                       
                       <div className="h-px my-1 mx-4" style={{ backgroundColor: `${theme.hex}1a` }} />
                       
                       <button onClick={handleLogout} className="w-full p-4 hover:bg-red-50 rounded-2xl flex items-center gap-4 text-red-500 transition-colors group"><div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors"><LogOut size={18}/></div><span className="font-black uppercase tracking-widest text-[10px]">Cerrar Sesión</span></button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3">
          <img src="/logo.png" className="w-8 h-8 md:w-10 md:h-10 object-contain opacity-20" />
          <span className="hidden sm:inline font-outfit font-black tracking-[0.4em] uppercase text-xs" style={{ color: `${theme.hex}33` }}>TinyWorld Vault</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 z-[110]">
           <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg" style={{ backgroundColor: theme.hex, color: theme.textActive }}>Bóveda</span>
        </div>
      </header>

      <main className="p-6 md:p-16 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
           <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic" style={{ color: theme.hex }}>Bóveda de Recuerdos</h2>
           <p className="text-xs md:text-lg font-black uppercase tracking-[0.2em] mt-2 italic" style={{ color: `${theme.hex}66` }}>Todos tus calendarios finalizados en un solo lugar.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {calendars.length === 0 && (
            <div className="col-span-full py-32 bg-white/40 rounded-[3rem] border-4 border-dashed flex flex-col items-center justify-center text-center" style={{ borderColor: `${theme.hex}26` }}>
              <CalendarIcon size={64} className="mb-6" style={{ color: `${theme.hex}26` }} />
              <p className="text-sm md:text-xl font-black uppercase tracking-widest" style={{ color: `${theme.hex}66` }}>No hay calendarios en la bóveda</p>
              <button 
                onClick={() => router.push(`/dashboard/child/${childId}/pregnancy`)} 
                className="mt-8 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-105"
                style={{ backgroundColor: theme.hex, color: theme.textActive }}
              >
                Crear mi primer calendario
              </button>
            </div>
          )}
          {calendars.map((cal) => (
            <motion.div 
              key={cal.id}
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCalendarId(cal.id)}
              className="relative w-[240px] md:w-[280px] aspect-[3/4] mx-auto cursor-pointer group flex items-center justify-center bg-white/10 backdrop-blur-md rounded-[2rem] border-2 border-white/30 shadow-xl overflow-hidden"
            >
               {cal.layout_config?.thumbnail_url ? (
                 <img 
                   src={cal.layout_config.thumbnail_url} 
                   alt={cal.title}
                   className="w-full h-full object-cover transition-all duration-500"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white/20">
                    <div className="scale-[0.14] md:scale-[0.16] origin-center pointer-events-none drop-shadow-2xl">
                          <PregnancyCalendar
                            childId={childId}
                            calendarId={cal.id}
                            theme={theme}
                            onBack={() => {}}
                            readOnly={true}
                            variant="thumbnail"
                          />
                    </div>
                 </div>
               )}
            </motion.div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {selectedCalendarId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-white no-export"
          >
            <PregnancyCalendar
              childId={childId}
              calendarId={selectedCalendarId}
              theme={theme}
              onBack={() => { setSelectedCalendarId(null); setAutoDownloadId(null); }}
              readOnly={true}
              autoDownload={autoDownloadId === selectedCalendarId}
              onAutoDownloadComplete={() => { setAutoDownloadId(null); setSelectedCalendarId(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
