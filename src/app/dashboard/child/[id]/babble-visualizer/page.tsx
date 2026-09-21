"use client";

import React, { useState, useRef, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Mic, Square, ChevronLeft, Save, Play, Pause, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import AppButton from "@/components/Common/AppButton";
import FloatingToast, { ToastData } from "@/components/Common/FloatingToast";

interface BabbleVisualizerProps {
  params: Promise<{ id: string }>;
}

export default function BabbleVisualizerPage({ params }: BabbleVisualizerProps) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  const resolvedParams = use(params);

  useEffect(() => {
    loadChild(resolvedParams.id);
    return () => stopAll();
  }, [resolvedParams.id]);

  async function loadChild(id: string) {
    const { data } = await supabase.from("children").select("*").eq("id", id).single();
    if (data) setChild(data);
  }

  const stopAll = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        
        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#fde68a'); // gold-ish
        gradient.addColorStop(1, '#f43f5e'); // rose-ish
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Audio Context for visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      drawVisualizer();
      
    } catch (err) {
      console.error("Error accessing microphone", err);
      setToast({ type: "error", message: "No se pudo acceder al micrófono. Por favor, revisa los permisos." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const resetRecording = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);
    if (audioElementRef.current) audioElementRef.current.pause();
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const togglePlayback = () => {
    if (!audioElementRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const saveAudio = async () => {
    if (!audioBlob || !child) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const file = new File([audioBlob], `balbuceo-${Date.now()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append("childId", child.id);
      formData.append("module", "pregnancy");
      formData.append("section", "gallery");
      formData.append("mediaType", "audio");
      formData.append("files", file);

      const response = await fetch("/api/media", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Error subiendo el archivo");
      
      const payload = await response.json();
      const url = payload.uploaded?.[0]?.url;

      if (url) {
        await supabase.from("pregnancy_memories").insert({
          child_id: child.id,
          title: "Primeros Balbuceos",
          description: "Capturado con el Guardián de Voces",
          memory_date: new Date().toISOString().split('T')[0],
          media_urls: [url],
          media_type: "audio"
        });
        setToast({ type: "success", message: "¡Voces guardadas en la galería!" });
        setTimeout(() => router.push(`/dashboard/child/${child.id}`), 2000);
      }
    } catch (err) {
      setToast({ type: "error", message: "Error al guardar el audio" });
    } finally {
      setSaving(false);
    }
  };

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture flex flex-col pb-20`}>
      <FloatingToast toast={toast} onClose={() => setToast(null)} />
      
      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio 
          ref={audioElementRef} 
          src={audioUrl} 
          onEnded={() => setIsPlaying(false)} 
          className="hidden" 
        />
      )}
      
      <header className="px-4 py-3 flex items-center justify-between bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-white/60">
        <div className="flex items-center gap-3">
          <AppButton
            variant="secondary"
            size="icon"
            onClick={() => router.push(`/dashboard/child/${child.id}`)}
            icon={<ChevronLeft size={20} className={theme.text} />}
          />
          <h1 className={`font-outfit font-black ${theme.text} text-lg md:text-xl tracking-tight`}>
            Guardián de Voces 🎙️
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[3rem] p-8 md:p-12 shadow-2xl w-full flex flex-col items-center">
          
          <div className="text-center mb-8">
            <h2 className={`font-outfit font-black text-2xl md:text-3xl ${theme.text} mb-2`}>
              Inmortaliza sus soniditos
            </h2>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">
              Graba los primeros balbuceos y risitas
            </p>
          </div>

          {/* Visualizer Canvas Area */}
          <div className="relative w-full h-48 bg-stone-900 rounded-3xl overflow-hidden shadow-inner border-4 border-stone-800 mb-8 flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={200} 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-30'}`}
            />
            
            {!isRecording && !audioUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-stone-500 font-bold uppercase tracking-widest text-xs">Esperando audio...</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-center">
            {!audioUrl ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-colors duration-300 ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : `${theme.primaryBg} ${theme.textActive}`
                }`}
              >
                {isRecording ? <Square size={32} /> : <Mic size={32} />}
              </motion.button>
            ) : (
              <div className="flex items-center gap-4">
                <AppButton
                  variant="secondary"
                  size="lg"
                  onClick={resetRecording}
                  icon={<RefreshCw size={20} />}
                  className="rounded-full w-16 h-16 !p-0 flex items-center justify-center"
                />
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePlayback}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-colors duration-300 ${theme.primaryBg} ${theme.textActive}`}
                >
                  {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </motion.button>
                
                <AppButton
                  variant="primary"
                  theme={theme}
                  size="lg"
                  onClick={saveAudio}
                  loading={saving}
                  icon={<Save size={20} />}
                  className="h-16 px-8 rounded-full"
                >
                  Guardar
                </AppButton>
              </div>
            )}
          </div>
          
          {isRecording && (
            <p className="mt-6 text-red-500 font-bold animate-pulse text-sm">Grabando...</p>
          )}

        </div>
      </main>
    </div>
  );
}
