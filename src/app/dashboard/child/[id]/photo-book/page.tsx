"use client";

import React, { useState, useEffect, use } from "react";
import { ChevronLeft, BookOpen, Maximize2 } from "lucide-react";
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

  useEffect(() => {
    loadChild(resolvedParams.id);

    // Auto fullscreen en celulares para abrir pantalla completa directamente
    if (typeof window !== "undefined") {
      const isMobileScreen = window.innerWidth <= 768;
      if (isMobileScreen) {
        setIsFullscreen(true);
      }
    }
  }, [resolvedParams.id]);

  async function loadChild(id: string) {
    const { data: childData } = await supabase.from("children").select("*").eq("id", id).single();
    if (childData) {
      setChild(childData);

      const [memoriesRes, generalRes, mediaRes] = await Promise.all([
        supabase.from("pregnancy_memories").select("media_urls").eq("child_id", id).not("media_urls", "is", null),
        supabase.from("general_memories").select("media_urls").eq("child_id", id).not("media_urls", "is", null),
        supabase.from("media").select("url").eq("child_id", id).eq("type", "image"),
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
        mediaRes.data.forEach((m) => {
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
  };

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture flex flex-col`}>
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
          <div>
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 rounded-full bg-stone-900 text-white flex items-center gap-2 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Maximize2 size={16} />
              <span className="hidden sm:inline">Pantalla Completa</span>
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 w-full flex flex-col items-center justify-center p-2 sm:p-6 min-h-[calc(100vh-65px)]">
        {loading ? (
          <div className="text-center font-bold text-stone-400 animate-pulse py-20">
            Buscando recuerdos...
          </div>
        ) : (
          <div className="w-full h-full flex-1 flex items-center justify-center">
            <PhotoBookViewer
              photos={photos}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onClose={() => setIsFullscreen(false)}
              title={`Álbum 3D • ${child.nickname || child.name || "Bebé"}`}
            />
          </div>
        )}
      </main>
    </div>
  );
}
