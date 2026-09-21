"use client";

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

interface PhotoBookViewerProps {
  photos: string[];
  width?: number;
  height?: number;
}

// Creamos la página individual del libro
const Page = forwardRef<HTMLDivElement, { url: string; index: number; isCover?: boolean }>((props, ref) => {
  return (
    <div className="page bg-white shadow-inner flex items-center justify-center p-2 relative" ref={ref}>
      {props.isCover ? (
        <div className="w-full h-full bg-[#f4e8d3] flex flex-col items-center justify-center border-8 border-[#d4c1a5]">
          <h2 className="font-outfit font-black text-2xl text-[#7a6448] uppercase tracking-widest text-center px-4">
            Álbum de Recuerdos
          </h2>
          <div className="mt-8 w-24 h-1 bg-[#d4c1a5]" />
        </div>
      ) : (
        <div className="w-full h-full relative bg-stone-100 overflow-hidden flex items-center justify-center">
          <img 
            src={props.url} 
            alt={`Foto ${props.index}`} 
            className="max-w-full max-h-full object-contain drop-shadow-md border-4 border-white"
          />
        </div>
      )}
      {/* Sombra de la encuadernación central */}
      <div className={`absolute top-0 bottom-0 w-12 pointer-events-none ${props.index % 2 === 0 ? 'left-0 bg-gradient-to-r from-black/20 to-transparent' : 'right-0 bg-gradient-to-l from-black/20 to-transparent'}`} />
    </div>
  );
});

Page.displayName = "Page";

export default function PhotoBookViewer({ photos, width = 400, height = 500 }: PhotoBookViewerProps) {
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

  // Aseguramos que haya un número par de páginas agregando una en blanco si es necesario
  const pages = [...photos];
  if (pages.length % 2 !== 0) {
    pages.push(""); 
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative perspective-1000">
      
      {/* Mensaje para rotar en móviles */}
      <div className="md:hidden text-center text-xs text-stone-500 mb-4 font-bold animate-pulse">
        Gira tu celular de lado para una mejor experiencia 📱🔄
      </div>

      <div className="drop-shadow-2xl">
        {/* @ts-ignore - react-pageflip types can be tricky */}
        <HTMLFlipBook
          width={width}
          height={height}
          size="stretch"
          minWidth={300}
          maxWidth={800}
          minHeight={400}
          maxHeight={1000}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          className="flipbook-container"
        >
          {/* Portada */}
          <Page url="" index={0} isCover={true} />
          
          {/* Páginas interiores */}
          {pages.map((url, i) => (
            url ? (
              <Page key={i} url={url} index={i + 1} />
            ) : (
              <div key={i} className="page bg-white shadow-inner flex items-center justify-center">
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
