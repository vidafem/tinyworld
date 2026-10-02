"use client";

import React, { useEffect, useRef, useState, forwardRef, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, X, Minus, Plus, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { playPageTurnSound, isAudioMuted, toggleAudioMuted } from "@/lib/pageSound";
import { getPreviewUrl, handleImageFallback } from "@/lib/optimizedImage";

interface PhotoBookViewerProps {
  photos: string[];
  width?: number;
  height?: number;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
  title?: string;
}

// Creamos la página individual del libro (Estructurada)
const Page = forwardRef<HTMLDivElement, { urls: string[]; index: number; isCover?: boolean; isBackCover?: boolean }>((props, ref) => {
  const { urls, index, isCover, isBackCover } = props;
  const count = urls ? urls.length : 0;

  if (isCover) {
    return (
      <div className="page w-full h-full bg-[#f4e8d3] flex flex-col items-center justify-center border-8 border-[#d4c1a5] relative select-none shadow-inner" ref={ref}>
        <div className="p-6 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-[#9b805d] font-bold block mb-2">Recuerdos Inolvidables</span>
          <h2 className="font-outfit font-black text-2xl sm:text-3xl text-[#6b5539] uppercase tracking-wider text-center">
            Álbum de Recuerdos
          </h2>
          <div className="mt-6 mx-auto w-20 h-1 bg-[#d4c1a5] rounded-full" />
        </div>
        <div className="absolute bottom-4 text-[10px] tracking-widest text-[#9b805d] uppercase font-bold">
          TinyWorld 3D
        </div>
      </div>
    );
  }

  if (isBackCover) {
    return (
      <div className="page w-full h-full bg-[#d4c1a5] flex flex-col items-center justify-center p-6 text-center select-none shadow-inner" ref={ref}>
        <p className="text-white/80 font-black tracking-widest uppercase text-base sm:text-lg">Fin del Álbum</p>
        <p className="text-white/60 text-xs mt-2 font-medium">Cada momento es eterno ✨</p>
      </div>
    );
  }

  const renderLayout = () => {
    // Si es 1 foto: Margen limpio y foto centrada
    if (count === 1) {
      return (
        <div className="w-full h-full p-4 sm:p-6 flex items-center justify-center bg-white">
          <div className="w-full h-full relative rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08)] bg-stone-100 flex items-center justify-center">
            <img
              src={getPreviewUrl(urls[0])}
              alt="Foto del recuerdo"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center"
              onError={(e) => handleImageFallback(e, urls[0])}
            />
          </div>
        </div>
      );
    }

    // Si son 2 fotos: Divididas horizontal o verticalmente
    if (count === 2) {
      const isVertical = index % 2 === 0;
      return (
        <div className={`w-full h-full p-3 sm:p-5 grid gap-3 ${isVertical ? "grid-rows-2" : "grid-cols-2"}`}>
          {urls.map((url, idx) => (
            <div key={idx} className="w-full h-full bg-white rounded-lg shadow-sm p-1.5 overflow-hidden flex items-center justify-center">
              <img
                src={getPreviewUrl(url)}
                alt={`Foto ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center rounded"
                onError={(e) => handleImageFallback(e, url)}
              />
            </div>
          ))}
        </div>
      );
    }

    // Si son 3 fotos: 1 principal y 2 secundarias
    if (count === 3) {
      return (
        <div className="w-full h-full p-3 sm:p-4 grid grid-cols-2 grid-rows-2 gap-2.5">
          <div className="col-span-2 row-span-1 bg-white rounded-lg shadow-sm p-1.5 overflow-hidden">
            <img
              src={getPreviewUrl(urls[0])}
              alt="Foto principal"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center rounded"
              onError={(e) => handleImageFallback(e, urls[0])}
            />
          </div>
          <div className="col-span-1 row-span-1 bg-white rounded-lg shadow-sm p-1.5 overflow-hidden">
            <img
              src={getPreviewUrl(urls[1])}
              alt="Secundaria 1"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center rounded"
              onError={(e) => handleImageFallback(e, urls[1])}
            />
          </div>
          <div className="col-span-1 row-span-1 bg-white rounded-lg shadow-sm p-1.5 overflow-hidden">
            <img
              src={getPreviewUrl(urls[2])}
              alt="Secundaria 2"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center rounded"
              onError={(e) => handleImageFallback(e, urls[2])}
            />
          </div>
        </div>
      );
    }

    // Si son 4 fotos: Cuadrícula 2x2
    if (count >= 4) {
      return (
        <div className="w-full h-full p-3 sm:p-4 grid grid-cols-2 grid-rows-2 gap-2.5">
          {urls.slice(0, 4).map((url, idx) => (
            <div key={idx} className="w-full h-full bg-white rounded-lg shadow-sm p-1.5 overflow-hidden">
              <img
                src={getPreviewUrl(url)}
                alt={`Foto cuadrícula ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center rounded"
                onError={(e) => handleImageFallback(e, url)}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#f9f8f6] flex items-center justify-center p-6 text-stone-300 font-quicksand font-bold italic">
        Página en blanco
      </div>
    );
  };

  return (
    <div className="page w-full h-full bg-[#f9f8f6] shadow-inner flex flex-col items-center justify-center p-0 relative select-none" ref={ref}>
      <div className="w-full h-full relative overflow-hidden bg-stone-100 flex items-center justify-center">
        {renderLayout()}
      </div>
      {/* Sombra de la encuadernación central */}
      <div
        className={`absolute top-0 bottom-0 w-10 sm:w-14 pointer-events-none ${
          index % 2 === 0
            ? "left-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent"
            : "right-0 bg-gradient-to-l from-black/20 via-black/5 to-transparent"
        }`}
      />
    </div>
  );
});

Page.displayName = "Page";

export default function PhotoBookViewer({
  photos,
  isFullscreen = false,
  onToggleFullscreen,
  onClose,
  title = "Álbum 3D",
}: PhotoBookViewerProps) {
  const [isClient, setIsClient] = useState(false);
  const flipBookRef = useRef<any>(null);
  const isFlippingRef = useRef(false);

  const [dimensions, setDimensions] = useState({ width: 340, height: 450, isLandscape: false });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const panStartRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  // Robust responsive dimensions calculation
  const updateDimensions = useCallback(() => {
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isLand = w > h && w >= 640;

    const reservedH = isFullscreen ? 110 : 130;
    const reservedW = isFullscreen ? 36 : 48;
    const maxAvailW = Math.max(w - reservedW, 260);
    const maxAvailH = Math.max(h - reservedH, 260);
    const pageAspect = 3 / 4; // 0.75 (w/h)

    if (isLand) {
      // Landscape: dual-page spread (aspect ratio 1.5)
      const spreadAspect = 1.5;
      let targetH = maxAvailH;
      let targetW = Math.round(targetH * spreadAspect);
      if (targetW > maxAvailW) {
        targetW = maxAvailW;
        targetH = Math.round(targetW / spreadAspect);
      }
      targetH = Math.min(targetH, 700);
      targetW = Math.round(targetH * spreadAspect);
      const pageW = Math.round(targetW / 2);
      setDimensions({ width: Math.max(pageW, 220), height: Math.max(targetH, 280), isLandscape: true });
    } else {
      // Portrait: single page (aspect ratio 0.75)
      let pageH = maxAvailH;
      let pageW = Math.round(pageH * pageAspect);
      if (pageW > maxAvailW) {
        pageW = maxAvailW;
        pageH = Math.round(pageW / pageAspect);
      }
      pageH = Math.min(pageH, 720);
      pageW = Math.round(pageH * pageAspect);
      setDimensions({ width: Math.max(pageW, 220), height: Math.max(pageH, 290), isLandscape: false });
    }
  }, [isFullscreen]);

  useEffect(() => {
    setIsClient(true);
    setIsMuted(isAudioMuted());
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    window.addEventListener("orientationchange", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("orientationchange", updateDimensions);
    };
  }, [updateDimensions]);

  const handleToggleMute = () => {
    const next = toggleAudioMuted();
    setIsMuted(next);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 2.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pointer panning handler when zoomed in
  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    panStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: panOffset.x,
      originY: panOffset.y,
    };
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (!panStartRef.current || zoom <= 1) return;
    const dx = e.clientX - panStartRef.current.startX;
    const dy = e.clientY - panStartRef.current.startY;

    const bookW = dimensions.width * (dimensions.isLandscape ? 2 : 1);
    const bookH = dimensions.height;
    const maxPanX = (bookW * (zoom - 1)) / 2;
    const maxPanY = (bookH * (zoom - 1)) / 2;

    const nextX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.originX + dx));
    const nextY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.originY + dy));

    setPanOffset({ x: nextX, y: nextY });
  };

  const handleStagePointerUp = () => {
    panStartRef.current = null;
  };

  const handleFlipNext = useCallback(() => {
    if (isFlippingRef.current) return;
    const pageFlip = flipBookRef.current?.pageFlip();
    if (!pageFlip) return;

    isFlippingRef.current = true;
    playPageTurnSound("forward");
    pageFlip.flipNext();
    setTimeout(() => {
      isFlippingRef.current = false;
    }, 550);
  }, []);

  const handleFlipPrev = useCallback(() => {
    if (isFlippingRef.current) return;
    const pageFlip = flipBookRef.current?.pageFlip();
    if (!pageFlip) return;

    isFlippingRef.current = true;
    playPageTurnSound("backward");
    pageFlip.flipPrev();
    setTimeout(() => {
      isFlippingRef.current = false;
    }, 550);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleFlipNext();
      } else if (e.key === "ArrowLeft") {
        handleFlipPrev();
      } else if (e.key === "Escape" && isFullscreen && (onClose || onToggleFullscreen)) {
        if (onClose) onClose();
        else if (onToggleFullscreen) onToggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlipNext, handleFlipPrev, isFullscreen, onClose, onToggleFullscreen]);

  if (!isClient) return <div className="animate-pulse w-full h-[60vh] bg-stone-100 rounded-3xl" />;

  if (photos.length === 0) {
    return (
      <div className="text-center p-12 bg-white/50 rounded-3xl text-stone-500 font-medium">
        No hay fotos en el álbum todavía.
      </div>
    );
  }

  // Agrupamos las fotos usando plantillas
  const chunkedPhotos: string[][] = [];
  let currentIndex = 0;
  let p = 0;

  while (currentIndex < photos.length) {
    const sizes = [1, 2, 3, 2, 4, 1, 2, 4];
    const take = Math.min(sizes[p % sizes.length], photos.length - currentIndex);
    chunkedPhotos.push(photos.slice(currentIndex, currentIndex + take));
    currentIndex += take;
    p++;
  }

  // Aseguramos número par de páginas agregando una en blanco si es necesario
  const pages = [...chunkedPhotos];
  if (pages.length % 2 !== 0) {
    pages.push([]);
  }

  const totalPages = pages.length + 2; // + portada y contraportada

  const viewerContent = (
    <div className="w-full h-full flex flex-col items-center justify-between relative select-none">
      {/* Barra de Controles Superior en Pantalla Completa */}
      {isFullscreen && (
        <header className="w-full h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between z-50 bg-stone-900/60 backdrop-blur-xl border-b border-white/10 shrink-0">
          {/* Botón de Cerrar */}
          <button
            onClick={onClose || onToggleFullscreen}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md border border-white/20 flex items-center gap-2 text-xs sm:text-sm font-black transition-all shadow-lg cursor-pointer"
            title="Cerrar pantalla completa"
          >
            <X size={18} />
            <span>Cerrar</span>
          </button>

          {/* Título & Número de Página */}
          <div className="flex flex-col items-center text-center">
            <span className="text-white text-xs sm:text-sm font-black tracking-tight line-clamp-1 max-w-[140px] sm:max-w-[280px]">
              {title}
            </span>
            <span className="text-stone-300 text-[10px] sm:text-xs font-semibold">
              Página {currentPage + 1} de {totalPages}
            </span>
          </div>

          {/* Controles de Zoom y Audio */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center border border-white/15 active:scale-95 transition-all cursor-pointer"
              title="Alejar zoom"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 sm:px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] sm:text-xs font-mono font-bold active:scale-95 transition-all border border-white/20 cursor-pointer"
              title="Restablecer zoom a 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 2.5}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center border border-white/15 active:scale-95 transition-all cursor-pointer"
              title="Acercar zoom"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={handleToggleMute}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/15 active:scale-95 transition-all ml-1 cursor-pointer"
              title={isMuted ? "Activar sonido" : "Silenciar sonido"}
            >
              {isMuted ? <VolumeX size={16} className="opacity-40" /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>
      )}

      {/* Botones Laterales Flotantes para Pasar Página */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleFlipPrev();
        }}
        className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-[10000] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-stone-900/85 hover:bg-stone-800 text-white backdrop-blur-xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center active:scale-90 transition-all cursor-pointer group"
        title="Página anterior"
        aria-label="Página anterior"
      >
        <ChevronLeft size={28} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleFlipNext();
        }}
        className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-[10000] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-stone-900/85 hover:bg-stone-800 text-white backdrop-blur-xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center active:scale-90 transition-all cursor-pointer group"
        title="Página siguiente"
        aria-label="Página siguiente"
      >
        <ChevronRight size={28} className="group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Escenario Central con Soporte de Zoom y Arrastre Pan */}
      <div
        className="flex-1 w-full flex items-center justify-center relative overflow-hidden"
        style={{ cursor: zoom > 1 ? "grab" : "default" }}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
      >
        <div
          className="transition-transform duration-75 ease-out select-none will-change-transform drop-shadow-2xl flex justify-center items-center"
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
            transformOrigin: "center center",
            width: `${dimensions.isLandscape ? dimensions.width * 2 : dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
        >
          {/* @ts-ignore - react-pageflip typings */}
          <HTMLFlipBook
            key={`${dimensions.isLandscape ? "land" : "port"}-${dimensions.width}-${dimensions.height}`}
            ref={flipBookRef}
            width={dimensions.width}
            height={dimensions.height}
            size="fixed"
            minWidth={dimensions.width}
            maxWidth={dimensions.width}
            minHeight={dimensions.height}
            maxHeight={dimensions.height}
            maxShadowOpacity={0.5}
            showCover={false}
            flippingTime={500}
            useMouseEvents={false}
            clickEventForward={false}
            mobileScrollSupport={false}
            usePortrait={!dimensions.isLandscape}
            onFlip={(e: any) => setCurrentPage(e.data)}
            className="flipbook-container"
          >
            {/* Portada */}
            <Page urls={[]} index={0} isCover={true} />

            {/* Páginas interiores con fotos */}
            {pages.map((urls, i) => (
              <Page key={i} urls={urls} index={i + 1} />
            ))}

            {/* Contraportada */}
            <Page urls={[]} index={pages.length + 1} isBackCover={true} />
          </HTMLFlipBook>
        </div>

        {/* Indicador de ayuda cuando hay zoom activo */}
        {zoom > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-stone-900/80 text-white text-[11px] font-medium backdrop-blur-md border border-white/10 pointer-events-none shadow-lg z-30">
            Arrastra para explorar fotos • Toca {Math.round(zoom * 100)}% para restablecer
          </div>
        )}
      </div>

      {/* Botón flotante para abrir pantalla completa si no está activa */}
      {!isFullscreen && onToggleFullscreen && (
        <div className="w-full flex justify-center pb-4 z-20">
          <button
            onClick={onToggleFullscreen}
            className="px-5 py-2.5 rounded-full bg-stone-900 text-white shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Maximize2 size={16} /> Ver en Pantalla Completa
          </button>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[1000] bg-stone-950/95 backdrop-blur-2xl flex flex-col justify-between overflow-hidden">
        {viewerContent}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative perspective-1000">
      {viewerContent}
    </div>
  );
}
