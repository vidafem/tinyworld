"use client";

import React from "react";
import { User, Heart, Sparkles, Check } from "lucide-react";

export type MemoryAuthor = 'dad' | 'mom' | null;

/**
 * Detecta el autor de un recuerdo (Papá o Mamá) tanto si está almacenado
 * en la columna dedicada 'author' como si está codificado en la descripción o contenido.
 */
export function getMemoryAuthor(memory?: any): MemoryAuthor {
  if (!memory) return null;

  // 1. Comprobar columna directa si existe
  const rawAuthor = memory.author || memory.created_by_role;
  if (typeof rawAuthor === 'string') {
    const lower = rawAuthor.toLowerCase().trim();
    if (lower === 'dad' || lower === 'papa' || lower === 'papá') return 'dad';
    if (lower === 'mom' || lower === 'mama' || lower === 'mamá') return 'mom';
  }

  // 2. Comprobar descripción o contenido (metadato invisible o explícito)
  const text = memory.description || memory.content || '';
  if (typeof text === 'string') {
    if (
      text.includes('<!--by:dad-->') ||
      text.includes('<!--author:dad-->') ||
      text.includes('[by:dad]') ||
      text.includes('[autor:papa]') ||
      text.includes('<!--by:papa-->')
    ) {
      return 'dad';
    }
    if (
      text.includes('<!--by:mom-->') ||
      text.includes('<!--author:mom-->') ||
      text.includes('[by:mom]') ||
      text.includes('[autor:mama]') ||
      text.includes('<!--by:mama-->')
    ) {
      return 'mom';
    }
  }

  return null;
}

/**
 * Limpia los identificadores de autor del texto para que no se muestren
 * etiquetas técnicas en la interfaz de usuario.
 */
export function cleanMemoryText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/<!--(?:author|by):(dad|mom|papa|mama)-->/gi, '')
    .replace(/\[(?:by|autor):(dad|mom|papa|mama)\]/gi, '')
    .trim();
}

/**
 * Adjunta la marca de autor al texto garantizando persistencia inmediata
 * sin depender obligatoriamente de una migración de base de datos previa.
 */
export function formatMemoryTextWithAuthor(text: string, author?: MemoryAuthor): string {
  const cleaned = cleanMemoryText(text);
  if (!author) return cleaned;
  return `${cleaned} <!--by:${author}-->`.trim();
}

interface MemoryAuthorBadgeProps {
  author?: MemoryAuthor | string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

/**
 * Tarjetita / Icono pequeño de Papá (celeste) o Mamá (rosa pastel)
 */
export function MemoryAuthorBadge({ author, size = 'sm', className = '' }: MemoryAuthorBadgeProps) {
  if (!author) return null;

  const normalizedAuthor: MemoryAuthor = 
    author === 'dad' || author === 'papa' || author === 'papá'
      ? 'dad'
      : author === 'mom' || author === 'mama' || author === 'mamá'
      ? 'mom'
      : null;

  if (!normalizedAuthor) return null;

  const isDad = normalizedAuthor === 'dad';

  // Configuración de tamaños
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[8px] gap-1',
    sm: 'px-2 py-0.5 text-[9px] gap-1.5',
    md: 'px-3 py-1 text-xs gap-2',
  }[size];

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
  }[size];

  if (isDad) {
    return (
      <span
        title="Recuerdo compartido por Papá"
        className={`inline-flex items-center font-black tracking-wider uppercase rounded-full shadow-xs transition-all border ${sizeClasses} bg-sky-50/90 text-sky-700 border-sky-200/80 hover:bg-sky-100/90 ${className}`}
      >
        <span className="text-sky-500 flex items-center justify-center">
          <User size={iconSizes} strokeWidth={2.6} />
        </span>
        <span className="font-extrabold text-sky-800">Papá</span>
      </span>
    );
  }

  return (
    <span
      title="Recuerdo compartido por Mamá"
      className={`inline-flex items-center font-black tracking-wider uppercase rounded-full shadow-xs transition-all border ${sizeClasses} bg-pink-50/90 text-pink-700 border-pink-200/80 hover:bg-pink-100/90 ${className}`}
    >
      <span className="text-pink-500 flex items-center justify-center">
        <Heart size={iconSizes} strokeWidth={2.6} className="fill-pink-200" />
      </span>
      <span className="font-extrabold text-pink-800">Mamá</span>
    </span>
  );
}

interface MemoryAuthorSelectorProps {
  value: MemoryAuthor;
  onChange: (author: 'dad' | 'mom') => void;
  label?: string;
  theme?: any;
}

/**
 * Selector interactivo para elegir si el recuerdo lo comparte Papá o Mamá
 */
export function MemoryAuthorSelector({
  value,
  onChange,
  label = "¿Quién comparte este recuerdo?",
  theme,
}: MemoryAuthorSelectorProps) {
  return (
    <div className="w-full">
      {label && (
        <label className={`block text-[10px] font-black ${theme?.text || 'text-stone-600'} opacity-50 uppercase tracking-widest mb-2 ml-1`}>
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Opción Papá (Celeste) */}
        <button
          type="button"
          onClick={() => onChange('dad')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-2xl font-black text-xs md:text-sm transition-all border-2 active:scale-95 ${
            value === 'dad'
              ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-md ring-2 ring-sky-200/70'
              : 'bg-white/80 border-stone-200 text-stone-500 hover:border-sky-300 hover:bg-sky-50/40'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            value === 'dad' ? 'bg-sky-200 text-sky-700' : 'bg-stone-100 text-stone-400'
          }`}>
            <User size={13} strokeWidth={2.6} />
          </div>
          <span className="tracking-tight">Papá</span>
          {value === 'dad' && (
            <div className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center ml-0.5">
              <Check size={10} strokeWidth={3} />
            </div>
          )}
        </button>

        {/* Opción Mamá (Rosa Pastel) */}
        <button
          type="button"
          onClick={() => onChange('mom')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-2xl font-black text-xs md:text-sm transition-all border-2 active:scale-95 ${
            value === 'mom'
              ? 'bg-pink-50 border-pink-400 text-pink-800 shadow-md ring-2 ring-pink-200/70'
              : 'bg-white/80 border-stone-200 text-stone-500 hover:border-pink-300 hover:bg-pink-50/40'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            value === 'mom' ? 'bg-pink-200 text-pink-700' : 'bg-stone-100 text-stone-400'
          }`}>
            <Heart size={12} strokeWidth={2.6} className={value === 'mom' ? 'fill-pink-400' : ''} />
          </div>
          <span className="tracking-tight">Mamá</span>
          {value === 'mom' && (
            <div className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center ml-0.5">
              <Check size={10} strokeWidth={3} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
