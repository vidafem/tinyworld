"use client";

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

interface PhotoBookViewerProps {
  photos: string[];
  width?: number;
  height?: number;
  isFullscreen?: boolean;
}

// Creamos la página individual del libro (Collage)
const Page = forwardRef<HTMLDivElement, { urls: string[]; index: number; isCover?: boolean }>((props, ref) => {
  return (
    <div className="page bg-[#f9f8f6] shadow-inner flex flex-col items-center justify-center p-4 relative" ref={ref}>
      {props.isCover ? (
        <div className="w-full h-full bg-[#f4e8d3] flex flex-col items-center justify-center border-8 border-[#d4c1a5]">
          <h2 className="font-outfit font-black text-2xl text-[#7a6448] uppercase tracking-widest text-center px-4">
            Álbum de Recuerdos
          </h2>
          <div className="mt-8 w-24 h-1 bg-[#d4c1a5]" />
        </div>
      ) : (
        <div className="w-full h-full relative overflow-hidden flex flex-wrap items-center justify-center content-center">
          {props.urls.map((url, idx) => {
            // Rotaciones y desplazamientos aleatorios predecibles basados en índices
            const randRot = (((props.index * 3 + idx) * 17) % 20) - 10;
            const isSingle = props.urls.length === 1;
            
            return (
              <div 
                key={idx}
                className={`absolute shadow-xl bg-white p-2 pb-8 md:pb-10 border border-stone-200 transition-transform hover:z-50 hover:scale-105`}
                style={{
                  transform: `rotate(${randRot}deg)`,
                  maxWidth: isSingle ? '80%' : '65%',
                  maxHeight: isSingle ? '80%' : '65%',
                  zIndex: idx,
                  top: isSingle ? '10%' : (idx === 0 ? '5%' : (idx === 1 ? '40%' : '15%')),
                  left: isSingle ? '10%' : (idx === 0 ? '5%' : (idx === 1 ? '20%' : '30%')),
                }}
              >
                <img 
                  src={url} 
                  alt={`Foto ${props.index}-${idx}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
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

  // Agrupamos las fotos en chunks para hacer el collage (máx 3 fotos por pág)
  const chunkedPhotos: string[][] = [];
  for (let i = 0; i < photos.length; i += 3) {
    chunkedPhotos.push(photos.slice(i, i + 3));
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
