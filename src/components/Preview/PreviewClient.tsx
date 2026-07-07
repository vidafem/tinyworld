"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book as BookIcon, Heart, Share2, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

import PreviewDashboard from "./PreviewDashboard";
import { themePalettes } from "@/lib/themes";

interface PreviewClientProps {
  childId: string;
}

export default function PreviewClient({ childId }: PreviewClientProps) {
  const [child, setChild] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChild() {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("id", childId)
        .single();
      
      if (data) setChild(data);
      setLoading(false);
    }
    fetchChild();
  }, [childId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-black/20" size={40} />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-outfit font-bold mb-4" style={{ color: '#4A4238' }}>Álbum no encontrado</h1>
        <p style={{ color: 'rgba(74,66,56,0.6)' }}>El enlace podría haber expirado o ser incorrecto.</p>
      </div>
    );
  }

  if (isOpen) {
    return (
      <PreviewDashboard 
        childId={childId} 
        initialChild={child} 
        onClose={() => setIsOpen(false)} 
      />
    );
  }

  const theme = child ? themePalettes[child.theme_color] || themePalettes.neutral : themePalettes.neutral;

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture overflow-hidden flex items-center justify-center p-4 md:p-12`}>
      <motion.div
        key="cover"
        initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        className="relative w-full max-w-sm aspect-[3/4] group cursor-pointer perspective-1000"
        onClick={() => setIsOpen(true)}
      >
        {/* Tapa del Libro */}
        <div className="absolute inset-0 bg-white rounded-r-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-between p-12 text-center" style={{ borderLeft: `12px solid ${theme.hex}33` }}>
          <div className="w-full">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-inner mb-4" style={{ backgroundColor: `${theme.hex}0d` }}>
                <BookIcon size={32} style={{ color: theme.hex }} />
              </div>
              <h2 className="text-xs uppercase tracking-[0.4em] font-bold" style={{ color: `${theme.hex}80` }}>Libro de Vida</h2>
            </motion.div>
            
            <h1 className="text-5xl font-outfit font-black mb-2 tracking-tighter" style={{ color: theme.hex }}>
              {child.nickname || child.name}
            </h1>
            <div className="w-12 h-1 mx-auto rounded-full" style={{ backgroundColor: `${theme.hex}4d` }} />
          </div>

          <div className="space-y-6">
            <p className="italic font-light" style={{ color: `${theme.hex}99` }}>"Cada pequeño paso es un gran tesoro."</p>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-widest"
              style={{ color: theme.hex }}
            >
              Abrir Álbum <ChevronRight size={18} />
            </motion.div>
          </div>
          
          {/* Textura de papel en la tapa */}
          <div className="absolute inset-0 bg-texture opacity-30 pointer-events-none" />
        </div>
      </motion.div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #B8997A20;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
