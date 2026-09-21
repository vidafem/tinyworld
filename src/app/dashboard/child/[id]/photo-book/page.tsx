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

  useEffect(() => {
    loadChild(resolvedParams.id);
    loadPhotos(resolvedParams.id);
  }, [resolvedParams.id]);

  async function loadChild(id: string) {
    const { data } = await supabase.from("children").select("*").eq("id", id).single();
    if (data) setChild(data);
  }

  async function loadPhotos(childId: string) {
    setLoading(true);
    // Asumimos que los archivos en "media" con type = 'image' son fotos
    const { data } = await supabase
      .from("media")
      .select("url, type")
      .eq("child_id", childId)
      .eq("type", "image")
      .order("created_at", { ascending: true });

    if (data) {
      setPhotos(data.map(d => d.url));
    }
    setLoading(false);
  }

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture flex flex-col`}>
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

      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-8">
        {loading ? (
          <div className="text-center font-bold text-stone-400 animate-pulse">
            Buscando recuerdos...
          </div>
        ) : (
          <div className="w-full h-full max-w-5xl flex items-center justify-center">
            {/* Si estamos en mobile, le damos unas medidas, si es desktop, otras */}
            <div className="hidden md:block w-full h-[600px]">
              <PhotoBookViewer photos={photos} width={400} height={550} />
            </div>
            <div className="block md:hidden w-full h-[400px]">
              <PhotoBookViewer photos={photos} width={280} height={400} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
