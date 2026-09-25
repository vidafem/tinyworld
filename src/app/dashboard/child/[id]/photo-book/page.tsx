"use client";

import React, { useState, useEffect, use } from "react";
import { ChevronLeft, BookOpen, X, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import AppButton from "@/components/Common/AppButton";
import CardStyleHeaderButton from "@/components/Common/CardStyleHeaderButton";
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

  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    loadChild(resolvedParams.id);
  }, [resolvedParams.id]);

  async function loadChild(id: string) {
    const { data: childData } = await supabase.from("children").select("*").eq("id", id).single();
    if (childData) {
      setChild(childData);
      
      const [memoriesRes, generalRes, mediaRes] = await Promise.all([
        supabase.from("pregnancy_memories").select("media_urls").eq("child_id", id).not("media_urls", "is", null),
        supabase.from("general_memories").select("media_urls").eq("child_id", id).not("media_urls", "is", null),
        supabase.from("media").select("url").eq("child_id", id).eq("type", "image")
      ]);

      let allPhotos: string[] = [];
      
      const addMediaUrls = (res: any) => {
        if (res.data) {
          res.data.forEach((m: any) => {
            if (Array.isArray(m.media_urls)) {
              m.media_urls.forEach((url: string) => {
                if (url && (url.includes(".jpg") || url.includes(".jpeg") || url.includes(".png") || url.includes(".webp"))) {
                  if (!allPhotos.includes(url)) allPhotos.push(url);
                }
              });
            }
          });
        }
      };

      addMediaUrls(memoriesRes);
      addMediaUrls(generalRes);

      if (mediaRes.data) {
        mediaRes.data.forEach(m => {
          if (m.url && !allPhotos.includes(m.url)) {
            allPhotos.push(m.url);
          }
        });
      }

      setPhotos(allPhotos);
    }
    setLoading(false);
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setZoom(1); // Reset zoom
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[100] bg-stone-900 overflow-hidden' : `min-h-screen ${theme.bg} bg-texture`} flex flex-col`}>
      {!isFullscreen && (
        <header className="px-4 py-3 flex items-center justify-between bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-white/60">
          <div className="flex items-center gap-3">
            <AppButton
              variant="secondary"
              size="icon"
              onClick={() => router.push(`/dashboard/child/${child.id}`)}
              icon={<ChevronLeft size={20} className={theme.text} />}
            />
            <CardStyleHeaderButton
              childId={child.id}
              cardKey="photo-book"
              title="Álbum 3D"
              theme={theme}
            />
            <h1 className={`font-outfit font-black ${theme.text} text-lg md:text-xl tracking-tight flex items-center gap-2`}>
              <BookOpen size={24} /> Álbum 3D
            </h1>
          </div>
        </header>
      )}

      {isFullscreen && (
        <>
          <button 
            onClick={toggleFullscreen}
            className="absolute top-6 left-6 z-[110] bg-red-500 hover:bg-red-600 shadow-2xl p-3 px-6 rounded-full text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <X size={20} strokeWidth={3} /> CERRAR
          </button>
          <div className="absolute top-6 right-6 z-[110] flex gap-2">
            <button 
              onClick={handleZoomOut}
              className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-colors"
              title="Alejar"
            >
              <Minus size={24} />
            </button>
            <button 
              onClick={handleZoomIn}
              className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-colors"
              title="Acercar"
            >
              <Plus size={24} />
            </button>
          </div>
        </>
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
            <div 
              className="w-full h-[60vh] sm:h-[600px] md:h-[600px] flex items-center justify-center transition-transform duration-300"
              style={isFullscreen ? { transform: `scale(${zoom})`, transformOrigin: 'center center' } : {}}
            >
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
