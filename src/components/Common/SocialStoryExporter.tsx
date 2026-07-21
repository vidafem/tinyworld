"use client";

import React, { useState } from "react";
import { Share2, Sparkles, Loader2 } from "lucide-react";

interface SocialStoryExporterProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  theme: any;
  childName?: string;
}

export default function SocialStoryExporter({
  title,
  subtitle,
  imageUrl,
  theme,
  childName = "el Bebé",
}: SocialStoryExporterProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportStory = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const cardEl = document.getElementById("social-story-preview");

      if (cardEl) {
        const canvas = await html2canvas(cardEl, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = imgData;
        link.download = `TinyWorld_Historia_${title.replace(/\s+/g, "_")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Error al exportar Historia:", err);
      alert("No se pudo generar la tarjeta para Historias.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={exportStory}
        disabled={isExporting}
        className={`px-5 py-2.5 ${theme.primaryBg} ${theme.textActive} rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer disabled:opacity-50`}
      >
        {isExporting ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />}
        Exportar a Historia (1080x1920) 📸
      </button>

      <div className="fixed left-[-9999px] top-[-9999px]">
        <div
          id="social-story-preview"
          className="w-[450px] h-[800px] p-8 flex flex-col justify-between items-center text-center relative overflow-hidden bg-gradient-to-br from-rose-100 via-amber-50 to-pink-100 text-stone-850"
        >
          <div className="pt-6">
            <span className="px-4 py-1.5 bg-white/80 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-sm text-stone-700 inline-flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" /> TinyWorld • {childName}
            </span>
          </div>

          <div className="my-auto space-y-4 max-w-sm">
            {imageUrl && (
              <div className="w-56 h-56 mx-auto rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-white p-2">
                <img src={imageUrl} className="w-full h-full object-cover rounded-[2rem]" alt="" />
              </div>
            )}
            <h2 className="text-3xl font-black italic tracking-tight leading-tight text-stone-900">{title}</h2>
            {subtitle && <p className="text-sm font-semibold opacity-70 px-4">{subtitle}</p>}
          </div>

          <div className="pb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
              Creado con Amor en TinyWorld App
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
