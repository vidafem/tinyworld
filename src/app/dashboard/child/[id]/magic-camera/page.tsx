"use client";

import React, { useState, useRef, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Camera, Image as ImageIcon, ChevronLeft, Save, Trash2, Undo } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import AppButton from "@/components/Common/AppButton";
import html2canvas from "html2canvas";
import FloatingToast, { ToastData } from "@/components/Common/FloatingToast";

interface MagicCameraProps {
  params: Promise<{ id: string }>;
}

const AVAILABLE_STICKERS = [
  "/images/stickers/crown.png",
  "/images/stickers/pacifier.png",
  "/images/stickers/star.png",
  "/images/stickers/heart.png",
  "/images/stickers/sunglasses.png",
  "/images/stickers/balloon.png"
];

// Fallback emojis in case images don't exist yet
const EMOJI_STICKERS = ["👑", "🍼", "⭐", "❤️", "🕶️", "🎈"];

export default function MagicCameraPage({ params }: MagicCameraProps) {
  const router = useRouter();
  const [childId, setChildId] = useState<string>("");
  const [child, setChild] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stickers, setStickers] = useState<{ id: string; url: string; emoji: string; x: number; y: number }[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [saving, setSaving] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolvedParams = use(params);

  useEffect(() => {
    setChildId(resolvedParams.id);
    loadChild(resolvedParams.id);
  }, [resolvedParams.id]);

  async function loadChild(id: string) {
    const { data } = await supabase.from("children").select("*").eq("id", id).single();
    if (data) setChild(data);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setStickers([]);
    }
  };

  const addSticker = (emoji: string, url: string) => {
    if (!selectedImage) {
      setToast({ type: "error", message: "¡Sube una foto primero!" });
      return;
    }
    setStickers([
      ...stickers,
      { id: `sticker-${Date.now()}`, emoji, url, x: 0, y: 0 }
    ]);
  };

  const saveMagicPhoto = async () => {
    if (!captureRef.current || !selectedImage || !child) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(captureRef.current, { useCORS: true, backgroundColor: null });
      const imageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      
      if (imageBlob) {
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `magia-${child.name}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        setToast({ type: "success", message: "¡Foto mágica guardada y descargada!" });
      }
    } catch (err) {
      setToast({ type: "error", message: "Error al guardar la foto" });
    } finally {
      setSaving(false);
    }
  };

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture flex flex-col pb-20`}>
      <FloatingToast toast={toast} onClose={() => setToast(null)} />
      
      <header className="px-4 py-3 flex items-center justify-between bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-white/60">
        <div className="flex items-center gap-3">
          <AppButton
            variant="secondary"
            size="icon"
            onClick={() => router.push(`/dashboard/child/${child.id}`)}
            icon={<ChevronLeft size={20} className={theme.text} />}
          />
          <h1 className={`font-outfit font-black ${theme.text} text-lg md:text-xl tracking-tight`}>
            Cámara Mágica 📸
          </h1>
        </div>
        <AppButton
          variant="primary"
          theme={theme}
          size="sm"
          onClick={saveMagicPhoto}
          loading={saving}
          disabled={!selectedImage}
          icon={<Save size={16} />}
        >
          Guardar
        </AppButton>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
        
        {/* Editor de Foto */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white/40 border-2 border-dashed border-stone-300 rounded-[3rem] p-4 relative overflow-hidden min-h-[60vh]">
          {!selectedImage ? (
            <div className="text-center">
              <Camera size={64} className="mx-auto text-stone-300 mb-4" />
              <p className="font-outfit font-bold text-stone-500 mb-6 text-lg">Sube una foto del bebé para empezar</p>
              <AppButton 
                variant="primary" 
                theme={theme}
                icon={<ImageIcon size={20} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Elegir Foto
              </AppButton>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          ) : (
            <div 
              ref={captureRef}
              className="relative w-full max-w-md aspect-[3/4] md:aspect-square bg-stone-100 rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedImage} alt="Foto" className="w-full h-full object-cover" />
              
              {stickers.map((stk) => (
                <motion.div
                  key={stk.id}
                  drag
                  dragConstraints={captureRef}
                  dragElastic={0}
                  dragMomentum={false}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl cursor-grab active:cursor-grabbing hover:scale-110 transition-transform drop-shadow-lg"
                  whileDrag={{ scale: 1.2, rotate: 10 }}
                >
                  {stk.emoji}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de Stickers */}
        <div className="w-full md:w-80 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-xl border border-white h-fit">
          <h2 className={`font-outfit font-black ${theme.text} text-xl mb-1`}>Caja de Stickers</h2>
          <p className="text-xs text-stone-500 font-bold mb-6">Toca uno para agregarlo a la foto y arrástralo.</p>
          
          <div className="grid grid-cols-3 gap-4">
            {EMOJI_STICKERS.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => addSticker(emoji, AVAILABLE_STICKERS[idx])}
                className={`aspect-square bg-stone-50 rounded-2xl flex items-center justify-center text-4xl hover:${theme.bgLight} transition-colors border border-stone-100 hover:scale-105 active:scale-95 shadow-sm`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            <AppButton
               variant="secondary"
               className="w-full text-stone-600 bg-stone-100"
               icon={<Undo size={16} />}
               onClick={() => setStickers(stickers.slice(0, -1))}
               disabled={stickers.length === 0}
            >
              Deshacer último
            </AppButton>
            <AppButton
               variant="ghost"
               className="w-full text-red-500 hover:bg-red-50"
               icon={<Trash2 size={16} />}
               onClick={() => { setSelectedImage(null); setStickers([]); }}
               disabled={!selectedImage}
            >
              Limpiar todo
            </AppButton>
          </div>
        </div>
      </main>
    </div>
  );
}
