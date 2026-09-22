"use client";

import React, { useState, useEffect, use } from "react";
import { ChevronLeft, Share2, Trash2, TreeDeciduous, Mail, Maximize2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import AppButton from "@/components/Common/AppButton";
import FloatingToast, { ToastData } from "@/components/Common/FloatingToast";
import LoveTreeCanvas from "@/components/LoveTree/LoveTreeCanvas";

interface LoveTreeProps {
  params: Promise<{ id: string }>;
}

export default function LoveTreeParentPage({ params }: LoveTreeProps) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const resolvedParams = use(params);

  useEffect(() => {
    loadChild(resolvedParams.id);
    loadMessages(resolvedParams.id);
  }, [resolvedParams.id]);

  async function loadChild(id: string) {
    const { data } = await supabase.from("children").select("*").eq("id", id).single();
    if (data) setChild(data);
  }

  async function loadMessages(childId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("love_messages")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este mensaje? Volverá a ser una hoja en el árbol.")) return;
    
    try {
      await supabase.from("love_messages").delete().eq("id", id);
      setToast({ type: "success", message: "Mensaje eliminado con éxito." });
      setMessages(messages.filter(m => m.id !== id));
    } catch (err) {
      setToast({ type: "error", message: "Error al eliminar." });
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/share/${resolvedParams.id}/tree`;
    navigator.clipboard.writeText(link);
    setToast({ type: "success", message: "¡Enlace copiado al portapapeles!" });
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
          <h1 className={`font-outfit font-black ${theme.text} text-lg md:text-xl tracking-tight flex items-center gap-2`}>
            <TreeDeciduous size={24} /> Árbol de Amor
          </h1>
        </div>
        <AppButton
          variant="primary"
          theme={theme}
          size="sm"
          onClick={copyShareLink}
          icon={<Share2 size={16} />}
        >
          Compartir
        </AppButton>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl border border-white mb-8 text-center">
          <h2 className={`text-2xl font-black ${theme.text} mb-4`}>Interactúa con el Árbol</h2>
          <p className="text-stone-500 font-bold text-sm mb-8">
            Abre el árbol en pantalla completa para poder navegar mejor, ver cada hoja detalladamente y leer los mensajes de tus seres queridos.
          </p>
          <AppButton
            variant="primary"
            theme={theme}
            size="lg"
            onClick={() => setIsFullscreen(true)}
            icon={<Maximize2 size={20} />}
            className="w-full md:w-auto"
          >
            Abrir Árbol Interactivo
          </AppButton>
        </div>

        {isFullscreen && (
          <div className="fixed inset-0 z-[100] bg-black">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 left-6 z-[110] bg-red-500 hover:bg-red-600 shadow-2xl p-3 px-6 rounded-full text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              <X size={20} strokeWidth={3} /> CERRAR
            </button>
            <LoveTreeCanvas child={child} />
          </div>
        )}

        <div className="space-y-4">
          <h3 className={`font-outfit font-black ${theme.text} text-lg px-2 flex items-center gap-2`}>
            <Mail size={20} /> Cartas Recibidas ({messages.length})
          </h3>
          
          {loading ? (
            <p className="text-center text-stone-400 font-bold py-8">Cargando mensajes...</p>
          ) : messages.length === 0 ? (
            <div className="bg-white/40 border-2 border-dashed border-stone-300 rounded-3xl p-12 text-center text-stone-400 font-bold">
              Aún no hay mensajes. ¡Comparte el enlace con tu familia!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col relative group hover:shadow-md transition-shadow">
                  <button 
                    onClick={() => deleteMessage(msg.id)}
                    className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                  
                  <div className="flex items-center gap-2 mb-3 pr-10">
                    <div className={`w-8 h-8 rounded-full ${theme.bgLight} ${theme.text} flex items-center justify-center font-black text-sm`}>
                      {msg.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-black ${theme.text}`}>{msg.author_name}</p>
                      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-stone-50 rounded-2xl p-4 flex-1">
                    <p className="text-stone-700 italic text-sm">{msg.message}</p>
                  </div>
                  
                  <p className="text-right text-[9px] text-stone-300 font-black uppercase mt-2">
                    Posición en árbol: {msg.leaf_id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
