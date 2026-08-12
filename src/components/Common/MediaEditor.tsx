"use client";

import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { 
  X, Video, Mic, Scissors, 
  Play, Pause, Loader2, Sparkles,
  Check, ChevronRight, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ProcessMode = 'video' | 'audio' | 'video_mute';

interface MediaEditorProps {
  file: File;
  onClose: () => void;
  onComplete: (processedFile: File, type: 'video' | 'audio') => void;
}

export default function MediaEditor({ file, onClose, onComplete }: MediaEditorProps) {
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const MAX_SECONDS = 15;

  async function loadFFmpeg() {
    const ffmpeg = ffmpegRef.current;
    
    // Escuchar logs para depuración interna si fuera necesario
    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });

    try {
      // Intentar cargar archivos locales de FFmpeg desde el directorio public
      const coreBlob = await toBlobURL(`${window.location.origin}/ffmpeg/ffmpeg-core.js`, 'text/javascript');
      const wasmBlob = await toBlobURL(`${window.location.origin}/ffmpeg/ffmpeg-core.wasm`, 'application/wasm');
      
      await ffmpeg.load({
        coreURL: coreBlob,
        wasmURL: wasmBlob,
      });
    } catch (localError) {
      console.warn("Fallo la carga de FFmpeg local, reintentando con la CDN pública:", localError);
      
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }
    setLoaded(true);
  }

  useEffect(() => {
    setVideoUrl(URL.createObjectURL(file));
    loadFFmpeg();
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, []);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      setDuration(d);
      setStartTime(0);
      setEndTime(Math.min(d, MAX_SECONDS));
    }
  };

  const processMedia = async (mode: ProcessMode) => {
    if (!loaded) return;
    setProcessing(true);
    const ffmpeg = ffmpegRef.current;
    const inputName = 'input.mp4';
    const outName = mode === 'audio' ? 'output.mp3' : 'output.mp4';
    const start = Math.max(0, startTime);
    const durationSeconds = Math.max(0.1, endTime - startTime);

    try {
      await Promise.all([
        ffmpeg.deleteFile(inputName).catch(() => undefined),
        ffmpeg.deleteFile(outName).catch(() => undefined),
      ]);

      // Escribir archivo original en el sistema de archivos virtual
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Construir comandos de recorte
      // -ss: inicio, -to: fin (o -t: duración)
      const commands =
        mode === 'audio'
          ? ['-ss', start.toString(), '-t', durationSeconds.toString(), '-i', inputName, '-vn', '-map', '0:a:0', '-q:a', '0', outName]
          : [
              '-ss', start.toString(),
              '-t', durationSeconds.toString(),
              '-i', inputName,
              '-map', '0:v:0',
              ...(mode === 'video_mute' ? ['-an'] : ['-map', '0:a:0?', '-c:a', 'aac']),
              '-c:v', 'libx264',
              '-preset', 'veryfast',
              '-pix_fmt', 'yuv420p',
              '-movflags', 'faststart',
              outName,
            ];

      await ffmpeg.exec(commands);

      // Leer el resultado
      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data as any], { type: mode === 'audio' ? 'audio/mpeg' : 'video/mp4' });
      const processedFile = new File([blob], outName, { type: blob.type });

      onComplete(processedFile, mode === 'video_mute' ? 'video' : mode);
    } catch (err) {
      console.error("Error processing media:", err);
      alert("Hubo un error al procesar el archivo.");
    } finally {
      await Promise.all([
        ffmpeg.deleteFile(inputName).catch(() => undefined),
        ffmpeg.deleteFile(outName).catch(() => undefined),
      ]);
      setProcessing(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
        if (!isPlaying) videoRef.current.pause();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-taupe/20 backdrop-blur-2xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white relative"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-taupe tracking-tighter italic flex items-center gap-2">
              <Scissors className="text-gold" size={24} /> TinyEditor
            </h3>
            <p className="text-[10px] font-black text-taupe/30 uppercase tracking-widest mt-1">Recorta tus mejores {MAX_SECONDS} segundos</p>
          </div>
          <button onClick={onClose} className="p-3 text-taupe/20 hover:text-red-500 transition-colors"><X size={28} /></button>
        </div>

        <div className="p-8 pt-0 space-y-8">
          {/* Player Area */}
          <div className="relative aspect-video bg-black rounded-[2rem] overflow-hidden shadow-inner group flex items-center justify-center">
            {videoUrl ? (
              <video 
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-taupe/20">
                <Loader2 className="animate-spin mb-2" size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest">Preparando...</span>
              </div>
            )}
            
            <button 
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                {isPlaying ? <Pause size={32} /> : <Play size={32} fill="white" />}
              </div>
            </button>

            {processing && (
              <div className="absolute inset-0 bg-taupe/60 backdrop-blur-md flex flex-col items-center justify-center text-white z-50">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="font-black uppercase tracking-widest text-sm animate-pulse">Masticando video...</p>
              </div>
            )}
          </div>

          {/* Controls / Range Slider */}
          <div className="space-y-6">
            <div className="bg-taupe/5 p-6 rounded-3xl border border-taupe/5">
              <div className="flex justify-between items-end mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-taupe/40 uppercase tracking-widest">Intervalo seleccionado</span>
                  <div className="flex items-center gap-2 text-xl font-black text-taupe">
                    <span className="text-gold">{startTime.toFixed(1)}s</span>
                    <ChevronRight size={16} className="text-taupe/20" />
                    <span className="text-gold">{endTime.toFixed(1)}s</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-taupe/40 uppercase tracking-widest">Duración</span>
                  <p className="text-xl font-black text-taupe">{(endTime - startTime).toFixed(1)}s</p>
                </div>
              </div>

              {/* Range Inputs (Simple version for stability) */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black text-taupe/20 uppercase">
                    <span>Inicio</span>
                    <span>{startTime.toFixed(1)}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={duration} 
                    step="0.1"
                    value={startTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setStartTime(val);
                      if (endTime - val > MAX_SECONDS) setEndTime(val + MAX_SECONDS);
                      if (val >= endTime) setEndTime(Math.min(val + 0.1, duration));
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="w-full accent-gold h-1 bg-taupe/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black text-taupe/20 uppercase">
                    <span>Fin</span>
                    <span>{endTime.toFixed(1)}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={duration} 
                    step="0.1"
                    value={endTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEndTime(val);
                      if (val - startTime > MAX_SECONDS) setStartTime(Math.max(0, val - MAX_SECONDS));
                      if (val <= startTime) setStartTime(Math.max(0, val - 0.1));
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="w-full accent-taupe h-1 bg-taupe/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => processMedia('audio')}
                disabled={!loaded || processing}
                className="flex flex-col items-center justify-center gap-2 py-4 bg-white border-2 border-taupe/10 rounded-2xl text-taupe font-black text-[9px] uppercase tracking-widest hover:border-gold transition-all disabled:opacity-20"
              >
                <Mic size={18} className="text-gold" /> Solo Audio
              </button>
              <button 
                onClick={() => processMedia('video_mute')}
                disabled={!loaded || processing}
                className="flex flex-col items-center justify-center gap-2 py-4 bg-white border-2 border-taupe/10 rounded-2xl text-taupe font-black text-[9px] uppercase tracking-widest hover:border-gold transition-all disabled:opacity-20"
              >
                <Video size={18} className="text-taupe/20" /> Sin Audio
              </button>
              <button 
                onClick={() => processMedia('video')}
                disabled={!loaded || processing}
                className="flex flex-col items-center justify-center gap-2 py-4 bg-taupe text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-taupe/20 hover:scale-105 transition-all disabled:opacity-20"
              >
                <Video size={18} className="text-gold" /> Con Audio
              </button>
            </div>
            
            {!loaded && (
              <div className="flex items-center justify-center gap-2 text-taupe/30 py-2">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Cargando motor de edición...</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
