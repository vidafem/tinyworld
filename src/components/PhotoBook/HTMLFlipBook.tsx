"use client";

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

interface PhotoBookViewerProps {
  photos: string[];
  width?: number;
  height?: number;
  isFullscreen?: boolean;
}

// Creamos la página individual del libro (Estructurada)
const Page = forwardRef<HTMLDivElement, { urls: string[]; index: number; isCover?: boolean }>((props, ref) => {
  
  const renderLayout = () => {
    const { urls, index } = props;
    const count = urls.length;
    
    // Si es 1 foto: Sangría completa o gran margen central
    if (count === 1) {
      return (
        <div className="w-full h-full p-6 md:p-10 flex items-center justify-center bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <img src={urls[0]} alt="Foto" className="w-full h-full object-cover" />
        </div>
      );
    }
    
    // Si son 2 fotos: Divididas horizontalmente
    if (count === 2) {
      const isVertical = index % 2 === 0;
      return (
        <div className={`w-full h-full p-6 md:p-8 grid gap-4 md:gap-6 ${isVertical ? 'grid-rows-2' : 'grid-cols-2'}`}>
          {urls.map((url, idx) => (
            <div key={idx} className="w-full h-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.06)] p-2">
              <img src={url} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      );
    }

    // Si son 3 fotos: 1 grande y 2 pequeñas
    if (count === 3) {
      return (
        <div className="w-full h-full p-6 md:p-8 grid grid-cols-2 grid-rows-2 gap-4 md:gap-6">
          <div className="col-span-2 row-span-1 bg-white shadow-[0_4px_10px_rgba(0,0,0,0.06)] p-2">
            <img src={urls[0]} alt="Foto principal" className="w-full h-full object-cover object-center" />
          </div>
          <div className="col-span-1 row-span-1 bg-white shadow-[0_4px_10px_rgba(0,0,0,0.06)] p-2">
            <img src={urls[1]} alt="Secundaria 1" className="w-full h-full object-cover" />
          </div>
          <div className="col-span-1 row-span-1 bg-white shadow-[0_4px_10px_rgba(0,0,0,0.06)] p-2">
            <img src={urls[2]} alt="Secundaria 2" className="w-full h-full object-cover" />
          </div>
        </div>
      );
    }

    // Si son 4 fotos: Cuadrícula 2x2
    if (count >= 4) {
      return (
        <div className="w-full h-full p-6 md:p-8 grid grid-cols-2 grid-rows-2 gap-4 md:gap-6">
          {urls.slice(0, 4).map((url, idx) => (
            <div key={idx} className="w-full h-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.06)] p-2">
              <img src={url} alt={`Cuadricula ${idx}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="page bg-[#f9f8f6] shadow-inner flex flex-col items-center justify-center p-0 relative" ref={ref}>
      {props.isCover ? (
        <div className="w-full h-full bg-[#f4e8d3] flex flex-col items-center justify-center border-8 border-[#d4c1a5]">
          <h2 className="font-outfit font-black text-2xl text-[#7a6448] uppercase tracking-widest text-center px-4">
            Álbum de Recuerdos
          </h2>
          <div className="mt-8 w-24 h-1 bg-[#d4c1a5]" />
        </div>
      ) : (
        <div className="w-full h-full relative overflow-hidden bg-stone-100 flex items-center justify-center">
          {renderLayout()}
        </div>
      )}
      {/* Sombra de la encuadernación central */}
      <div className={`absolute top-0 bottom-0 w-12 pointer-events-none ${props.index % 2 === 0 ? 'left-0 bg-gradient-to-r from-black/20 to-transparent' : 'right-0 bg-gradient-to-l from-black/20 to-transparent'}`} />
    </div>
  );
});

Page.displayName = "Page";

export default function PhotoBookViewer({ photos, width = 400, height = 500, isFullscreen = false }: PhotoBookViewerProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div className="animate-pulse w-full h-[60vh] bg-stone-100 rounded-3xl" />;

  if (photos.length === 0) {
    return (
      <div className="text-center p-12 bg-white/50 rounded-3xl">
        No hay fotos en el álbum todavía.
      </div>
    );
  }

  // Agrupamos las fotos usando diferentes plantillas (1 a 4 fotos por pág)
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

  // Aseguramos que haya un número par de páginas agregando una en blanco si es necesario
  const pages = [...chunkedPhotos];
  if (pages.length % 2 !== 0) {
    pages.push([]); 
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative perspective-1000">
      
      {/* Mensaje para rotar en móviles si no estamos en fullscreen */}
      {!isFullscreen && (
        <div className="md:hidden text-center text-xs text-stone-500 mb-4 font-bold animate-pulse">
          Gira tu celular de lado o usa pantalla completa 📱🔄
        </div>
      )}

      <div className={`drop-shadow-2xl ${isFullscreen ? 'w-full flex justify-center' : ''}`}>
        {/* @ts-ignore */}
        <HTMLFlipBook
          width={width}
          height={height}
          size="stretch"
          minWidth={280}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1200}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          usePortrait={!isFullscreen} // Forzar doble página si está en fullscreen
          className="flipbook-container"
        >
          {/* Portada */}
          <Page urls={[]} index={0} isCover={true} />
          
          {/* Páginas interiores con collage */}
          {pages.map((urls, i) => (
            urls.length > 0 ? (
              <Page key={i} urls={urls} index={i + 1} />
            ) : (
              <div key={i} className="page bg-[#f9f8f6] shadow-inner flex items-center justify-center">
                <p className="text-stone-300 font-quicksand font-bold italic">Página en blanco</p>
              </div>
            )
          ))}
          
          {/* Contraportada */}
          <div className="page bg-[#d4c1a5] shadow-inner flex items-center justify-center">
            <p className="text-white font-black opacity-50">Fin del Álbum</p>
          </div>
        </HTMLFlipBook>
      </div>
    </div>
  );
}
