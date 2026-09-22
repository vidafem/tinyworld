"use client";

import React, { useState, useEffect, use } from "react";
import { ChevronLeft, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import AppButton from "@/components/Common/AppButton";
import PhotoBookViewer from "@/components/PhotoBook/HTMLFlipBook";

interface PhotoBookPageProps {
  params: Promise<{ id: string }>;
}

export default function PhotoBookPage({ params }: PhotoBookPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [child, setChild] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadChild(resolvedParams.id);
  }, [resolvedParams.id]);

  async function loadChild(id: string) {
    const { data: childData } = await supabase.from("children").select("*").eq("id", id).single();
    if (childData) {
      setChild(childData);
      
      const { data: memories } = await supabase
        .from("pregnancy_memories")
        .select("media_urls")
        .eq("child_id", id)
        .not("media_urls", "is", null);

      let allPhotos: string[] = [];
      if (memories) {
        memories.forEach(m => {
          if (Array.isArray(m.media_urls)) {
            m.media_urls.forEach(url => {
              if (url && (url.includes(".jpg") || url.includes(".jpeg") || url.includes(".png") || url.includes(".webp"))) {
                allPhotos.push(url);
              }
            });
          }
        });
        setPhotos(allPhotos);
      }
    }
    setLoading(false);
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[100] bg-stone-900' : `min-h-screen ${theme.bg} bg-texture`} flex flex-col`}>
      {!isFullscreen && (
        <header className="px-4 py-3 flex items-center justify-between bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-white/60">
          <div className="flex items-center gap-3">
            <AppButton
              variant="secondary"
              size="icon"
              onClick={() => router.push(`/dashboard/child/${child.id}`)}
              icon={<ChevronLeft size={20} className={theme.text} />}
            />
            <h1 className={`font-outfit font-black ${theme.text} text-lg md:text-xl tracking-tight flex items-center gap-2`}>
              <BookOpen size={24} /> Álbum 3D
            </h1>
          </div>
        </header>
      )}

      {isFullscreen && (
        <button 
          onClick={toggleFullscreen}
          className="absolute top-6 left-6 z-[110] bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <main className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-8">
        {!isFullscreen && (
          <div className="w-full max-w-5xl flex justify-end mb-4">
            <AppButton 
              variant="primary" 
              theme={theme} 
              size="sm" 
              onClick={toggleFullscreen}
            >
              Ver en Pantalla Completa
            </AppButton>
          </div>
        )}

        {loading ? (
          <div className="text-center font-bold text-stone-400 animate-pulse">
            Buscando recuerdos...
          </div>
        ) : (
          <div className={`w-full flex items-center justify-center ${isFullscreen ? 'h-[90vh]' : 'h-full max-w-5xl'}`}>
            <div className="w-full h-[60vh] sm:h-[600px] md:h-[600px] flex items-center justify-center">
              <PhotoBookViewer 
                photos={photos} 
                width={isFullscreen ? (window.innerWidth > 768 ? 500 : 300) : 400} 
                height={isFullscreen ? (window.innerWidth > 768 ? 600 : 400) : 550} 
                isFullscreen={isFullscreen} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
