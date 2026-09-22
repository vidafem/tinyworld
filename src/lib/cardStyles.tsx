"use client";

import React from "react";
import {
  Activity,
  Anchor,
  Baby,
  Bath,
  Bell,
  BicepsFlexed,
  Bike,
  Bird,
  BookImage,
  BookOpen,
  CalendarDays,
  Camera,
  Car,
  Cat,
  Clover,
  Cloud,
  CloudLightning,
  CloudRain,
  Compass,
  Crown,
  Dog,
  Eye,
  Feather,
  Flower2,
  Footprints,
  Gamepad2,
  Gift,
  Glasses,
  Globe2,
  Heart,
  Image,
  Images,
  Leaf,
  Library,
  Map,
  Moon,
  Music,
  Palette,
  PartyPopper,
  Plane,
  QrCode,
  Rocket,
  Sailboat,
  Shirt,
  Smile,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tent,
  Timer,
  Train,
  TreeDeciduous,
  Trophy,
  Umbrella,
  Video,
  Wand2,
  LucideIcon
} from "lucide-react";

export interface CardStyle {
  color?: string | null;
  icon?: string | null;
  visible_items?: string[] | null;
}

export const CARD_COLOR_OPTIONS = [
  "#FFF5F7", // Rosa Claro
  "#FFE5EC", // Rosa Pastel
  "#FFD2FC", // Lila Claro
  "#FFF0E5", // Melocotón Claro
  "#FFE4D6", // Melocotón Pastel
  "#FFF7E8", // Durazno
  "#FFFDF2", // Crema
  "#FFF9DB", // Amarillo Clásico
  "#FFF0C2", // Amarillo Trigo
  "#F2FFF9", // Menta Suave
  "#E6FCF5", // Menta Pastel
  "#D3F9D8", // Verde Manzana
  "#EEF7FF", // Celeste Claro
  "#E3FAF9", // Turquesa Claro
  "#E7F5FF", // Azul Hielo
  "#F6F0FF", // Lavanda Claro
  "#F3E8FF", // Violeta Pastel
  "#E8EAFF", // Azul Bígaro
  "#F4EBE1", // Arena Beige
  "#E8E4D9", // Lino Neutro
  "#E5EAE3", // Salvia Pastel
];

export const CARD_ICON_OPTIONS = [
  "Heart", "Sparkles", "BookOpen", "CalendarDays", "Images", "Image", "Baby", "Camera", 
  "Star", "Smile", "Gift", "Flower2", "Crown", "Sun", "Moon", "Music", "Palette", 
  "QrCode", "Eye", "TreeDeciduous", "BookImage", "Map", "Activity", "Anchor", "Bath",
  "Bell", "BicepsFlexed", "Bike", "Bird", "Car", "Cat", "Clover", "Cloud", "CloudLightning", 
  "CloudRain", "Compass", "Dog", "Feather", "Footprints", "Gamepad2", "Glasses", "Globe2",
  "Leaf", "Library", "PartyPopper", "Plane", "Rocket", "Sailboat", "Shirt", "Snowflake",
  "Tent", "Timer", "Train", "Trophy", "Umbrella", "Video", "Wand2"
];

export const CARD_ICON_LABELS: Record<string, string> = {
  Heart: "Corazón",
  Sparkles: "Brillos",
  BookOpen: "Libro",
  CalendarDays: "Calendario",
  Images: "Galería",
  Image: "Imagen",
  Baby: "Bebé",
  Camera: "Cámara",
  Star: "Estrella",
  Smile: "Sonrisa",
  Gift: "Regalo",
  Flower2: "Flor",
  Crown: "Corona",
  Sun: "Sol",
  Moon: "Luna",
  Music: "Música",
  Palette: "Paleta",
  QrCode: "QR",
  Eye: "Preview",
  TreeDeciduous: "Árbol",
  BookImage: "Álbum",
  Map: "Mapa",
  Activity: "Actividad",
  Anchor: "Ancla",
  Bath: "Baño",
  Bell: "Campana",
  BicepsFlexed: "Fuerza",
  Bike: "Bici",
  Bird: "Pájaro",
  Car: "Coche",
  Cat: "Gato",
  Clover: "Trébol",
  Cloud: "Nube",
  CloudLightning: "Rayo",
  CloudRain: "Lluvia",
  Compass: "Brújula",
  Dog: "Perro",
  Feather: "Pluma",
  Footprints: "Huellas",
  Gamepad2: "Juego",
  Glasses: "Gafas",
  Globe2: "Mundo",
  Leaf: "Hoja",
  Library: "Librería",
  PartyPopper: "Fiesta",
  Plane: "Avión",
  Rocket: "Cohete",
  Sailboat: "Barco",
  Shirt: "Ropa",
  Snowflake: "Nieve",
  Tent: "Campamento",
  Timer: "Tiempo",
  Train: "Tren",
  Trophy: "Trofeo",
  Umbrella: "Paraguas",
  Video: "Video",
  Wand2: "Magia",
};

export const CARD_ICON_MAP: Record<string, LucideIcon> = {
  Heart, Sparkles, BookOpen, CalendarDays, Images, Image, Baby, Camera, Star, Smile, 
  Gift, Flower2, Crown, Sun, Moon, Music, Palette, QrCode, Eye, TreeDeciduous, 
  BookImage, Map, Activity, Anchor, Bath, Bell, BicepsFlexed, Bike, Bird, Car, 
  Cat, Clover, Cloud, CloudLightning, CloudRain, Compass, Dog, Feather, Footprints, 
  Gamepad2, Glasses, Globe2, Leaf, Library, PartyPopper, Plane, Rocket, Sailboat, 
  Shirt, Snowflake, Tent, Timer, Train, Trophy, Umbrella, Video, Wand2
};

export function normalizeCardStyle(style?: CardStyle | null): CardStyle {
  return {
    color: style?.color || null,
    icon: style?.icon || null,
    visible_items: style?.visible_items || null,
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
