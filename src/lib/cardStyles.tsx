"use client";

import React from "react";
import {
  Baby,
  BookOpen,
  CalendarDays,
  Camera,
  Crown,
  Eye,
  Flower2,
  Gift,
  Heart,
  Images,
  LucideIcon,
  Moon,
  Music,
  Palette,
  QrCode,
  Smile,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";

export interface CardStyle {
  color?: string | null;
  icon?: string | null;
}

export const CARD_COLOR_OPTIONS = [
  "#FFF5F7",
  "#F2FFF9",
  "#EEF7FF",
  "#FFF7E8",
  "#F6F0FF",
  "#FFFDF2",
];

export const CARD_ICON_OPTIONS = [
  "Heart",
  "Sparkles",
  "BookOpen",
  "CalendarDays",
  "Images",
  "Baby",
  "Camera",
  "Star",
  "Smile",
  "Gift",
  "Flower2",
  "Crown",
  "Sun",
  "Moon",
  "Music",
  "Palette",
  "QrCode",
  "Eye",
];

export const CARD_ICON_LABELS: Record<string, string> = {
  Heart: "Corazon",
  Sparkles: "Brillos",
  BookOpen: "Libro",
  CalendarDays: "Calendario",
  Images: "Galeria",
  Baby: "Bebe",
  Camera: "Camara",
  Star: "Estrella",
  Smile: "Sonrisa",
  Gift: "Regalo",
  Flower2: "Flor",
  Crown: "Corona",
  Sun: "Sol",
  Moon: "Luna",
  Music: "Musica",
  Palette: "Paleta",
  QrCode: "QR",
  Eye: "Preview",
};

export const CARD_ICON_MAP: Record<string, LucideIcon> = {
  Heart,
  Sparkles,
  BookOpen,
  CalendarDays,
  Images,
  Baby,
  Camera,
  Star,
  Smile,
  Gift,
  Flower2,
  Crown,
  Sun,
  Moon,
  Music,
  Palette,
  QrCode,
  Eye,
};

export function normalizeCardStyle(style?: CardStyle | null): CardStyle {
  return {
    color: style?.color || null,
    icon: style?.icon || null,
  };
}

export function isStickerIcon(icon?: string | null) {
  if (!icon) return false;
  return icon.startsWith("http") || icon.startsWith("/") || icon.includes(".png") || icon.includes(".jpg") || icon.includes(".webp") || icon.includes(".gif");
}

export function getProxiedCardIconUrl(url: string) {
  if (!url) return "";
  if (url.includes(".r2.dev") || url.includes(".r2.cloudflarestorage.com")) {
    return `/api/download?url=${encodeURIComponent(url)}&inline=true`;
  }
  return url;
}

export function renderCardIcon(iconName: string | null | undefined, size: number, className?: string) {
  if (isStickerIcon(iconName)) {
    return (
      <img
        src={getProxiedCardIconUrl(iconName || "")}
        alt=""
        className="h-full w-full object-contain"
        crossOrigin="anonymous"
      />
    );
  }

  const Icon = CARD_ICON_MAP[iconName || ""] || Sparkles;
  return <Icon size={size} className={className} />;
}
