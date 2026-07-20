"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BookOpen,
  BringToFront,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Edit3,
  FilePlus2,
  GripHorizontal,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Loader2,
  Mic,
  Minus,
  Move,
  Palette,
  PlayCircle,
  Plus,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  Save,
  SendToBack,
  Smile,
  Sparkles,
  Trash2,
  Type,
  Video,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TemplateId =
  | "cover_soft"
  | "cover_modern"
  | "cover_flora"
  | "blank_photo"
  | "dedication"
  | "month_divider"
  | "photo_story"
  | "collage_three"
  | "scrapbook_notes"
  | "full_photo"
  | "journal"
  | "lined_sheet"
  | "grid_sheet"
  | "dotted_sheet";

type AlbumElementType = "image" | "video" | "audio" | "text" | "sticker" | "shape" | "calendar";

interface PregnancyDigitalAlbumProps {
  childId: string;
  sectionId?: string | null;
  sectionTitle?: string;
  child: any;
  theme: any;
  isMobile: boolean;
  onBack: () => void;
  readOnly?: boolean;
}

interface PregnancyMemory {
  id: string;
  title: string;
  description?: string | null;
  memory_date?: string;
  month_number?: number | null;
  media_urls?: string[] | null;
  media_type?: string | null;
}

interface AlbumElement {
  id: string;
  type: AlbumElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  rotation?: number;
  url?: string;
  text?: string;
  fit?: "cover" | "contain";
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  opacity?: number;
  flipX?: boolean;
  radius?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  textStyle?: "none" | "bubble-round" | "bubble-square" | "ribbon";
  shape?: "none" | "circle" | "heart" | "star";
  frameStyle?: "none" | "polaroid" | "wood" | "white" | "film";
  edgeFade?: boolean;
  mediaStyle?: "dark" | "light" | "colorful" | "minimal";
  bgColor?: string;
  variable?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
}

interface AlbumPage {
  id?: string;
  child_id: string;
  section_id?: string | null;
  memory_id?: string | null;
  page_number: number;
  spread_number: number;
  page_kind: "cover" | "month_divider" | "stage_divider" | "memory" | "custom";
  side: "left" | "right" | "single";
  template_id: TemplateId;
  title?: string | null;
  subtitle?: string | null;
  month_number?: number | null;
  stage_label?: string | null;
  background_url?: string | null;
  background_color?: string | null;
  background_style?: "solid" | "lines" | "grid" | "dots";
  background_opacity?: number;
  content_json: AlbumElement[];
  layout_json?: Record<string, any>;
  thumbnail_url?: string | null;
  is_auto_generated?: boolean;
  is_locked?: boolean;
}

interface AssetItem {
  id: string;
  type: "sticker" | "background" | "tape";
  url: string;
  user_id?: string | null;
  is_global?: boolean | null;
}

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const templateBackgrounds: Record<TemplateId, { background_color?: string; background_style?: "solid" | "lines" | "grid" | "dots"; }> = {
  cover_soft: { background_color: "#FFF4F0", background_style: "solid" },
  cover_modern: { background_color: "#F4F6FF", background_style: "solid" },
  cover_flora: { background_color: "#F3F7F0", background_style: "solid" },
  blank_photo: { background_color: "#FFFDF8", background_style: "solid" },
  dedication: { background_color: "#FFF8F2", background_style: "solid" },
  month_divider: { background_color: "#FEF6F0", background_style: "solid" },
  photo_story: { background_color: "#FFFDF8", background_style: "solid" },
  collage_three: { background_color: "#FFFDF8", background_style: "solid" },
  scrapbook_notes: { background_color: "#FFFDF8", background_style: "solid" },
  full_photo: { background_color: "#FFFDF8", background_style: "solid" },
  journal: { background_color: "#FFFDF8", background_style: "solid" },
  lined_sheet: { background_color: "#FFFDF8", background_style: "lines" },
  grid_sheet: { background_color: "#FCFCF7", background_style: "grid" },
  dotted_sheet: { background_color: "#F8F8F4", background_style: "dots" },
};

const builtinTemplates: { id: TemplateId; label: string; hint: string; isDouble?: boolean }[] = [];

const fontStyles = [
  { id: "serif", label: "Elegante", family: "Georgia, serif" },
  { id: "playful", label: "Infantil", family: "'Comic Sans MS', 'Trebuchet MS', cursive" },
  { id: "clean", label: "Limpia", family: "Arial, sans-serif" },
  { id: "hand", label: "Manual", family: "'Segoe Print', 'Comic Sans MS', cursive" },
];

const FONTS = [
  { id: "f1", label: "Arial", family: "Arial, sans-serif" },
  { id: "f2", label: "Georgia", family: "Georgia, serif" },
  { id: "f8", label: "Comic Sans", family: "'Comic Sans MS', cursive, sans-serif" },
  { id: "f13", label: "Brush Script", family: "'Brush Script MT', cursive" },
  { id: "f17", label: "Typewriter", family: "'American Typewriter', serif" },
  { id: "f20", label: "Copperplate", family: "Copperplate, fantasy" },
  { id: "f24", label: "Baskerville", family: "Baskerville, serif" },
  { id: "f30", label: "Segoe UI", family: "'Segoe UI', sans-serif" },
  { id: "great-vibes", label: "Great Vibes", family: "'Great Vibes', cursive" },
  { id: "pacifico", label: "Pacifico", family: "'Pacifico', cursive" },
  { id: "cinzel", label: "Cinzel", family: "'Cinzel', serif" },
  { id: "dancing", label: "Dancing Script", family: "'Dancing Script', cursive" },
  { id: "satisfy", label: "Satisfy", family: "'Satisfy', cursive" },
  { id: "caveat", label: "Caveat", family: "'Caveat', cursive" },
  { id: "lora", label: "Lora", family: "'Lora', serif" },
  { id: "merriweather", label: "Merriweather", family: "'Merriweather', serif" },
  { id: "montserrat", label: "Montserrat", family: "'Montserrat', sans-serif" },
  { id: "playfair", label: "Playfair Display", family: "'Playfair Display', serif" },
  { id: "poppins", label: "Poppins", family: "'Poppins', sans-serif" },
  { id: "raleway", label: "Raleway", family: "'Raleway', sans-serif" },
  { id: "roboto", label: "Roboto", family: "'Roboto', sans-serif" },
  { id: "amatic", label: "Amatic SC", family: "'Amatic SC', cursive" },
  { id: "indie", label: "Indie Flower", family: "'Indie Flower', cursive" },
  { id: "shadows", label: "Shadows Into Light", family: "'Shadows Into Light', cursive" },
  { id: "architects", label: "Architects Daughter", family: "'Architects Daughter', cursive" },
];

const COLLAGE_PRESETS: Record<number, Partial<AlbumElement>[]> = {
  2: [
    { x: 5, y: 10, w: 42, h: 80, z: 1, rotation: 0 },
    { x: 53, y: 10, w: 42, h: 80, z: 1, rotation: 0 },
  ],
  3: [
    { x: 5, y: 8, w: 50, h: 50, z: 1, rotation: -1 },
    { x: 58, y: 8, w: 37, h: 35, z: 1, rotation: 2 },
    { x: 30, y: 60, w: 50, h: 35, z: 2, rotation: 1 },
  ],
  4: [
    { x: 5, y: 5, w: 43, h: 43, z: 1, rotation: 0 },
    { x: 52, y: 5, w: 43, h: 43, z: 1, rotation: 0 },
    { x: 5, y: 52, w: 43, h: 43, z: 1, rotation: 0 },
    { x: 52, y: 52, w: 43, h: 43, z: 1, rotation: 0 },
  ],
};

function getProxiedUrl(url?: string | null) {
  if (!url) return "";
  
  // Si la URL ya está envuelta en el proxy local, extraemos la URL real para evitar fallos del proxy del servidor
  if (url.includes("/api/download?url=")) {
    try {
      const urlObj = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      const realUrl = urlObj.searchParams.get("url");
      if (realUrl) {
        return realUrl;
      }
    } catch (e) {
      const parts = url.split("url=");
      if (parts.length > 1) {
        return decodeURIComponent(parts[1]);
      }
    }
  }

  if (url.startsWith("data:") || url.startsWith("/") || url.includes("localhost") || url.includes("127.0.0.1")) {
    return url;
  }
  return url;
}

function detectMediaType(url: string, fallback?: string | null): AlbumElementType {
  const lower = url.toLowerCase();
  if (lower.match(/\.(mp4|mov|webm|m4v|avi)$/) || lower.includes("/video/") || fallback === "video") return "video";
  if (lower.match(/\.(mp3|wav|ogg|m4a|aac)$/) || lower.includes("/audio/") || fallback === "audio") return "audio";
  return "image";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeText(value?: string | null, fallback = "") {
  return value && value.trim() ? value.trim() : fallback;
}

function firstMedia(memory?: PregnancyMemory | null) {
  return memory?.media_urls?.find(Boolean) || "";
}

function makeText(id: string, text: string, x: number, y: number, w: number, h: number, z: number, fontSize = 18, color = "#4A4238"): AlbumElement {
  return { id, type: "text", text, x, y, w, h, z, fontSize, color, fontFamily: "serif" };
}

function makeShape(id: string, x: number, y: number, w: number, h: number, z: number, color: string, opacity = 1, radius = 24): AlbumElement {
  return { id, type: "shape", x, y, w, h, z, color, opacity, radius };
}

function makeMedia(id: string, url: string, fallbackType: string | null | undefined, x: number, y: number, w: number, h: number, z: number, rotation = 0, fit: "cover" | "contain" = "cover"): AlbumElement {
  return { id, type: detectMediaType(url, fallbackType), url, x, y, w, h, z, rotation, fit, radius: 10 };
}

function buildTemplateElements(templateId: TemplateId, page: Partial<AlbumPage>, memory?: PregnancyMemory | null, child?: any, dbTemplates: any[] = []): AlbumElement[] {
  const media = (memory?.media_urls || []).filter(Boolean);
  const primary = media[0] || "";
  const secondary = media[1] || primary;
  const third = media[2] || secondary;
  const title = safeText(page.title || memory?.title, child?.name || "Mi bebe");
  const description = safeText(memory?.description, "Un recuerdo hermoso de esta etapa.");
  const date = memory?.memory_date ? new Date(memory.memory_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "";

  // Handle dynamic Database Templates
  const dbMatch = dbTemplates.find(t => t.id === templateId);
  if (dbMatch) {
    const isDouble = dbMatch.is_double_page;
    const sourceElements = (page.side === "right" && isDouble) ? (dbMatch.elements_right || []) : (dbMatch.elements_left || []);
    
    return sourceElements.map((el: any) => {
      let text = el.text || "";
      let url = el.url || "";
      
      if (el.type === "text") {
        if (el.variable === "title") text = title;
        else if (el.variable === "description") text = description;
        else if (el.variable === "date") text = date;
        else if (el.variable === "child_name") text = child?.name || "Mi Bebé";
      } else if (el.type === "image" || el.type === "video" || el.type === "audio") {
        if (el.variable === "photo_2") url = secondary;
        else if (el.variable === "photo_3") url = third;
        else if (el.variable === "photo_4") url = media[3] || third;
        else url = primary; // defaults to photo_1
      }
      
      // Coordinates in DB are already normalized to 0-100% of a single page (aspect 3/4)
      let x = el.x;
      let w = el.w;

      return {
        id: crypto.randomUUID(),
        type: el.type,
        x, y: el.y, w, h: el.h, z: el.z,
        rotation: el.rotation || 0,
        text,
        url,
        color: el.color || "#000000",
        fontSize: el.fontSize || 14,
        fontFamily: el.fontFamily || "serif",
        opacity: el.opacity ?? 1,
        radius: el.radius ?? 10,
        fit: el.fit || "cover",
        textStyle: el.textStyle,
        textAlign: el.textAlign,
        bgColor: el.bgColor,
        shape: el.shape,
        frameStyle: el.frameStyle,
        edgeFade: el.edgeFade,
        mediaStyle: el.mediaStyle,
      } as AlbumElement;
    });
  }

  if (templateId === "cover_soft") {
    return [
      makeShape("cover-wash", 7, 7, 86, 86, 0, "#F8E8E7", 0.55, 34),
      makeText("cover-label", "ALBUM DE EMBARAZO", 16, 15, 68, 8, 2, 13, "#B88680"),
      makeText("cover-title", child?.nickname || child?.name || "Mi bebe", 14, 31, 72, 18, 2, 30, "#4A4238"),
      makeText("cover-subtitle", "Cada latido, cada foto y cada pequeno milagro.", 19, 51, 62, 14, 2, 15, "#806F63"),
      ...(primary ? [makeMedia("cover-photo", primary, memory?.media_type, 26, 66, 48, 22, 1, -2)] : []),
    ];
  }

  if (templateId === "blank_photo") {
    return [
      makeShape("blank-frame", 14, 16, 72, 58, 0, "#FFFFFF", 0.72, 18),
      makeShape("blank-inner", 18, 20, 64, 50, 1, "#F6EFEA", 0.7, 14),
      makeText("blank-copy", "Arrastra una foto o un recuerdo aqui", 22, 43, 56, 8, 2, 15, "#B88680"),
      makeText("blank-caption", "Primera hoja del album", 24, 78, 52, 6, 2, 13, "#806F63"),
    ];
  }

  if (templateId === "dedication") {
    return [
      makeShape("dedication-wash", 9, 8, 82, 84, 0, "#F8E8E7", 0.32, 32),
      makeText("dedication-label", "DEDICATORIA", 18, 18, 64, 7, 2, 12, "#B88680"),
      makeText("dedication-title", `Para ${child?.nickname || child?.name || "mi bebe"}`, 14, 31, 72, 14, 2, 28, "#4A4238"),
      makeText(
        "dedication-body",
        "Este album guarda los dias en que empezamos a imaginarte, esperarte y amarte antes de tenerte en brazos.",
        17,
        50,
        66,
        24,
        2,
        16,
        "#806F63"
      ),
      makeText("dedication-sign", "Con amor", 48, 78, 34, 7, 2, 18, "#B88680"),
    ];
  }

  if (templateId === "month_divider") {
    const month = page.month_number ? monthNames[(page.month_number || 1) - 1] : "Nueva etapa";
    return [
      makeShape("divider-band", 0, 34, 100, 28, 0, "#F3DED7", 0.7, 0),
      makeText("divider-eyebrow", "CAPITULO", 18, 26, 64, 8, 2, 12, "#B88680"),
      makeText("divider-title", month, 12, 38, 76, 16, 2, 34, "#4A4238"),
      makeText("divider-copy", "Los recuerdos de este mes se acomodan aqui automaticamente.", 20, 58, 60, 12, 2, 14, "#806F63"),
    ];
  }

  if (templateId === "cover_modern") {
    return [
      makeShape("cover-modern-panel", 8, 10, 84, 82, 0, "#F1F5FF", 0.9, 32),
      makeText("cover-modern-label", "A L B U M", 12, 20, 76, 8, 2, 12, "#6E7CFF"),
      makeText("cover-modern-title", child?.nickname || child?.name || "Mi bebe", 12, 34, 76, 12, 2, 32, "#2F3A6C"),
      makeText("cover-modern-subtitle", "Historias suaves y recuerdos eternos", 12, 52, 76, 8, 2, 14, "#8C95BF"),
      makeShape("cover-modern-block", 12, 68, 24, 16, 1, "#6E7CFF", 0.2, 20),
      makeShape("cover-modern-dot", 68, 64, 16, 16, 1, "#6E7CFF", 0.25, 999),
    ];
  }

  if (templateId === "cover_flora") {
    return [
      makeShape("cover-flora-wash", 0, 0, 100, 100, 0, "#E9F5EE", 1, 0),
      makeShape("cover-flora-leaf", 10, 10, 24, 24, 1, "#C9E4D1", 1, 32),
      makeShape("cover-flora-leaf2", 70, 12, 18, 18, 1, "#D7E9D5", 1, 32),
      makeText("cover-flora-title", child?.nickname || child?.name || "Mi bebe", 14, 38, 72, 16, 2, 34, "#386C4D"),
      makeText("cover-flora-copy", "Un libro lleno de momentos naturales.", 14, 60, 72, 8, 2, 14, "#6E8A72"),
    ];
  }

  if (templateId === "lined_sheet") {
    const lines = Array.from({ length: 11 }, (_, index) =>
      makeShape(`lined-${index}`, 8, 16 + index * 7, 84, 0.4, 1, "#D8D2C4", 0.35, 0)
    );
    return [
      makeShape("lined-bg", 0, 0, 100, 100, 0, "#FFFDF8", 1, 0),
      ...lines,
      makeShape("lined-margin", 12, 12, 0.5, 76, 1, "#D8D2C4", 0.6, 0),
    ];
  }

  if (templateId === "grid_sheet") {
    const horizontal = Array.from({ length: 8 }, (_, index) =>
      makeShape(`grid-h-${index}`, 8, 14 + index * 10, 84, 0.3, 1, "#D8D2C4", 0.35, 0)
    );
    const vertical = Array.from({ length: 7 }, (_, index) =>
      makeShape(`grid-v-${index}`, 8 + index * 12, 12, 0.3, 76, 1, "#D8D2C4", 0.35, 0)
    );
    return [
      makeShape("grid-bg", 0, 0, 100, 100, 0, "#FCFCF7", 1, 0),
      ...horizontal,
      ...vertical,
    ];
  }

  if (templateId === "dotted_sheet") {
    const dots = Array.from({ length: 40 }, (_, index) => {
      const row = Math.floor(index / 8);
      const col = index % 8;
      return makeShape(`dot-${index}`, 10 + col * 10, 12 + row * 12, 1.2, 1.2, 1, "#BDB6AC", 1, 999);
    });
    return [
      makeShape("dots-bg", 0, 0, 100, 100, 0, "#F8F8F4", 1, 0),
      ...dots,
    ];
  }

  if (templateId === "collage_three") {
    return [
      makeText("collage-title", title, 10, 8, 80, 8, 3, 19, "#4A4238"),
      ...(primary ? [makeMedia("photo-main", primary, memory?.media_type, 10, 19, 52, 34, 1, -1)] : []),
      ...(secondary ? [makeMedia("photo-side", secondary, memory?.media_type, 66, 19, 24, 22, 1, 2)] : []),
      ...(third ? [makeMedia("photo-low", third, memory?.media_type, 37, 58, 53, 25, 1, 1)] : []),
      makeText("collage-date", date, 12, 86, 34, 5, 3, 10, "#B88680"),
      makeShape("collage-stamp", 69, 45, 14, 7, 2, "#F1C9BF", 0.75, 999),
    ];
  }

  if (templateId === "scrapbook_notes") {
    return [
      makeShape("tape-one", 11, 18, 20, 4, 4, "#E9CFC6", 0.9, 2),
      makeShape("tape-two", 64, 55, 20, 4, 4, "#D8E9E2", 0.9, 2),
      ...(primary ? [makeMedia("scrap-photo-a", primary, memory?.media_type, 12, 21, 38, 31, 1, -5)] : []),
      ...(secondary ? [makeMedia("scrap-photo-b", secondary, memory?.media_type, 49, 43, 39, 28, 1, 4)] : []),
      makeText("scrap-title", title, 52, 14, 36, 13, 3, 18, "#4A4238"),
      makeText("scrap-note", description, 14, 62, 39, 22, 3, 13, "#806F63"),
      makeText("scrap-date", date, 57, 74, 31, 5, 3, 10, "#B88680"),
    ];
  }

  if (templateId === "full_photo") {
    return [
      ...(primary ? [makeMedia("full-photo", primary, memory?.media_type, 6, 7, 88, 66, 1, 0)] : []),
      makeShape("full-caption-bg", 14, 75, 72, 13, 2, "#FFFFFF", 0.88, 18),
      makeText("full-title", title, 18, 77, 64, 5, 3, 16, "#4A4238"),
      makeText("full-date", date, 18, 83, 64, 4, 3, 10, "#B88680"),
    ];
  }

  return [
    makeText("journal-title", title, 12, 12, 76, 9, 2, 22, "#4A4238"),
    makeText("journal-date", date, 12, 23, 50, 5, 2, 10, "#B88680"),
    makeText("journal-body", description, 13, 34, 74, 32, 2, 15, "#5F5148"),
    ...(primary ? [makeMedia("journal-photo", primary, memory?.media_type, 24, 70, 52, 17, 1, -1)] : []),
  ];
}

export default function PregnancyDigitalAlbum({ childId, sectionId = null, sectionTitle, child, theme, isMobile, onBack, readOnly = false }: PregnancyDigitalAlbumProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memories, setMemories] = useState<PregnancyMemory[]>([]);
  const [savedPages, setSavedPages] = useState<AlbumPage[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [pageOverrides, setPageOverrides] = useState<Record<number, AlbumPage>>({});
  const [bookOpened, setBookOpened] = useState(false);
  const [editSidebarOpen, setEditSidebarOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [deletedPageNumbers, setDeletedPageNumbers] = useState<number[]>([]);
  const [pageSequence, setPageSequence] = useState<number[]>([]);
  const [bindingStyle, setBindingStyle] = useState<"none" | "spiral" | "stitch" | "leather">("none");
  const [manualPages, setManualPages] = useState<AlbumPage[]>([]);
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [draggedMemoryId, setDraggedMemoryId] = useState<string | null>(null);
  const [dropPreview, setDropPreview] = useState<"left" | "right" | "spread" | null>(null);
  const [zoom, setZoom] = useState(1);
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [photoPickerTarget, setPhotoPickerTarget] = useState<string | null>(null);
  const [sideSelectOpen, setSideSelectOpen] = useState<{ templateId: string; isDouble: boolean } | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [mediaModal, setMediaModal] = useState<{url: string, type: "image" | "video"} | null>(null);
  const [stickerAssets, setStickerAssets] = useState<any[]>([]);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [stickerModalTab, setStickerModalTab] = useState<"sticker" | "tape">("sticker");
  const [mediaPickerTab, setMediaPickerTab] = useState<"images" | "videos" | "audio">("images");
  const [snapLineX, setSnapLineX] = useState<{ pageNumber: number; x: number } | null>(null);
  const [snapLineY, setSnapLineY] = useState<{ pageNumber: number; y: number } | null>(null);
  const dragRef = useRef<{
    pageNumber: number;
    elementId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
  } | null>(null);
  const resizeRef = useRef<{
    pageNumber: number;
    elementId: string;
    handle: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    originW: number;
    originH: number;
    width: number;
    height: number;
  } | null>(null);

  async function loadAlbumData() {
    setLoading(true);
    try {
      const memoriesQuery = supabase
        .from("pregnancy_memories")
        .select("*")
        .eq("child_id", childId);
      if (sectionId) {
        memoriesQuery.eq("section_id", sectionId);
      } else {
        memoriesQuery.is("section_id", null);
      }

      const pagesQuery = supabase
        .from("pregnancy_album_pages")
        .select("*")
        .eq("child_id", childId);
      if (sectionId) {
        pagesQuery.eq("section_id", sectionId);
      } else {
        pagesQuery.is("section_id", null);
      }

      const [memoriesRes, pagesRes, assetsRes, templatesRes] = await Promise.all([
        memoriesQuery.order("memory_date", { ascending: true }),
        pagesQuery.order("page_number", { ascending: true }),
        supabase
          .from("assets")
          .select("*")
          .in("type", ["sticker", "background", "tape"]),
        supabase
          .from("album_templates")
          .select("*"),
      ]);

      const realMemories = (memoriesRes.data || []).filter(
        (memory: PregnancyMemory) => memory.title && memory.title.trim() !== "" && !memory.title.includes("Galería")
      );

      setMemories(realMemories);
      setDbTemplates(templatesRes.data || []);
      setSavedPages(((pagesRes.data || []) as AlbumPage[]).map((page) => ({
        ...page,
        content_json: Array.isArray(page.content_json) ? page.content_json : [],
      })));
      setAssets((assetsRes.data || []) as AssetItem[]);
      setStickerAssets((assetsRes.data || []).filter((a: any) => a.type === "sticker" || a.type === "tape"));

      // Collect all gallery media from all memories
      const allMedia: string[] = [];
      (memoriesRes.data || []).forEach((m: any) => {
        (m.media_urls || []).forEach((url: string) => {
          if (url && !allMedia.includes(url)) allMedia.push(url);
        });
      });
      setGalleryPhotos(allMedia);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlbumData();
  }, [childId, sectionId]);

  const autoPages = useMemo(() => {
    const savedByNumber = new Map(savedPages.map((page) => [page.page_number, page]));
    const pages: AlbumPage[] = [];
    let pageNumber = 1;

    // Only memories generate pages
    const sortedMemories = [...memories].sort((a, b) => {
      const dateA = a.memory_date ? new Date(a.memory_date).getTime() : 0;
      const dateB = b.memory_date ? new Date(b.memory_date).getTime() : 0;
      return dateA - dateB;
    });

    sortedMemories.forEach((memory, index) => {
      const firstTemplate: TemplateId = memory.media_urls && memory.media_urls.length >= 3 ? "collage_three" : index % 2 === 0 ? "photo_story" : "scrapbook_notes";
      pages.push(createPage(pageNumber++, "memory", getSide(pageNumber), firstTemplate, memory.id, memory.title, memory.description || "", memory));
    });

    const allBasePages = [
      createPage(0, "cover", "single", "cover_soft", null, sectionTitle || "Mi Album de Embarazo", child?.name || "", memories.find((memory) => firstMedia(memory)) || memories[0]),
      ...pages,
      ...manualPages
    ];

    const basePageNumbers = new Set(allBasePages.map(p => p.page_number));
    savedPages.forEach(saved => {
      if (!basePageNumbers.has(saved.page_number)) {
        allBasePages.push(saved as AlbumPage);
      }
    });

    return allBasePages.map((page) => {
      const saved = savedByNumber.get(page.page_number);
      if (!saved) return page;
      return {
        ...page,
        ...saved,
        template_id: saved.template_id as TemplateId,
        content_json: Array.isArray(saved.content_json) ? saved.content_json : page.content_json,
        background_style: saved.layout_json?.background_style || saved.background_style || page.background_style || "solid",
        background_opacity: saved.layout_json?.background_opacity ?? saved.background_opacity ?? page.background_opacity ?? 1,
      };
    }).filter((page) => !deletedPageNumbers.includes(page.page_number));
  }, [child?.name, child?.nickname, childId, deletedPageNumbers, manualPages, memories, savedPages, dbTemplates]);

  const allTemplates = useMemo(() => {
    return [
      ...builtinTemplates,
      ...dbTemplates.map((t: any) => ({
        id: t.id,
        label: t.name,
        hint: t.is_double_page ? "Doble Hoja (Editor)" : "Una Hoja (Editor)",
        isDouble: t.is_double_page
      }))
    ];
  }, [dbTemplates]);

  const pages = useMemo(() => autoPages.filter(p => p.page_number !== 0).map((page) => pageOverrides[page.page_number] || page), [autoPages, pageOverrides]);

  useEffect(() => {
    const coverPage = savedPages.find(p => p.page_number === 0);
    const savedSequence = coverPage?.layout_json?.pageSequence as number[] | undefined;
    
    const pageIds = pages.map((p) => p.page_number);
    const sortedKey = pageIds.slice().sort((a, b) => a - b).join(",");
    
    setPageSequence((prev) => {
      const prevKey = prev.slice().sort((a, b) => a - b).join(",");
      if (prevKey === sortedKey && prev.length === pageIds.length) {
        return prev;
      }
      
      let newSequence = [...pageIds];
      if (savedSequence && Array.isArray(savedSequence)) {
        const existingSaved = savedSequence.filter(id => pageIds.includes(id));
        const newPages = pageIds.filter(id => !savedSequence.includes(id));
        newSequence = [...existingSaved, ...newPages];
      }
      return newSequence;
    });
  }, [pages, savedPages]);

  const orderedPages = useMemo(() => {
    if (pageSequence.length !== pages.length) return pages;
    return [...pages].sort((a, b) => pageSequence.indexOf(a.page_number) - pageSequence.indexOf(b.page_number));
  }, [pages, pageSequence]);

  const spreadStarts = useMemo(() => {
    const starts: number[] = [];
    for (let i = 0; i < orderedPages.length; i += isMobile ? 1 : 2) starts.push(i);
    return starts;
  }, [isMobile, orderedPages.length]);

  const coverPage = pageOverrides[0] || autoPages.find(p => p.page_number === 0)!;

  const visiblePages = orderedPages.slice(spreadStarts[spreadIndex] || 0, (spreadStarts[spreadIndex] || 0) + (isMobile ? 1 : 2));
  const selectedPage = selectedPageNumber === 0 ? coverPage : orderedPages.find((page) => page.page_number === selectedPageNumber) || visiblePages[0];
  const selectedElement = selectedPage?.content_json.find((element) => element.id === selectedElementId) || null;

  function createPage(
    pageNumber: number,
    pageKind: AlbumPage["page_kind"],
    side: AlbumPage["side"],
    templateId: TemplateId,
    memoryId: string | null,
    title: string | null,
    subtitle: string | null,
    memory?: PregnancyMemory | null,
    month?: number
  ): AlbumPage {
    const page: AlbumPage = {
      child_id: childId,
      section_id: sectionId,
      memory_id: memoryId,
      page_number: pageNumber,
      spread_number: Math.ceil(pageNumber / 2),
      page_kind: pageKind,
      side,
      template_id: templateId,
      title,
      subtitle,
      month_number: month || memory?.month_number || null,
      background_color: "#FFFDF8",
      content_json: [],
      layout_json: {},
      is_auto_generated: true,
    };
    return { ...page, content_json: buildTemplateElements(templateId, page, memory, child, dbTemplates) };
  }

  function getSide(nextPageNumber: number): AlbumPage["side"] {
    return nextPageNumber % 2 === 0 ? "left" : "right";
  }

  function getNextPageNumber() {
    return Math.max(0, ...pages.map((page) => page.page_number), ...manualPages.map((page) => page.page_number)) + 1;
  }

  const updatePage = useCallback((pageNumber: number, updater: (page: AlbumPage) => AlbumPage) => {
    setPageOverrides((prev) => {
      let current: AlbumPage | undefined = prev[pageNumber];
      if (!current) {
        current = autoPages.find(p => p.page_number === pageNumber);
        if (!current && pageNumber === 0) current = autoPages.find(p => p.page_number === 0)!;
      }
      if (!current) return prev;
      const updated = updater({ ...current, content_json: current.content_json.map((element: AlbumElement) => ({ ...element })) });
      return { ...prev, [pageNumber]: updated };
    });
  }, [autoPages]);

  const updateElement = useCallback((pageNumber: number, elementId: string, updater: (element: AlbumElement) => AlbumElement) => {
    updatePage(pageNumber, (page: AlbumPage) => ({
      ...page,
      content_json: page.content_json.map((element: AlbumElement) => (element.id === elementId ? updater({ ...element }) : element)),
    }));
  }, [updatePage]);

  function getTemplateBackground(templateId: TemplateId, page: AlbumPage, dbTpl?: any) {
    if (dbTpl) {
      return {
        background_color: dbTpl.background_color || "#FFFDF8",
        background_url: dbTpl.background_url || null,
        background_style: dbTpl.background_style || "solid",
      };
    }
    return {
      background_color: templateBackgrounds[templateId]?.background_color || "#FFFDF8",
      background_style: templateBackgrounds[templateId]?.background_style || "solid",
      background_url: null,
    };
  }

  function applyTemplate(templateId: TemplateId, targetSide?: "left" | "right", targetPageNumber?: number) {
    const dbTpl = dbTemplates.find((t: any) => t.id === templateId);
    const isDouble = dbTpl?.is_double_page;
    const page = targetPageNumber !== undefined ? (targetPageNumber === 0 ? coverPage : pages.find((p) => p.page_number === targetPageNumber)) : (selectedPage || visiblePages[0]);
    if (!page) return;

    if (isDouble && !isMobile && visiblePages.length >= 2 && targetPageNumber === undefined) {
      const memoryL = memories.find((item) => item.id === visiblePages[0].memory_id);
      const memoryR = memories.find((item) => item.id === visiblePages[1].memory_id) || memoryL;
      updatePage(visiblePages[0].page_number, (page) => ({
        ...page,
        template_id: templateId,
        ...getTemplateBackground(templateId, page, dbTpl),
        content_json: buildTemplateElements(templateId, { ...page, side: "left" }, memoryL, child, dbTemplates),
      }));
      updatePage(visiblePages[1].page_number, (page) => ({
        ...page,
        template_id: templateId,
        ...getTemplateBackground(templateId, page, dbTpl),
        content_json: buildTemplateElements(templateId, { ...page, side: "right" }, memoryR, child, dbTemplates),
      }));
    } else {
      const memory = memories.find((item) => item.id === page.memory_id);
      updatePage(page.page_number, (p) => ({
        ...p,
        template_id: templateId,
        ...getTemplateBackground(templateId, p, dbTpl),
        content_json: buildTemplateElements(templateId, p, memory, child, dbTemplates),
      }));
    }
    setSelectedElementId(null);
  }

  function handleTemplateClick(templateId: string, targetPageNumber?: number) {
    const dbTpl = dbTemplates.find((t: any) => t.id === templateId);
    const isDouble = dbTpl?.is_double_page;
    if (!isDouble && !isMobile && visiblePages.length >= 2 && targetPageNumber === undefined) {
      setSideSelectOpen({ templateId, isDouble: false });
    } else {
      applyTemplate(templateId as TemplateId, undefined, targetPageNumber);
    }
  }

  function addCollage(count: number) {
    if (!selectedPage) return;
    const preset = COLLAGE_PRESETS[count] || COLLAGE_PRESETS[2];
    const newElements: AlbumElement[] = preset.map((p, i) => ({
      id: `collage-${Date.now()}-${i}`,
      type: "image" as AlbumElementType,
      x: p.x!, y: p.y!, w: p.w!, h: p.h!, z: p.z!,
      rotation: p.rotation || 0,
      radius: 10,
      fit: "cover" as const,
      variable: `photo_${i + 1}`,
    }));
    updatePage(selectedPage.page_number, (page) => ({
      ...page, content_json: [...page.content_json, ...newElements],
    }));
  }

  function addImageElement() {
    if (!selectedPage) return;
    const id = `img-${Date.now()}`;
    updatePage(selectedPage.page_number, (page) => ({
      ...page, content_json: [...page.content_json, { id, type: "image" as AlbumElementType, x: 20, y: 20, w: 40, h: 40, z: 10, rotation: 0, radius: 10, fit: "cover" as const }],
    }));
    setSelectedElementId(id);
  }

  function addVideoElement() {
    if (!selectedPage) return;
    const id = `vid-${Date.now()}`;
    updatePage(selectedPage.page_number, (page) => ({
      ...page, content_json: [...page.content_json, { id, type: "video" as AlbumElementType, x: 15, y: 25, w: 50, h: 35, z: 10, rotation: 0, mediaStyle: "dark" as const }],
    }));
    setSelectedElementId(id);
  }

  function addAudioElement() {
    if (!selectedPage) return;
    const id = `aud-${Date.now()}`;
    updatePage(selectedPage.page_number, (page) => ({
      ...page, content_json: [...page.content_json, { id, type: "audio" as AlbumElementType, x: 20, y: 60, w: 50, h: 12, z: 10, rotation: 0, mediaStyle: "dark" as const }],
    }));
    setSelectedElementId(id);
  }

  function addShapeElement(color = "#F3DED7") {
    if (!selectedPage) return;
    const id = `shape-${Date.now()}`;
    updatePage(selectedPage.page_number, (page) => ({
      ...page, content_json: [...page.content_json, { id, type: "shape" as AlbumElementType, x: 20, y: 20, w: 40, h: 30, z: 0, color, opacity: 0.5, radius: 16 }],
    }));
    setSelectedElementId(id);
  }

  function addCalendarElement() {
    if (!selectedPage) return;
    const id = `cal-${Date.now()}`;
    const today = new Date();
    const dateText = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    updatePage(selectedPage.page_number, (page) => ({
      ...page,
      content_json: [...page.content_json, { 
        id, type: "calendar" as AlbumElementType, x: 10, y: 10, w: 50, h: 40, z: 10, 
        rotation: 0, color: "#333333", text: dateText
      }],
    }));
    setSelectedElementId(id);
  }

  function duplicateElement() {
    if (!selectedPage || !selectedElement) return;
    const newEl = { ...selectedElement, id: `dup-${Date.now()}`, x: selectedElement.x + 3, y: selectedElement.y + 3, z: selectedElement.z + 1 };
    updatePage(selectedPage.page_number, (page) => ({
      ...page, content_json: [...page.content_json, newEl],
    }));
    setSelectedElementId(newEl.id);
  }

  function deleteSelectedElement() {
    if (!selectedPage || !selectedElement) return;
    updatePage(selectedPage.page_number, (page) => ({
      ...page, content_json: page.content_json.filter((el) => el.id !== selectedElement.id),
    }));
    setSelectedElementId(null);
  }

  function changeZIndex(delta: number) {
    if (!selectedPage || !selectedElement) return;
    updateElement(selectedPage.page_number, selectedElement.id, (el) => ({
      ...el, z: Math.max(0, el.z + delta)
    }));
  }

  async function savePageSequenceToDb(newSequence: number[]) {
    const cover = savedPages.find(p => p.page_number === 0) || autoPages.find(p => p.page_number === 0);
    if (!cover) return;
    const layout = cover.layout_json || {};
    const payload = { ...layout, pageSequence: newSequence };
    
    await supabase.from("pregnancy_album_pages").upsert({
      child_id: childId,
      section_id: sectionId,
      page_number: 0,
      layout_json: payload,
      page_kind: "cover",
      side: "single",
      template_id: cover.template_id
    }, { onConflict: "child_id,page_number,section_id" });
    
    setSavedPages(prev => {
       const existingCoverIndex = prev.findIndex(p => p.page_number === 0);
       if (existingCoverIndex !== -1) {
          const newSaved = [...prev];
          newSaved[existingCoverIndex] = { ...newSaved[existingCoverIndex], layout_json: payload };
          return newSaved;
       } else {
          return [...prev, { ...cover, layout_json: payload }];
       }
    });
  }

  function movePageOrder(pageNumber: number, direction: "up" | "down") {
    const currentIndex = pageSequence.indexOf(pageNumber);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= pageSequence.length) return;
    const nextSequence = [...pageSequence];
    [nextSequence[currentIndex], nextSequence[targetIndex]] = [nextSequence[targetIndex], nextSequence[currentIndex]];
    setPageSequence(nextSequence);
    setSpreadIndex(Math.floor(targetIndex / (isMobile ? 1 : 2)));
    setSelectedPageNumber(pageNumber);
    savePageSequenceToDb(nextSequence);
  }

  function openPhotoPicker(elementId: string) {
    setPhotoPickerTarget(elementId);
    setPhotoPickerOpen(true);
  }

  function pickPhoto(url: string) {
    if (!selectedPage || !photoPickerTarget) return;
    const mediaType = detectMediaType(url);
    updateElement(selectedPage.page_number, photoPickerTarget, (el) => ({ ...el, url, type: mediaType }));
    setPhotoPickerOpen(false);
    setPhotoPickerTarget(null);
  }

  function updateSelectedElement(patch: Partial<AlbumElement>) {
    if (!selectedPage || !selectedElement) return;
    updateElement(selectedPage.page_number, selectedElement.id, (el) => ({ ...el, ...patch }));
  }

  function addSticker(url: string) {
    if (!selectedPage) return;
    const id = `sticker-${Date.now()}`;
    updatePage(selectedPage.page_number, (page) => ({
      ...page,
      content_json: [
        ...page.content_json,
        { id, type: "sticker", url, x: 38, y: 38, w: 24, h: 18, z: 20, rotation: -4, fit: "contain" },
      ],
    }));
    setSelectedElementId(id);
  }

  function addText() {
    if (!selectedPage) return;
    const id = `text-${Date.now()}`;
    updatePage(selectedPage.page_number, (page) => ({
      ...page,
      content_json: [...page.content_json, makeText(id, "Nuevo texto", 18, 42, 64, 12, 25, 16, "#4A4238")],
    }));
    setSelectedElementId(id);
  }

  function addBlankPage(templateId: TemplateId = "blank_photo") {
    const pageNumber = getNextPageNumber();
    const page = createPage(pageNumber, "custom", getSide(pageNumber), templateId, null, "Nueva hoja", "Hoja editable", null);
    setManualPages((prev) => [...prev, page]);
    setBookOpened(true);
    setSpreadIndex(Math.floor((pages.length + manualPages.length) / (isMobile ? 1 : 2)));
  }

  function addSeparatorPage() {
    const pageNumber = getNextPageNumber();
    const page = createPage(pageNumber, "month_divider", getSide(pageNumber), "month_divider", null, "Nuevo separador", "Etapa editable", null);
    setManualPages((prev) => [...prev, page]);
    setBookOpened(true);
  }

  async function deletePage(page: AlbumPage) {
    if (page.page_number === 0) return;
    setDeletedPageNumbers((prev) => [...prev, page.page_number]);
    setManualPages((prev) => prev.filter((item) => item.page_number !== page.page_number));
    setPageOverrides((prev) => {
      const next = { ...prev };
      delete next[page.page_number];
      return next;
    });
    if (page.id) {
      await supabase.from("pregnancy_album_pages").delete().eq("id", page.id);
    }
  }

  function applyMemoryToSinglePage(page: AlbumPage, memory: PregnancyMemory, templateId?: TemplateId) {
    const nextTemplate = templateId || ((memory.media_urls?.length || 0) >= 3 ? "collage_three" : "photo_story");
    updatePage(page.page_number, (current) => ({
      ...current,
      memory_id: memory.id,
      page_kind: "memory",
      template_id: nextTemplate,
      title: memory.title,
      subtitle: memory.description || "",
      month_number: memory.month_number || (memory.memory_date ? new Date(memory.memory_date).getMonth() + 1 : current.month_number),
      content_json: buildTemplateElements(nextTemplate, { ...current, title: memory.title }, memory, child),
    }));
  }

  function applyMemoryDrop(target: "left" | "right" | "spread") {
    const memory = memories.find((item) => item.id === draggedMemoryId);
    if (!memory || visiblePages.length === 0) return;
    if (target === "spread" && visiblePages.length > 1) {
      applyMemoryToSinglePage(visiblePages[0], memory, "full_photo");
      applyMemoryToSinglePage(visiblePages[1], memory, "journal");
    } else {
      const page = target === "right" && visiblePages[1] ? visiblePages[1] : visiblePages[0];
      applyMemoryToSinglePage(page, memory);
    }
    setDraggedMemoryId(null);
    setDropPreview(null);
  }

  async function savePage(pageToSave?: AlbumPage) {
    const page = pageToSave || selectedPage;
    if (!page) return;
    setSaving(true);
    try {
      const payload = {
        child_id: childId,
        section_id: sectionId,
        memory_id: page.memory_id,
        page_number: page.page_number,
        spread_number: Math.ceil(page.page_number / 2),
        page_kind: page.page_kind,
        side: page.side,
        template_id: page.template_id,
        title: page.title,
        subtitle: page.subtitle,
        month_number: page.month_number,
        stage_label: page.stage_label,
        background_url: page.background_url,
        background_color: page.background_color || "#FFFDF8",
        content_json: page.content_json,
        layout_json: {
          ...(page.layout_json || {}),
          background_style: page.background_style || "solid",
          background_opacity: page.background_opacity ?? 1,
        },
        thumbnail_url: page.thumbnail_url,
        is_auto_generated: false,
        is_locked: page.is_locked || false,
      };
      const { data, error } = await supabase
        .from("pregnancy_album_pages")
        .upsert(payload, { onConflict: "child_id,page_number,section_id" })
        .select()
        .single();
      if (error) throw error;

      const normalized = { ...(data as AlbumPage), content_json: Array.isArray(data.content_json) ? data.content_json : page.content_json };
      setSavedPages((prev) => [normalized, ...prev.filter((item) => item.page_number !== normalized.page_number)].sort((a, b) => a.page_number - b.page_number));
      setPageOverrides((prev) => {
        const next = { ...prev };
        delete next[page.page_number];
        return next;
      });
    } finally {
      setSaving(false);
    }
  }

  function startDrag(pageNumber: number, element: AlbumElement, event: ReactPointerEvent<HTMLElement>) {
    if (!editMode) return;
    const pageRect = event.currentTarget.closest("[data-album-page]")?.getBoundingClientRect();
    if (!pageRect) return;
    event.stopPropagation();
    setSelectedPageNumber(pageNumber);
    setSelectedElementId(element.id);
    dragRef.current = {
      pageNumber,
      elementId: element.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: element.x,
      originY: element.y,
      width: pageRect.width,
      height: pageRect.height,
    };
  }

  function startResize(pageNumber: number, element: AlbumElement, handle: string, event: ReactPointerEvent<HTMLElement>) {
    if (!editMode) return;
    const pageRect = event.currentTarget.closest("[data-album-page]")?.getBoundingClientRect();
    if (!pageRect) return;
    event.stopPropagation();
    setSelectedPageNumber(pageNumber);
    setSelectedElementId(element.id);
    resizeRef.current = {
      pageNumber,
      elementId: element.id,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      originX: element.x,
      originY: element.y,
      originW: element.w,
      originH: element.h,
      width: pageRect.width,
      height: pageRect.height,
    };
  }

  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (dragRef.current) {
        const drag = dragRef.current;
        const dx = ((event.clientX - drag.startX) / drag.width) * 100;
        const dy = ((event.clientY - drag.startY) / drag.height) * 100;
        
        updateElement(drag.pageNumber, drag.elementId, (element) => {
          let newX = drag.originX + dx;
          let newY = drag.originY + dy;
          
          // Center Snap checks (50% center of the page)
          const elementCenterX = newX + element.w / 2;
          const elementCenterY = newY + element.h / 2;
          
          let snappedX = false;
          let snappedY = false;
          
          if (Math.abs(elementCenterX - 50) < 2.0) {
            newX = 50 - element.w / 2;
            snappedX = true;
          }
          if (Math.abs(elementCenterY - 50) < 2.0) {
            newY = 50 - element.h / 2;
            snappedY = true;
          }
          
          setSnapLineX(snappedX ? { pageNumber: drag.pageNumber, x: 50 } : null);
          setSnapLineY(snappedY ? { pageNumber: drag.pageNumber, y: 50 } : null);
          
          return {
            ...element,
            x: clamp(newX, -10, 100 - Math.min(element.w, 90)),
            y: clamp(newY, -10, 100 - Math.min(element.h, 90)),
          };
        });
      } else if (resizeRef.current) {
        const resize = resizeRef.current;
        const dx = ((event.clientX - resize.startX) / resize.width) * 100;
        const dy = ((event.clientY - resize.startY) / resize.height) * 100;
        
        let { originX: x, originY: y, originW: w, originH: h } = resize;

        if (resize.handle.includes('e')) w += dx;
        if (resize.handle.includes('s')) h += dy;
        if (resize.handle.includes('w')) {
          w -= dx;
          x += dx;
        }
        if (resize.handle.includes('n')) {
          h -= dy;
          y += dy;
        }

        w = Math.max(5, w);
        h = Math.max(5, h);

        updateElement(resize.pageNumber, resize.elementId, (element) => ({
          ...element, x, y, w, h
        }));
      }
    }

    function onUp() {
      dragRef.current = null;
      resizeRef.current = null;
      setSnapLineX(null);
      setSnapLineY(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [updateElement]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!editMode || !selectedElementId || selectedPageNumber === null) return;

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.getAttribute("contenteditable") === "true")) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelectedElement();
      } else if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const step = event.shiftKey ? 5 : 1;
        let percentageDx = 0;
        let percentageDy = 0;
        if (event.key === "ArrowUp") percentageDy = -step;
        else if (event.key === "ArrowDown") percentageDy = step;
        else if (event.key === "ArrowLeft") percentageDx = -step;
        else if (event.key === "ArrowRight") percentageDx = step;

        updateElement(selectedPageNumber, selectedElementId, (el) => ({
          ...el,
          x: clamp(el.x + percentageDx, -10, 100 - Math.min(el.w, 90)),
          y: clamp(el.y + percentageDy, -10, 100 - Math.min(el.h, 90))
        }));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editMode, selectedElementId, selectedPageNumber, updateElement]);

  const canPrev = spreadIndex > 0;
  const canNext = spreadIndex < spreadStarts.length - 1;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin" size={42} style={{ color: theme.hex }} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} overflow-hidden`}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Cinzel:wght@400..900&family=Dancing+Script:wght@400..700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300..900;1,300..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Poppins:ital,wght@0,100..900;1,100..900&family=Raleway:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100..900;1,100..900&family=Amatic+SC:wght@400;700&family=Indie+Flower&family=Shadows+Into+Light&family=Architects+Daughter&display=swap');`}</style>
      <div className="h-full min-h-screen flex flex-col">
        <header className="shrink-0 px-4 md:px-8 py-3 bg-white/80 backdrop-blur-xl border-b border-white/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button onClick={onBack} className={`p-2.5 bg-white ${theme.text} rounded-2xl shadow-sm border ${theme.borderAccent} hover:scale-105 transition-all`}>
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0">
              <h2 className={`text-sm md:text-2xl font-black ${theme.text} tracking-tighter italic truncate`}>Álbum Digital</h2>
              <p className={`hidden md:block text-[10px] font-black uppercase tracking-[0.22em] ${theme.text} opacity-40`}>{pages.length} páginas generadas desde recuerdos</p>
            </div>
          </div>

          <div className={`flex items-center gap-1 md:gap-2 bg-white rounded-2xl px-2 py-1 shadow-sm border ${theme.borderAccent}`}>
            <ZoomOut size={14} className={`${theme.text} opacity-30`} />
            <input
              type="range"
              min="0.75"
              max="1.45"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-14 sm:w-24 md:w-36 cursor-pointer"
              style={{ accentColor: theme.hex }}
            />
            <ZoomIn size={14} className={`${theme.text} opacity-30`} />
            <span className={`w-10 text-right text-[10px] font-black ${theme.text} opacity-40`}>{Math.round(zoom * 100)}%</span>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditMode((value) => {
                    const next = !value;
                    setEditSidebarOpen(next);
                    return next;
                  });
                  setSelectedPageNumber(visiblePages[0]?.page_number || null);
                  setSelectedElementId(null);
                }}
                className={`px-3 md:px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 transition-all ${editMode ? `${theme.primaryBg} ${theme.textActive}` : `bg-white ${theme.text} border ${theme.borderAccent}`}`}
              >
                {editMode ? <X size={15} /> : <Edit3 size={15} />}
                {editMode ? "Cerrar" : "Editar"}
              </button>
              {editMode && (
                <button
                  onClick={() => setEditSidebarOpen((value) => !value)}
                  className={`px-3 md:px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 transition-all ${editSidebarOpen ? `bg-white ${theme.text} border ${theme.borderAccent}` : `${theme.primaryBg} ${theme.textActive}`}`}
                >
                  <LayoutTemplate size={15} />
                  Herramientas
                </button>
              )}
              {editMode && (
                <button
                  onClick={() => savePage()}
                  disabled={saving || !selectedPage}
                  className={`px-3 md:px-5 py-2.5 ${theme.primaryBg} ${theme.textActive} rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 disabled:opacity-40`}
                >
                  {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                  Guardar
                </button>
              )}
            </div>
          )}
        </header>

        <main className="relative flex-1 min-h-0">
          <AnimatePresence>
          {editMode && editSidebarOpen && (
            <motion.aside
              initial={{ x: -340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -340, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed left-0 top-[65px] bottom-0 z-50 w-[min(88vw,340px)] bg-white/90 backdrop-blur-xl border-r border-white/70 p-4 md:p-5 overflow-y-auto shadow-2xl"
            >
              <EditPanel
                selectedPage={selectedPage}
                selectedElement={selectedElement}
                templates={allTemplates}
                assets={assets}
                pages={[coverPage, ...orderedPages]}
                memories={memories}
                onApplyTemplate={handleTemplateClick}
                onAddSticker={addSticker}
                onAddText={addText}
                onAddBlankPage={addBlankPage}
                onAddSeparatorPage={addSeparatorPage}
                onAddCollage={addCollage}
                onAddImage={addImageElement}
                onAddVideo={addVideoElement}
                onAddAudio={addAudioElement}
                onAddShape={addShapeElement}
                onAddCalendar={addCalendarElement}
                onOpenStickerModal={() => setShowStickerModal(true)}
                onMovePageOrder={movePageOrder}
                onJumpToPage={(pageNumber) => {
                  if (pageNumber === 0) {
                    setBookOpened(false);
                    setSelectedPageNumber(0);
                    setSelectedElementId(null);
                    return;
                  }
                  const pageIndex = orderedPages.findIndex((page) => page.page_number === pageNumber);
                  if (pageIndex >= 0) {
                    setBookOpened(true);
                    setSpreadIndex(Math.floor(pageIndex / (isMobile ? 1 : 2)));
                    setSelectedPageNumber(pageNumber);
                  }
                }}
                onOpenTemplates={() => setTemplateModalOpen(true)}
                onDragMemory={(id) => {
                  setDraggedMemoryId(id);
                  setBookOpened(true);
                }}
                onUpdateElement={(updater) => selectedPage && selectedElement && updateElement(selectedPage.page_number, selectedElement.id, updater)}
                onSetBackground={(value, isImage) => selectedPage && updatePage(selectedPage.page_number, (page) => ({
                  ...page,
                  background_color: isImage ? page.background_color || "#FFFDF8" : value,
                  background_url: isImage ? value : null,
                  background_style: isImage ? page.background_style : "solid",
                }))}
                onSetBackgroundStyle={(style) => selectedPage && updatePage(selectedPage.page_number, (page) => ({
                  ...page,
                  background_style: style,
                }))}
                onSetBackgroundOpacity={(opacity) => selectedPageNumber !== null && updatePage(selectedPageNumber, (p) => ({ ...p, bg_opacity: opacity }))}
                bindingStyle={bindingStyle}
                onSetBindingStyle={setBindingStyle}
                theme={theme}
              />
            </motion.aside>
          )}
          </AnimatePresence>

          <section className="h-[calc(100vh-65px)] min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 flex items-center justify-center p-2 md:p-4 overflow-auto">
              <div className="relative w-full h-full flex items-center justify-center">
                {bookOpened && (
                <button
                  onClick={() => canPrev && setSpreadIndex((value) => value - 1)}
                  disabled={!canPrev}
                  className="absolute left-0 md:-left-2 z-20 p-3 bg-white/90 rounded-full shadow-xl disabled:opacity-20"
                  style={{ color: theme.hex }}
                >
                  <ChevronLeft size={22} />
                </button>
                )}

                <AnimatePresence mode="wait">
                  {!bookOpened ? (
                    <ClosedBookCover
                      page={coverPage}
                      isMobile={isMobile}
                      zoom={zoom}
                      editMode={editMode}
                      selectedPageNumber={selectedPageNumber}
                      selectedElementId={selectedElementId}
                      bindingStyle={bindingStyle}
                      theme={theme}
                      onSelectPage={() => setSelectedPageNumber(0)}
                      onSelectElement={setSelectedElementId}
                      onStartDrag={startDrag}
                      onStartResize={startResize}
                      onMediaClick={setMediaModal}
                      onUpdateElement={(el) => updateElement(coverPage.page_number, el.id, () => el)}
                      onOpen={() => {
                        setBookOpened(true);
                        setSpreadIndex(0);
                      }}
                      snapLineX={snapLineX}
                      snapLineY={snapLineY}
                    />
                  ) : (
                  <motion.div
                    key={`${spreadIndex}-${isMobile ? "m" : "d"}`}
                    initial={{ opacity: 0, rotateY: canPrev ? -38 : 38, y: 10 }}
                    animate={{ opacity: 1, rotateY: 0, y: 0 }}
                    exit={{ opacity: 0, rotateY: canNext ? -38 : 38, y: -10 }}
                    transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                    className={`relative origin-center ${isMobile ? "w-[min(86vw,430px)] aspect-[3/4]" : "h-[min(78vh,calc((100vw-72px)*0.5))] max-w-[calc(100vw-72px)] aspect-[3/2]"}`}
                    style={{ transform: `scale(${zoom})`, transformStyle: "preserve-3d" }}
                    onDragOver={(event) => {
                      if (!draggedMemoryId) return;
                      event.preventDefault();
                      const rect = event.currentTarget.getBoundingClientRect();
                      const ratio = (event.clientX - rect.left) / rect.width;
                      setDropPreview(ratio > 0.38 && ratio < 0.62 && !isMobile ? "spread" : ratio >= 0.5 ? "right" : "left");
                    }}
                    onDragLeave={() => setDropPreview(null)}
                    onDrop={(event) => {
                      event.preventDefault();
                      applyMemoryDrop(dropPreview || "left");
                    }}
                  >
                    <div className={`relative ${isMobile ? "aspect-[3/4]" : "w-full h-full"} bg-[#FDFBF7] shadow-[0_28px_70px_rgba(74,66,56,0.26)] ${isMobile ? "rounded-[1.4rem]" : "rounded-[1.1rem]"} ${!isMobile ? "flex" : ""} border border-white/80 overflow-hidden`}>
                      {dropPreview && (
                        <div className={`absolute inset-y-0 z-40 pointer-events-none ${dropPreview === "spread" ? "left-0 right-0" : dropPreview === "left" ? "left-0 w-1/2" : "right-0 w-1/2"}`} style={{ border: `5px solid ${theme.hex}b3`, backgroundColor: `${theme.hex}1a` }} />
                      )}
                      {!isMobile && bindingStyle === "none" && (
                        <>
                          <div className="absolute left-[50%] top-0 bottom-0 w-16 -translate-x-full z-[9999] pointer-events-none mix-blend-multiply" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.12), transparent)' }} />
                          <div className="absolute left-[50%] top-0 bottom-0 w-[2px] bg-black/15 z-[9999] pointer-events-none mix-blend-multiply" />
                          <div className="absolute left-[50%] top-0 bottom-0 w-16 z-[9999] pointer-events-none mix-blend-multiply" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)' }} />
                          <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-black/10 to-transparent z-[9999] pointer-events-none mix-blend-multiply" />
                        </>
                      )}
                      {/* SPIRAL BINDING - Realistic rings */}
                      {bindingStyle === "spiral" && !isMobile && (
                        <div className="absolute left-[50%] -translate-x-1/2 top-0 bottom-0 z-[9999] pointer-events-none flex flex-col items-center justify-between py-4" style={{ width: '32px' }}>
                          {Array.from({ length: 14 }).map((_, i) => (
                            <div key={i} className="relative" style={{ width: '28px', height: '28px' }}>
                              <div className="absolute inset-0 rounded-full border-[3px] border-[#3a3a3a]" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)' }} />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* STITCH BINDING */}
                      {bindingStyle === "stitch" && !isMobile && (
                        <div className="absolute left-[50%] -translate-x-1/2 top-0 bottom-0 z-[9999] pointer-events-none flex flex-col items-center justify-between py-6" style={{ width: '12px' }}>
                          <div className="absolute inset-y-6 w-[2px] bg-[#8B7D6B]/40 left-1/2 -translate-x-1/2" />
                          {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="w-[6px] h-[10px] bg-[#8B7D6B] rounded-sm" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                          ))}
                        </div>
                      )}
                      {/* LEATHER BINDING */}
                      {bindingStyle === "leather" && !isMobile && (
                        <div className="absolute left-[50%] -translate-x-1/2 top-0 bottom-0 z-[9999] pointer-events-none" style={{ width: '18px' }}>
                          <div className="absolute inset-0 bg-[#6B4226] rounded-sm" style={{ boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.4), inset 2px 0 6px rgba(0,0,0,0.4), 0 0 8px rgba(0,0,0,0.2)' }} />
                          <div className="absolute top-6 bottom-6 left-1/2 -translate-x-1/2 w-[1px] bg-[#8B6914]/40" />
                        </div>
                      )}

                      {visiblePages.map((page, index) => (
                        <AlbumPageView
                          key={page.page_number}
                          page={page}
                          isMobile={isMobile}
                          isLeft={!isMobile && index === 0}
                          editMode={editMode}
                          selectedPageNumber={selectedPageNumber}
                          selectedElementId={selectedElementId}
                          theme={theme}
                          onSelectPage={() => setSelectedPageNumber(page.page_number)}
                          onSelectElement={setSelectedElementId}
                          onStartDrag={startDrag}
                          onStartResize={startResize}
                          onDeletePage={() => deletePage(page)}
                          onMediaClick={setMediaModal}
                          onUpdateElement={(el) => updateElement(page.page_number, el.id, () => el)}
                          snapLineX={snapLineX}
                          snapLineY={snapLineY}
                        />
                      ))}

                      {!isMobile && visiblePages.length === 1 && <div className="w-1/2 h-full bg-[#FBF7F1]" />}
                    </div>
                  </motion.div>
                  )}
                </AnimatePresence>

                {mediaModal && (
                  <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center" onClick={() => setMediaModal(null)}>
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white p-2" onClick={() => setMediaModal(null)}><X size={32} /></button>
                    {mediaModal.type === "image" ? (
                      <img src={getProxiedUrl(mediaModal.url)} className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Pantalla completa" onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <video src={getProxiedUrl(mediaModal.url)} controls autoPlay className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                    )}
                  </div>
                )}

                {bookOpened && (
                <button
                  onClick={() => canNext && setSpreadIndex((value) => value + 1)}
                  disabled={!canNext}
                  className="absolute right-0 md:-right-2 z-20 p-3 bg-white/90 rounded-full shadow-xl disabled:opacity-20"
                  style={{ color: theme.hex }}
                >
                  <ChevronRight size={22} />
                </button>
                )}
              </div>
            </div>

            {bookOpened && (
            <div className="shrink-0 px-4 md:px-8 pb-3 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setBookOpened(false);
                  setSpreadIndex(0);
                  setSelectedElementId(null);
                }}
                className="w-8 h-8 rounded-full bg-white shadow-sm border flex items-center justify-center transition-colors"
                style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}
                aria-label="Volver a portada"
              >
                <Home size={15} />
              </button>
              {spreadStarts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSpreadIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === spreadIndex ? "w-8" : "w-2"}`}
                  style={{ backgroundColor: index === spreadIndex ? theme.hex : `${theme.hex}33` }}
                  aria-label={`Ir a pagina ${index + 1}`}
                />
              ))}
            </div>
            )}
          </section>
        </main>
      </div>
      <TemplatePreviewModal
        open={templateModalOpen}
        templates={allTemplates}
        dbTemplates={dbTemplates}
        theme={theme}
        onClose={() => setTemplateModalOpen(false)}
        onChoose={(templateId) => {
          handleTemplateClick(templateId);
          setTemplateModalOpen(false);
        }}
      />

      {/* FLOATING CANVA-STYLE TOOLBAR */}
      {editMode && selectedElement && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.2)] p-2 flex items-center gap-2 z-[9999] text-[11px] flex-wrap justify-center max-w-[95vw] border"
          style={{ borderColor: `${theme.hex}26` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* TEXT SPECIFIC */}
          {selectedElement.type === "text" && (
            <div className="flex items-center gap-2 border-r pr-2 mr-1 flex-wrap" style={{ borderColor: `${theme.hex}1f` }}>
              <select 
                value={selectedElement.variable || ""} 
                onChange={(e) => updateSelectedElement({ variable: e.target.value || undefined })} 
                className="px-2 py-1 rounded outline-none font-bold text-[10px] border"
                style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }}
              >
                <option value="">Manual</option>
                <option value="title">Título</option>
                <option value="description">Descripción</option>
                <option value="date">Fecha</option>
                <option value="child_name">Nombre bebé</option>
              </select>
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-[7px] font-black uppercase ${theme.text} opacity-50`}>Texto</span>
                <input type="color" value={selectedElement.color || "#4A4238"} onChange={(e) => updateSelectedElement({ color: e.target.value })} className="w-5 h-5 p-0 border-0 cursor-pointer rounded-full overflow-hidden shrink-0" />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-[7px] font-black uppercase ${theme.text} opacity-50`}>Fondo</span>
                <input type="color" value={selectedElement.bgColor || "#ffffff"} onChange={(e) => updateSelectedElement({ bgColor: e.target.value })} className="w-5 h-5 p-0 border-0 cursor-pointer rounded-full overflow-hidden shrink-0 shadow-sm" />
              </div>
              <div className="flex items-center rounded px-1 shrink-0 border" style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26` }}>
                <span className="text-[10px] font-bold mr-1 opacity-50" style={{ color: theme.hex }}>px</span>
                <input type="number" value={selectedElement.fontSize || 16} onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })} className="w-10 py-0.5 bg-transparent font-mono text-[11px] font-bold text-center outline-none" style={{ color: theme.hex }} />
              </div>
              <div className="relative shrink-0">
                <button 
                  onClick={() => setFontPickerOpen(!fontPickerOpen)} 
                  className="px-2 py-1 rounded font-bold min-w-[100px] text-left truncate text-[10px] border"
                  style={{ fontFamily: selectedElement.fontFamily, backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }}
                >
                  {FONTS.find(f => f.family === selectedElement.fontFamily)?.label || fontStyles.find(f => f.family === selectedElement.fontFamily)?.label || "Fuente"}
                </button>
                {fontPickerOpen && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-xl max-h-64 overflow-y-auto w-48 z-[9999] p-1 border" style={{ borderColor: `${theme.hex}26` }}>
                    {FONTS.map(f => (
                      <button 
                        key={f.id} 
                        onClick={() => { updateSelectedElement({ fontFamily: f.family }); setFontPickerOpen(false); }} 
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors border-b last:border-0 ${theme.text} hover:opacity-85`}
                        style={{ fontFamily: f.family, borderColor: `${theme.hex}0d` }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select 
                value={selectedElement.textStyle || "none"} 
                onChange={(e) => updateSelectedElement({ textStyle: e.target.value as any })} 
                className="px-2 py-1 rounded outline-none font-bold text-[10px] border"
                style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }}
              >
                <option value="none">Normal</option>
                <option value="bubble-round">Burbuja</option>
                <option value="bubble-square">Cuadrada</option>
                <option value="ribbon">Listón</option>
              </select>
              <div className="flex items-center rounded overflow-hidden border" style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26` }}>
                <button onClick={() => updateSelectedElement({ isBold: !selectedElement.isBold })} className="p-1 font-serif font-bold border-r" style={{ borderColor: `${theme.hex}26`, backgroundColor: selectedElement.isBold ? `${theme.hex}33` : 'transparent', color: selectedElement.isBold ? theme.hex : `${theme.hex}80` }}>B</button>
                <button onClick={() => updateSelectedElement({ isItalic: !selectedElement.isItalic })} className="p-1 font-serif italic border-r" style={{ borderColor: `${theme.hex}26`, backgroundColor: selectedElement.isItalic ? `${theme.hex}33` : 'transparent', color: selectedElement.isItalic ? theme.hex : `${theme.hex}80` }}>I</button>
                <button onClick={() => updateSelectedElement({ isUnderline: !selectedElement.isUnderline })} className="p-1 font-serif underline" style={{ backgroundColor: selectedElement.isUnderline ? `${theme.hex}33` : 'transparent', color: selectedElement.isUnderline ? theme.hex : `${theme.hex}80` }}>U</button>
              </div>
              <div className="flex items-center rounded overflow-hidden border" style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26` }}>
                <button onClick={() => updateSelectedElement({ textAlign: "left" })} className="p-1" style={{ backgroundColor: selectedElement.textAlign === "left" ? `${theme.hex}33` : 'transparent', color: selectedElement.textAlign === "left" ? theme.hex : `${theme.hex}80` }}><AlignLeft size={12}/></button>
                <button onClick={() => updateSelectedElement({ textAlign: "center" })} className="p-1 border-l border-r" style={{ borderColor: `${theme.hex}26`, backgroundColor: !selectedElement.textAlign || selectedElement.textAlign === "center" ? `${theme.hex}33` : 'transparent', color: !selectedElement.textAlign || selectedElement.textAlign === "center" ? theme.hex : `${theme.hex}80` }}><AlignCenter size={12}/></button>
                <button onClick={() => updateSelectedElement({ textAlign: "right" })} className="p-1 border-r" style={{ borderColor: `${theme.hex}26`, backgroundColor: selectedElement.textAlign === "right" ? `${theme.hex}33` : 'transparent', color: selectedElement.textAlign === "right" ? theme.hex : `${theme.hex}80` }}><AlignRight size={12}/></button>
                <button onClick={() => updateSelectedElement({ textAlign: "justify" })} className="p-1" style={{ backgroundColor: selectedElement.textAlign === "justify" ? `${theme.hex}33` : 'transparent', color: selectedElement.textAlign === "justify" ? theme.hex : `${theme.hex}80` }}><AlignJustify size={12}/></button>
              </div>
            </div>
          )}

          {/* IMAGE SPECIFIC - PHOTO PICKER */}
          {selectedElement.type === "image" && (
            <div className="flex items-center gap-2 border-r pr-2 mr-1" style={{ borderColor: `${theme.hex}1f` }}>
              <button 
                onClick={() => updateSelectedElement({ flipX: !selectedElement.flipX })} 
                className="p-1 rounded transition-colors hover:opacity-85" 
                style={{ color: selectedElement.flipX ? theme.hex : `${theme.hex}80` }} 
                title="Espejo"
              >
                <FlipHorizontal size={14} />
              </button>
              <button 
                onClick={() => openPhotoPicker(selectedElement.id)} 
                className="px-2 py-1 rounded font-bold text-[10px] flex items-center gap-1 shadow-sm hover:opacity-90"
                style={{ backgroundColor: theme.hex, color: '#fff' }}
              >
                <ImageIcon size={12} /> Elegir Foto
              </button>
              <select 
                value={selectedElement.shape || "none"} 
                onChange={(e) => updateSelectedElement({ shape: e.target.value as any })} 
                className="px-2 py-1 rounded outline-none font-bold text-[10px] border"
                style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }}
              >
                <option value="none">Rectángulo</option>
                <option value="circle">Círculo</option>
                <option value="heart">Corazón</option>
                <option value="star">Estrella</option>
              </select>
              <select 
                value={selectedElement.frameStyle || "none"} 
                onChange={(e) => updateSelectedElement({ frameStyle: e.target.value as any })} 
                className="px-2 py-1 rounded outline-none font-bold text-[10px] border"
                style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }}
              >
                <option value="none">Sin Marco</option>
                <option value="white">Blanco</option>
                <option value="polaroid">Polaroid</option>
                <option value="wood">Madera</option>
                <option value="film">Cinta</option>
              </select>
            </div>
          )}

          {/* AUDIO/VIDEO SPECIFIC */}
          {(selectedElement.type === "video" || selectedElement.type === "audio") && (
            <div className="flex items-center gap-2 border-r pr-2 mr-1" style={{ borderColor: `${theme.hex}1f` }}>
              <button 
                onClick={() => openPhotoPicker(selectedElement.id)} 
                className="px-2 py-1 rounded font-bold text-[10px] flex items-center gap-1 shadow-sm hover:opacity-90"
                style={{ backgroundColor: theme.hex, color: '#fff' }}
              >
                {selectedElement.type === "video" ? <Video size={12} /> : <Mic size={12} />} Elegir Archivo
              </button>
              <select 
                value={selectedElement.mediaStyle || "dark"} 
                onChange={(e) => updateSelectedElement({ mediaStyle: e.target.value as any })} 
                className="px-2 py-1 rounded outline-none font-bold text-[10px] border"
                style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }}
              >
                <option value="dark">Oscuro</option>
                <option value="light">Claro</option>
                <option value="colorful">Colorido</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          )}

          {/* CALENDAR SPECIFIC */}
          {selectedElement.type === "calendar" && (
            <div className="flex items-center gap-2 border-r pr-2 mr-1" style={{ borderColor: `${theme.hex}1f` }}>
              <input 
                type="date" 
                value={selectedElement.text || ""} 
                onChange={(e) => updateSelectedElement({ text: e.target.value })} 
                className="px-2 py-1 rounded outline-none font-bold text-[10px] border"
                style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }} 
              />
              <input type="color" value={selectedElement.color || "#333333"} onChange={(e) => updateSelectedElement({ color: e.target.value })} className="w-5 h-5 p-0 border-0 cursor-pointer rounded-full overflow-hidden shrink-0" />
              <div className="relative shrink-0">
                <button 
                  onClick={() => setFontPickerOpen(!fontPickerOpen)} 
                  className="px-2 py-1 rounded font-bold min-w-[100px] text-left truncate text-[10px] border"
                  style={{ fontFamily: selectedElement.fontFamily, backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }}
                >
                  {FONTS.find(f => f.family === selectedElement.fontFamily)?.label || fontStyles.find(f => f.family === selectedElement.fontFamily)?.label || "Fuente"}
                </button>
                {fontPickerOpen && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-xl max-h-64 overflow-y-auto w-48 z-[9999] p-1 border" style={{ borderColor: `${theme.hex}26` }}>
                    {FONTS.map(f => (
                      <button 
                        key={f.id} 
                        onClick={() => { updateSelectedElement({ fontFamily: f.family }); setFontPickerOpen(false); }} 
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors border-b last:border-0 ${theme.text} hover:opacity-85`}
                        style={{ fontFamily: f.family, borderColor: `${theme.hex}0d` }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* STICKER SPECIFIC */}
          {selectedElement.type === "sticker" && (
            <div className="flex items-center gap-2 border-r pr-2 mr-1" style={{ borderColor: `${theme.hex}1f` }}>
              <button 
                onClick={() => updateSelectedElement({ flipX: !selectedElement.flipX })} 
                className="p-1 rounded transition-colors hover:opacity-85" 
                style={{ color: selectedElement.flipX ? theme.hex : `${theme.hex}80` }}
                title="Espejo"
              >
                <FlipHorizontal size={14} />
              </button>
            </div>
          )}

          {/* LAYERS & ROTATION */}
          <div className="flex items-center gap-2 border-r pr-2 mr-1" style={{ borderColor: `${theme.hex}1f` }}>
            <div className="flex flex-col items-center">
              <span className={`text-[8px] font-black uppercase mb-0.5 opacity-55`} style={{ color: theme.hex }}>Capas</span>
              <div className="flex items-center gap-1">
                <button onClick={() => changeZIndex(-1)} className="p-1 rounded border hover:opacity-80" style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }} title="Atrás"><SendToBack size={11}/></button>
                <span className="font-mono w-4 text-center text-[10px]" style={{ color: theme.hex }}>{selectedElement.z}</span>
                <button onClick={() => changeZIndex(1)} className="p-1 rounded border hover:opacity-80" style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }} title="Adelante"><BringToFront size={11}/></button>
              </div>
            </div>
            <div className="flex flex-col items-center ml-1">
              <span className={`text-[8px] font-black uppercase mb-0.5 opacity-55`} style={{ color: theme.hex }}>Rotar</span>
              <div className="flex items-center rounded overflow-hidden border" style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26` }}>
                <button onClick={() => updateSelectedElement({ rotation: ((selectedElement.rotation || 0) - 15) % 360 })} className="p-1 hover:opacity-80" style={{ color: theme.hex }}><RotateCcw size={11} /></button>
                <input type="number" value={selectedElement.rotation || 0} onChange={(e) => updateSelectedElement({ rotation: Number(e.target.value) })} className="w-8 py-0.5 bg-transparent font-mono text-[10px] text-center outline-none border-l border-r" style={{ color: theme.hex, borderColor: `${theme.hex}26` }} />
                <button onClick={() => updateSelectedElement({ rotation: ((selectedElement.rotation || 0) + 15) % 360 })} className="p-1 hover:opacity-80" style={{ color: theme.hex }}><RotateCw size={11} /></button>
              </div>
            </div>
            <div className="flex flex-col items-center ml-1">
              <span className={`text-[8px] font-black uppercase mb-0.5 opacity-55`} style={{ color: theme.hex }}>Tamaño</span>
              <div className="flex items-center gap-1">
                <button onClick={() => updateSelectedElement({ w: Math.max(5, selectedElement.w - 2), h: Math.max(5, selectedElement.h - 2) })} className="p-1 rounded border hover:opacity-80" style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }} title="Reducir"><ZoomOut size={11}/></button>
                <button onClick={() => updateSelectedElement({ w: Math.min(200, selectedElement.w + 2), h: Math.min(200, selectedElement.h + 2) })} className="p-1 rounded border hover:opacity-80" style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }} title="Agrandar"><ZoomIn size={11}/></button>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-1">
            <button onClick={duplicateElement} className="p-1.5 rounded-lg transition-colors hover:opacity-85" style={{ color: theme.hex }} title="Duplicar"><Copy size={14} /></button>
            <button onClick={deleteSelectedElement} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 size={14} /></button>
          </div>
        </motion.div>
      )}

      {/* MEDIA PICKER MODAL */}
      <AnimatePresence>
        {photoPickerOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPhotoPickerOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-2xl p-6 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-black mb-3 tracking-tight" style={{ color: theme.hex }}>Elige un Archivo</h2>
              <div className="flex gap-1 mb-4">
                {(["images", "videos", "audio"] as const).map(tab => {
                  const icons = { images: <ImageIcon size={13} />, videos: <Video size={13} />, audio: <Mic size={13} /> };
                  const labels = { images: "Imágenes", videos: "Videos", audio: "Audio" };
                  return (
                    <button key={tab} onClick={() => setMediaPickerTab(tab)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors`} style={mediaPickerTab === tab ? { backgroundColor: theme.hex, color: '#fff' } : { backgroundColor: `${theme.hex}0d`, color: `${theme.hex}99` }}>
                      {icons[tab]} {labels[tab]}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto flex-1 custom-scrollbar pr-2">
                {galleryPhotos.filter(url => {
                  const mt = detectMediaType(url);
                  if (mediaPickerTab === "images") return mt === "image";
                  if (mediaPickerTab === "videos") return mt === "video";
                  return mt === "audio";
                }).map((url, i) => {
                  const mt = detectMediaType(url);
                  return (
                    <button key={i} onClick={() => pickPhoto(url)} className="aspect-square rounded-xl overflow-hidden border-2 border-transparent transition-all hover:scale-105 shadow-sm relative bg-black/5" style={{ ['--hover-border' as any]: theme.hex }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.hex)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}>
                      {mt === "video" ? (
                        <>
                          <video src={getProxiedUrl(url)} className="w-full h-full object-cover" muted preload="metadata" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20"><PlayCircle size={24} className="text-white" /></div>
                        </>
                      ) : mt === "audio" ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ backgroundColor: `${theme.hex}0d` }}>
                          <Volume2 size={24} style={{ color: `${theme.hex}80` }} />
                          <span className="text-[8px] font-bold truncate px-2 w-full text-center" style={{ color: `${theme.hex}66` }}>{url.split('/').pop()}</span>
                        </div>
                      ) : (
                        <img src={getProxiedUrl(url)} className="w-full h-full object-cover" alt="" />
                      )}
                    </button>
                  );
                })}
                {galleryPhotos.filter(url => {
                  const mt = detectMediaType(url);
                  if (mediaPickerTab === "images") return mt === "image";
                  if (mediaPickerTab === "videos") return mt === "video";
                  return mt === "audio";
                }).length === 0 && <p className="col-span-full text-center text-sm py-10 font-bold" style={{ color: `${theme.hex}59` }}>No hay {mediaPickerTab === "images" ? "imágenes" : mediaPickerTab === "videos" ? "videos" : "audios"} disponibles.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIDE SELECTION DIALOG */}
      <AnimatePresence>
        {sideSelectOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSideSelectOpen(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-black mb-4" style={{ color: theme.hex }}>\u00bfD\u00f3nde aplicar la plantilla?</h3>
              <div className="flex gap-3">
                <button onClick={() => { applyTemplate(sideSelectOpen.templateId as TemplateId, "left"); setSideSelectOpen(null); }} className="px-6 py-3 text-white rounded-xl font-black text-sm" style={{ backgroundColor: theme.hex }}>
                  \u2190 Hoja Izquierda
                </button>
                <button onClick={() => { applyTemplate(sideSelectOpen.templateId as TemplateId, "right"); setSideSelectOpen(null); }} className="px-6 py-3 text-white rounded-xl font-black text-sm" style={{ backgroundColor: `${theme.hex}cc` }}>
                  Hoja Derecha \u2192
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STICKER MODAL */}
      <AnimatePresence>
        {showStickerModal && (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowStickerModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-black mb-3" style={{ color: theme.hex }}>Elige un Elemento</h2>
              <div className="flex gap-1 mb-4">
                <button onClick={() => setStickerModalTab("sticker")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors`} style={stickerModalTab === "sticker" ? { backgroundColor: theme.hex, color: '#fff' } : { backgroundColor: `${theme.hex}0d`, color: `${theme.hex}99` }}>Stickers</button>
                <button onClick={() => setStickerModalTab("tape")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors`} style={stickerModalTab === "tape" ? { backgroundColor: theme.hex, color: '#fff' } : { backgroundColor: `${theme.hex}0d`, color: `${theme.hex}99` }}>Cintas</button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
                {stickerAssets.filter(s => s.type === stickerModalTab).map((s: any) => (
                  <button key={s.id} onClick={() => { addSticker(s.url); setShowStickerModal(false); }} className="aspect-square rounded-xl hover:scale-105 transition-all p-2 flex items-center justify-center" style={{ backgroundColor: `${theme.hex}0d` }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${theme.hex}1a`)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${theme.hex}0d`)}>
                    <img src={getProxiedUrl(s.url)} className="w-full h-full object-contain" alt="" />
                  </button>
                ))}
                {stickerAssets.filter(s => s.type === stickerModalTab).length === 0 && <p className="col-span-full text-center text-sm py-10 font-bold" style={{ color: `${theme.hex}59` }}>No hay elementos disponibles en esta categoría.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClosedBookCover({
  page,
  isMobile,
  zoom,
  editMode,
  selectedPageNumber,
  selectedElementId,
  onSelectPage,
  onSelectElement,
  onStartDrag,
  onStartResize,
  onOpen,
  onMediaClick,
  bindingStyle,
  onUpdateElement,
  theme,
  snapLineX,
  snapLineY,
}: {
  page: AlbumPage;
  isMobile: boolean;
  zoom: number;
  editMode: boolean;
  selectedPageNumber: number | null;
  selectedElementId: string | null;
  bindingStyle: "none" | "spiral" | "stitch" | "leather";
  onSelectPage: () => void;
  onSelectElement: (id: string | null) => void;
  onStartDrag: (pageNumber: number, element: AlbumElement, event: ReactPointerEvent<HTMLElement>) => void;
  onStartResize: (pageNumber: number, element: AlbumElement, handle: string, event: ReactPointerEvent<HTMLElement>) => void;
  onOpen: () => void;
  onMediaClick?: (media: {url: string, type: "image"|"video"}) => void;
  onUpdateElement?: (element: AlbumElement) => void;
  theme: any;
  snapLineX?: { pageNumber: number; x: number } | null;
  snapLineY?: { pageNumber: number; y: number } | null;
}) {
  return (
    <motion.div
      key="closed-cover"
      initial={{ opacity: 0, rotateY: -18, scale: 0.94 }}
      animate={{ opacity: 1, rotateY: 0, scale: zoom }}
      exit={{ opacity: 0, rotateY: -92, x: isMobile ? -20 : -80, transition: { duration: 0.75, ease: [0.4, 0, 0.2, 1] } }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      className={`relative origin-left ${isMobile ? "w-[min(84vw,420px)] aspect-[3/4]" : "h-[min(78vh,calc((100vw-72px)*0.62))] aspect-[3/4]"} rounded-r-[1.8rem] rounded-l-xl overflow-hidden shadow-[0_30px_80px_rgba(74,66,56,0.32)] border border-white/80 bg-[#FFFDF8] text-left`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Spine */}
      <div className="absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-[#C9A59C] to-[#F6DCD4] z-20 shadow-[inset_-8px_0_18px_rgba(0,0,0,0.16)] pointer-events-none" />
      {/* Spiral binding on cover - vertical ring strip */}
      {bindingStyle === "spiral" && (
        <div className="absolute left-5 top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center justify-between py-3" style={{ width: '20px' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="relative" style={{ width: '18px', height: '18px' }}>
              <div className="absolute inset-0 rounded-full border-[2.5px] border-[#3a3a3a]" style={{ boxShadow: '0 2px 3px rgba(0,0,0,0.3)' }} />
            </div>
          ))}
        </div>
      )}
      {bindingStyle === "stitch" && (
        <div className="absolute left-6 top-4 bottom-4 z-30 pointer-events-none flex flex-col items-center justify-between" style={{ width: '8px' }}>
          <div className="absolute inset-y-0 w-[1.5px] bg-[#8B7D6B]/40 left-1/2 -translate-x-1/2" />
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-[5px] h-[8px] bg-[#8B7D6B] rounded-sm" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
          ))}
        </div>
      )}
      {bindingStyle === "leather" && (
        <div className="absolute left-6 top-0 bottom-0 z-30 pointer-events-none" style={{ width: '10px' }}>
          <div className="absolute inset-0 bg-[#6B4226] rounded-r-sm" style={{ boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.4), 0 0 6px rgba(0,0,0,0.2)' }} />
        </div>
      )}
      <AlbumPageView
        page={page}
        isMobile
        isLeft={false}
        editMode={editMode}
        selectedPageNumber={selectedPageNumber}
        selectedElementId={selectedElementId}
        theme={theme}
        onSelectPage={onSelectPage}
        onSelectElement={onSelectElement}
        onStartDrag={onStartDrag}
        onStartResize={onStartResize}
        onDeletePage={() => undefined}
        onMediaClick={onMediaClick}
        onUpdateElement={onUpdateElement}
        snapLineX={snapLineX}
        snapLineY={snapLineY}
      />
      <button onClick={onOpen} className="absolute bottom-8 left-12 right-8 z-30 flex items-center justify-between group hover:opacity-80 transition-opacity">
        <span className={`text-[10px] font-black uppercase tracking-[0.28em] ${theme.text} opacity-50 group-hover:opacity-100 transition-opacity`}>Abrir Álbum</span>
        <span className={`w-12 h-12 bg-white/80 backdrop-blur rounded-full flex items-center justify-center ${theme.text} shadow-lg`}>
          <BookOpen size={20} />
        </span>
      </button>
    </motion.div>
  );
}

function AlbumPageView({
  page,
  isMobile,
  isLeft,
  editMode,
  selectedPageNumber,
  selectedElementId,
  onSelectPage,
  onSelectElement,
  onStartDrag,
  onStartResize,
  onDeletePage,
  onMediaClick,
  onUpdateElement,
  theme,
  snapLineX,
  snapLineY,
}: {
  page: AlbumPage;
  isMobile: boolean;
  isLeft: boolean;
  editMode: boolean;
  selectedPageNumber: number | null;
  selectedElementId: string | null;
  onSelectPage: () => void;
  onSelectElement: (id: string | null) => void;
  onStartDrag: (pageNumber: number, element: AlbumElement, event: ReactPointerEvent<HTMLElement>) => void;
  onStartResize: (pageNumber: number, element: AlbumElement, handle: string, event: ReactPointerEvent<HTMLElement>) => void;
  onDeletePage: () => void;
  onMediaClick?: (media: {url: string, type: "image"|"video"}) => void;
  onUpdateElement?: (element: AlbumElement) => void;
  theme: any;
  snapLineX?: { pageNumber: number; x: number } | null;
  snapLineY?: { pageNumber: number; y: number } | null;
}) {
  const pageDate = page.memory_id && page.content_json.find((element) => element.id.includes("date"))?.text;

  return (
    <div
      data-album-page
      onClick={() => {
        onSelectPage();
        onSelectElement(null);
      }}
      className={`relative ${isMobile ? "w-full h-full" : "w-1/2 h-full"} overflow-hidden bg-[#FFFDF8] ${isLeft ? "shadow-[inset_-18px_0_28px_rgba(0,0,0,0.055)]" : "shadow-[inset_18px_0_28px_rgba(0,0,0,0.045)]"} ${editMode && selectedPageNumber === page.page_number ? "z-10" : ""}`}
      style={{
        backgroundColor: page.background_color || "#FFFDF8",
        ...(editMode && selectedPageNumber === page.page_number ? { outline: `4px solid ${theme.hex}59`, outlineOffset: "-4px" } : {})
      }}
    >
      {/* Background image with opacity */}
      {page.background_url && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url("${getProxiedUrl(page.background_url)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: page.background_opacity ?? 1,
        }} />
      )}
      {/* Background pattern overlay (lines/grid/dots) */}
      {page.background_style === "lines" && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(180,170,160,0.25) 27px, rgba(180,170,160,0.25) 28px)',
          backgroundSize: '100% 28px',
        }} />
      )}
      {page.background_style === "grid" && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(180,170,160,0.2) 27px, rgba(180,170,160,0.2) 28px), repeating-linear-gradient(90deg, transparent, transparent 27px, rgba(180,170,160,0.2) 27px, rgba(180,170,160,0.2) 28px)',
          backgroundSize: '28px 28px',
        }} />
      )}
      {page.background_style === "dots" && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(160,150,140,0.35) 1.2px, transparent 1.2px)',
          backgroundSize: '20px 20px',
        }} />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.9),transparent_26%),linear-gradient(135deg,rgba(184,137,128,0.04),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 opacity-20 pointer-events-none">
        <img src="/logo.png" className="w-5 h-5 object-contain" alt="" />
        <span className={`text-[9px] font-black ${theme.text} uppercase tracking-[0.35em]`}>{page.page_kind === "cover" ? "TinyWorld" : "TinyWorld Album"}</span>
      </div>
      {editMode && page.page_number > 0 && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDeletePage();
          }}
          className="absolute top-9 right-4 z-50 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg border border-white/70"
          title="Eliminar hoja"
        >
          <Trash2 size={14} />
        </button>
      )}

      {[...page.content_json].sort((a, b) => a.z - b.z).map((element) => (
        <AlbumElementView
          key={element.id}
          element={element}
          pageNumber={page.page_number}
          editMode={editMode}
          selected={selectedPageNumber === page.page_number && selectedElementId === element.id}
          onSelect={() => {
            onSelectPage();
            onSelectElement(element.id);
          }}
          onStartDrag={onStartDrag}
          onStartResize={onStartResize}
          onMediaClick={onMediaClick}
          onUpdateElement={onUpdateElement}
          theme={theme}
        />
      ))}
      {/* Snap Lines */}
      {snapLineX && snapLineX.pageNumber === page.page_number && (
        <div 
          className="absolute inset-y-0 w-0.5 border-l border-dashed border-red-500 z-50 pointer-events-none"
          style={{ left: `${snapLineX.x}%` }}
        />
      )}
      {snapLineY && snapLineY.pageNumber === page.page_number && (
        <div 
          className="absolute inset-x-0 h-0.5 border-t border-dashed border-red-500 z-50 pointer-events-none"
          style={{ top: `${snapLineY.y}%` }}
        />
      )}
    </div>
  );
}

function AlbumElementView({
  element,
  pageNumber,
  editMode,
  selected,
  onSelect,
  onStartDrag,
  onStartResize,
  onMediaClick,
  onUpdateElement,
  theme,
}: {
  element: AlbumElement;
  pageNumber: number;
  editMode: boolean;
  selected: boolean;
  onSelect: () => void;
  onStartDrag: (pageNumber: number, element: AlbumElement, event: ReactPointerEvent<HTMLElement>) => void;
  onStartResize: (pageNumber: number, element: AlbumElement, handle: string, event: ReactPointerEvent<HTMLElement>) => void;
  onMediaClick?: (media: {url: string, type: "image"|"video"}) => void;
  onUpdateElement?: (element: AlbumElement) => void;
  theme: any;
}) {
  let extraStyles: React.CSSProperties = {};

  if (element.type === "image" || element.type === "video") {
    if (element.shape === "circle") extraStyles.borderRadius = "50%";
    if (element.shape === "heart") extraStyles.clipPath = "path('M 50 25 C 25 -10, -10 25, 50 90 C 110 25, 75 -10, 50 25 Z')"; 
    if (element.shape === "star") extraStyles.clipPath = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"; 
    
    if (element.frameStyle === "white") { extraStyles.border = "6px solid white"; extraStyles.boxShadow = "0 4px 6px rgba(0,0,0,0.1)"; }
    if (element.frameStyle === "polaroid") { extraStyles.border = "8px solid white"; extraStyles.borderBottomWidth = "30px"; extraStyles.boxShadow = "0 8px 15px rgba(0,0,0,0.15)"; }
    if (element.frameStyle === "wood") { extraStyles.border = "10px solid #8B5A2B"; extraStyles.boxShadow = "inset 0 0 10px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.2)"; }
    if (element.frameStyle === "film") { extraStyles.borderTop = "8px dashed black"; extraStyles.borderBottom = "8px dashed black"; extraStyles.borderLeft = "2px solid black"; extraStyles.borderRight = "2px solid black"; extraStyles.backgroundColor = "black"; }
    
    if (element.edgeFade) { extraStyles.maskImage = "radial-gradient(ellipse at center, black 40%, transparent 100%)"; extraStyles.WebkitMaskImage = extraStyles.maskImage; }
  }

  if (element.type === "text") {
    if (element.bgColor) extraStyles.backgroundColor = element.bgColor;
    if (element.textStyle === "bubble-round") {
       extraStyles.backgroundColor = element.color ? element.color + '20' : '#fff'; 
       extraStyles.borderRadius = '20px';
       extraStyles.border = `2px solid ${element.color}`;
       extraStyles.padding = '10px';
    } else if (element.textStyle === "bubble-square") {
       extraStyles.backgroundColor = element.color ? element.color + '20' : '#fff'; 
       extraStyles.borderRadius = '5px';
       extraStyles.border = `2px solid ${element.color}`;
       extraStyles.padding = '10px';
    } else if (element.textStyle === "ribbon") {
       extraStyles.backgroundColor = element.color;
       extraStyles.color = '#fff';
       extraStyles.clipPath = 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)';
       extraStyles.padding = '5px 20px';
    }
  }

  const commonStyle: React.CSSProperties = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.w}%`,
    height: `${element.h}%`,
    zIndex: element.z,
    transform: `rotate(${element.rotation || 0}deg) scaleX(${element.flipX ? -1 : 1})`,
    opacity: element.opacity ?? 1,
    borderRadius: element.type === 'shape' ? `${element.radius || 0}px` : undefined,
    fontWeight: element.isBold ? "bold" : "normal",
    fontStyle: element.isItalic ? "italic" : "normal",
    textDecoration: element.isUnderline ? "underline" : "none",
    ...extraStyles
  };

  const fontFamily = FONTS.find(f => f.family === element.fontFamily)?.family || fontStyles.find((font) => font.id === element.fontFamily)?.family || "inherit";

  return (
    <div
      onClick={(event) => {
        event.stopPropagation();
        if (editMode) {
          onSelect();
        } else {
          if (element.type === "image" || element.type === "video") {
            onMediaClick?.({ url: element.url!, type: element.type });
          }
        }
      }}
      className={`absolute select-none ${selected ? "z-[9990]" : ""} ${!editMode && ['image', 'video', 'audio'].includes(element.type) ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
      style={{
        ...commonStyle,
        ...(selected ? { outline: `3px solid ${theme.hex}`, outlineOffset: '2px', boxShadow: `0 0 0 5px white` } : {})
      }}
    >
      {/* DRAG HANDLE OVERLAY */}
      <div className={`absolute inset-0 z-10 ${editMode ? 'cursor-move' : ''}`} onPointerDown={(e) => onStartDrag(pageNumber, element, e)} />
      
      {/* RESIZE HANDLES */}
      {selected && editMode && (
        <>
          <div onPointerDown={(e) => { e.stopPropagation(); onStartResize(pageNumber, element, 'nw', e); }} className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full z-[9991] cursor-nwse-resize border-[3px] border-white shadow-md" style={{ backgroundColor: theme.hex }} />
          <div onPointerDown={(e) => { e.stopPropagation(); onStartResize(pageNumber, element, 'ne', e); }} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full z-[9991] cursor-nesw-resize border-[3px] border-white shadow-md" style={{ backgroundColor: theme.hex }} />
          <div onPointerDown={(e) => { e.stopPropagation(); onStartResize(pageNumber, element, 'sw', e); }} className="absolute -bottom-1.5 -left-1.5 w-4 h-4 rounded-full z-[9991] cursor-nesw-resize border-[3px] border-white shadow-md" style={{ backgroundColor: theme.hex }} />
          <div onPointerDown={(e) => { e.stopPropagation(); onStartResize(pageNumber, element, 'se', e); }} className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full z-[9991] cursor-nwse-resize border-[3px] border-white shadow-md" style={{ backgroundColor: theme.hex }} />
        </>
      )}

      {element.type === "text" ? (
        <>
          {selected && editMode && (
            <div 
              className="absolute -top-6 left-1/2 -translate-x-1/2 p-1 text-white rounded-full cursor-move shadow-md z-[9992]"
              onPointerDown={(e) => onStartDrag(pageNumber, element, e)}
              style={{ backgroundColor: theme.hex }}
            >
              <Move size={12} />
            </div>
          )}
          <textarea
            className={`w-full h-full whitespace-pre-wrap leading-snug flex relative z-20 bg-transparent resize-none outline-none border-0 ${selected && editMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
            value={element.text || ""}
            onChange={(e) => {
              if (selected && editMode && onUpdateElement) {
                onUpdateElement({ ...element, text: e.target.value });
              }
            }}
            disabled={!editMode || !selected}
            style={{
              color: element.textStyle === 'ribbon' ? '#fff' : element.color,
              fontSize: `${element.fontSize || 14}px`,
              fontFamily,
              fontWeight: element.isBold ? "bold" : "normal",
              fontStyle: element.isItalic ? "italic" : "normal",
              textDecoration: element.isUnderline ? "underline" : "none",
              textAlign: element.textAlign || "center",
              overflow: 'hidden'
            }}
          />
        </>
      ) : element.type === "shape" ? (
        <div className="w-full h-full pointer-events-none" style={{ background: element.color }} />
      ) : element.type === "video" ? (
        <div className="w-full h-full bg-black rounded-[inherit] overflow-hidden shadow-md relative pointer-events-none">
          {element.url ? (
            <video src={getProxiedUrl(element.url)} className="w-full h-full object-cover" muted playsInline loop autoPlay={!editMode} />
          ) : null}
          {editMode && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black/20">
            <Video size={28} />
            {!element.url && <span className="absolute bottom-2 text-[9px] font-bold text-white/70">Sin archivo</span>}
          </div>
          )}
        </div>
      ) : element.type === "audio" ? (
        <div className={`w-full h-full flex flex-col items-center justify-center rounded-[inherit] shadow-sm border p-2 relative overflow-hidden ${element.mediaStyle === 'light' ? 'bg-white' : element.mediaStyle === 'colorful' ? 'bg-pink-100 border-pink-300' : element.mediaStyle === 'minimal' ? 'bg-transparent border-transparent' : 'bg-[#1A1A1A] border-gray-800'}`} style={element.mediaStyle === 'light' ? { borderColor: `${theme.hex}33` } : {}}>
          <div className={`absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r mix-blend-overlay ${element.mediaStyle === 'colorful' ? 'from-pink-500/20' : 'from-orange-500/20 to-transparent'}`} />
          <div className="w-full flex items-center gap-3 relative z-10">
            <button
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg border cursor-pointer pointer-events-auto ${element.mediaStyle === 'light' ? 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200' : element.mediaStyle === 'colorful' ? 'bg-gradient-to-br from-pink-400 to-pink-600 border-pink-300/50 text-white hover:from-pink-500 hover:to-pink-700' : 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-300/50 text-white hover:from-orange-500 hover:to-orange-700'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (element.url) {
                  const a = new Audio(getProxiedUrl(element.url));
                  a.play().catch(console.error);
                }
              }}
            >
              <PlayCircle size={16} />
            </button>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between items-end">
                <span className={`text-[9px] font-black uppercase tracking-widest truncate ${element.mediaStyle === 'light' || element.mediaStyle === 'colorful' ? 'text-gray-800' : 'text-white/90'}`}>{element.variable || "Audio"}</span>
                <span className={`text-[8px] font-mono ${element.mediaStyle === 'light' || element.mediaStyle === 'colorful' ? 'text-gray-500' : 'text-white/50'}`}>▶</span>
              </div>
              <div className="w-full h-2 flex items-end gap-[1px]">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className={`flex-1 rounded-t-sm ${element.mediaStyle === 'light' ? 'bg-gray-400' : element.mediaStyle === 'colorful' ? 'bg-pink-400' : 'bg-orange-400/80'}`} style={{ height: `${20 + Math.sin(i * 0.8) * 40 + 30}%` }} />
                ))}
              </div>
            </div>
          </div>
          {!element.url && editMode && <span className="text-[8px] font-bold text-white/50 mt-1">Sin archivo</span>}
        </div>
      ) : element.type === "calendar" ? (() => {
        const dateStr = element.text || "2024-01-01";
        const [yearStr, monthStr, dayStr] = dateStr.split('-');
        const year = parseInt(yearStr) || 2024;
        const month = (parseInt(monthStr) || 1) - 1;
        const day = parseInt(dayStr) || null;
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        return (
        <div className="w-full h-full flex flex-col pointer-events-none p-4" style={{ fontFamily, color: element.color || "#333" }}>
          <div className="w-full grid grid-cols-7 gap-1 text-center font-bold tracking-widest mb-2">
            <span className="text-[10px]">L</span><span className="text-[10px]">M</span><span className="text-[10px]">M</span><span className="text-[10px]">J</span><span className="text-[10px]">V</span><span className="text-[10px]">S</span><span className="text-[10px]">D</span>
          </div>
          <div className="w-full flex-1 grid grid-cols-7 gap-1 text-center content-start">
            {[...Array(startOffset)].map((_, i) => (
              <div key={`empty-${i}`} className="text-[12px] opacity-20">-</div>
            ))}
            {[...Array(daysInMonth)].map((_, i) => {
              const currentDay = i + 1;
              const isSelected = day ? currentDay === day : currentDay === 15;
              return (
                <div key={i} className="text-[12px] flex items-center justify-center">
                  <span className={isSelected ? 'w-6 h-6 flex items-center justify-center text-white rounded-full shadow-sm' : ''} style={isSelected ? { backgroundColor: theme.hex } : {}}>{currentDay}</span>
                </div>
              );
            })}
          </div>
        </div>
        );
      })() : (
        element.url ? (
          <img
            src={getProxiedUrl(element.url)}
            alt=""
            draggable={false}
            className={`w-full h-full ${element.fit === "contain" || element.type === "sticker" ? "object-contain" : "object-cover"} rounded-[inherit] ${element.type === "sticker" ? "drop-shadow-lg" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded-[inherit] border-2 border-dashed" style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}33` }}>
            <ImageIcon size={20} style={{ color: `${theme.hex}4d` }} />
          </div>
        )
      )}
    </div>
  );
}

function EditPanel({
  selectedPage,
  selectedElement,
  templates,
  assets,
  pages,
  memories,
  onApplyTemplate,
  onAddSticker,
  onAddText,
  onAddBlankPage,
  onAddSeparatorPage,
  onAddCollage,
  onAddImage,
  onAddVideo,
  onAddAudio,
  onAddShape,
  onAddCalendar,
  onOpenStickerModal,
  onMovePageOrder,
  onJumpToPage,
  onOpenTemplates,
  onDragMemory,
  onUpdateElement,
  onSetBackground,
  onSetBackgroundStyle,
  onSetBackgroundOpacity,
  bindingStyle,
  onSetBindingStyle,
  theme,
}: {
  selectedPage?: AlbumPage;
  selectedElement: AlbumElement | null;
  templates: { id: TemplateId; label: string; hint: string; isDouble?: boolean }[];
  assets: AssetItem[];
  pages: AlbumPage[];
  memories: PregnancyMemory[];
  onApplyTemplate: (template: string) => void;
  onAddSticker: (url: string) => void;
  onAddText: () => void;
  onAddBlankPage: (templateId?: TemplateId) => void;
  onAddSeparatorPage: () => void;
  onAddCollage: (count: number) => void;
  onAddImage: () => void;
  onAddVideo: () => void;
  onAddAudio: () => void;
  onAddShape: (color?: string) => void;
  onAddCalendar: () => void;
  onOpenStickerModal: () => void;
  onMovePageOrder: (pageNumber: number, direction: "up" | "down") => void;
  onJumpToPage: (pageNumber: number) => void;
  onOpenTemplates: () => void;
  onDragMemory: (memoryId: string) => void;
  onUpdateElement: (updater: (element: AlbumElement) => AlbumElement) => void;
  onSetBackground: (value: string, isImage?: boolean) => void;
  onSetBackgroundStyle: (style: "solid" | "lines" | "grid" | "dots") => void;
  onSetBackgroundOpacity: (opacity: number) => void;
  bindingStyle: "none" | "spiral" | "stitch" | "leather";
  onSetBindingStyle: (style: "none" | "spiral" | "stitch" | "leather") => void;
  theme: any;
}) {
  const stickers = assets.filter((asset) => asset.type === "sticker" || asset.type === "tape").slice(0, 12);
  const backgrounds = assets.filter((asset) => asset.type === "background");
  const colors = ["#FFFDF8", "#F8E8E7", "#EEF4EF", "#F3EBDD", "#EAF1F8", "#F7F0F4", "#FFF5E6", "#E8EAED", "#FDE8E8", "#E4F0E2"];
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    outline: true,
    memories: false,
    templates: false,
    tools: true,
    style: true,
    layer: true,
  });

  const toggleSection = (id: string) => setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-3">
      {/* PORTADA OPTIONS */}
      {selectedPage?.page_number === 0 && (
        <SidebarSection id="coverOptions" title="Estilos de Portada" icon={<BookOpen size={16} />} open={true} onToggle={() => {}} theme={theme}>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { id: "cover_soft", label: "Suave", hint: "Fondo cálido y suave" },
              { id: "cover_modern", label: "Moderna", hint: "Limpia y elegante" },
              { id: "cover_flora", label: "Floral", hint: "Textura natural" }
            ].map((t) => (
              <button 
                key={t.id} 
                onClick={() => onApplyTemplate(t.id)} 
                className="p-2.5 rounded-xl text-left border bg-white transition-colors hover:opacity-90"
                style={selectedPage?.template_id === t.id ? { borderColor: theme.hex, backgroundColor: `${theme.hex}0d`, color: theme.hex } : { color: theme.hex, borderColor: `${theme.hex}1a` }}
              >
                <span className="block text-[9px] font-black uppercase tracking-widest truncate">{t.label}</span>
                <span className="block text-[8px] opacity-55 mt-0.5 font-bold">{t.hint}</span>
              </button>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* PAGE ORDER - with up/down */}
      <SidebarSection id="outline" title="Orden del libro" icon={<Layers size={16} />} open={openSections.outline} onToggle={toggleSection} theme={theme}>
        <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar pr-1">
          {pages.map((page, idx) => {
            const isCover = page.page_number === 0;
            return (
              <div 
                key={page.page_number} 
                className="flex items-center gap-1.5 p-2 rounded-xl border bg-white"
                style={selectedPage?.page_number === page.page_number ? { backgroundColor: `${theme.hex}1a`, borderColor: `${theme.hex}4d` } : { borderColor: `${theme.hex}1a` }}
              >
                <button onClick={() => onJumpToPage(page.page_number)} className="flex-1 text-left min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-widest truncate" style={{ color: theme.hex }}>{isCover ? "PORTADA PRINCIPAL" : `${page.page_number}. ${page.title || page.page_kind}`}</span>
                  <span className="block text-[8px] font-bold capitalize opacity-50" style={{ color: theme.hex }}>{isCover ? "Fija" : page.page_kind.replace("_", " ")}</span>
                </button>
                {!isCover && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => onMovePageOrder(page.page_number, "up")} disabled={idx === 1} className="p-0.5 hover:opacity-100 disabled:opacity-20" style={{ color: theme.hex }}><ChevronUp size={12} /></button>
                    <button onClick={() => onMovePageOrder(page.page_number, "down")} disabled={idx === pages.length - 1} className="p-0.5 hover:opacity-100 disabled:opacity-20" style={{ color: theme.hex }}><ChevronDown size={12} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button 
            onClick={() => onAddBlankPage()} 
            className={`p-2.5 ${theme.primaryBg} ${theme.textActive} rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm hover:opacity-90 transition-opacity`}
          >
            <FilePlus2 size={13} /> Hoja
          </button>
          <button 
            onClick={onAddSeparatorPage} 
            className="p-2.5 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 border hover:opacity-85 transition-opacity"
            style={{ color: theme.hex, borderColor: `${theme.hex}26` }}
          >
            <CalendarDays size={13} /> Separador
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 pt-1 mt-1">
          <button onClick={() => onAddBlankPage("lined_sheet")} className="p-1.5 bg-white border rounded-lg text-[8px] font-bold text-center hover:opacity-80 transition-opacity" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}>Rayada</button>
          <button onClick={() => onAddBlankPage("grid_sheet")} className="p-1.5 bg-white border rounded-lg text-[8px] font-bold text-center hover:opacity-80 transition-opacity" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}>Cuadros</button>
          <button onClick={() => onAddBlankPage("dotted_sheet")} className="p-1.5 bg-white border rounded-lg text-[8px] font-bold text-center hover:opacity-80 transition-opacity" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}>Puntos</button>
        </div>
      </SidebarSection>

      {/* MEMORIES */}
      <SidebarSection id="memories" title="Recuerdos" icon={<BookOpen size={16} />} open={openSections.memories} onToggle={toggleSection} theme={theme}>
        <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
          {memories.map((memory) => (
            <button
              key={memory.id}
              draggable
              onDragStart={() => onDragMemory(memory.id)}
              className="w-full p-2.5 rounded-xl bg-white border shadow-sm text-left cursor-grab active:cursor-grabbing hover:opacity-90"
              style={{ borderColor: `${theme.hex}1a` }}
            >
              <span className="block text-[9px] font-black uppercase tracking-widest truncate" style={{ color: theme.hex }}>{memory.title}</span>
              <span className="block text-[8px] font-bold opacity-60" style={{ color: theme.hex }}>{memory.memory_date || "Sin fecha"} · {(memory.media_urls || []).length} archivos</span>
            </button>
          ))}
          {memories.length === 0 && <p className="text-[10px] font-bold opacity-50" style={{ color: theme.hex }}>No hay recuerdos.</p>}
        </div>
      </SidebarSection>

      {/* TEMPLATES */}
      <SidebarSection id="templates" title="Plantillas" icon={<LayoutTemplate size={16} />} open={openSections.templates} onToggle={toggleSection} theme={theme}>
        <button 
          onClick={onOpenTemplates} 
          className={`w-full p-3 ${theme.primaryBg} ${theme.textActive} rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md mb-2 hover:opacity-95`}
        >
          Ver todas las plantillas
        </button>
        <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
          {templates.map((template) => (
            <button 
              key={template.id} 
              onClick={() => onApplyTemplate(template.id)} 
              className="p-2.5 rounded-xl text-left border bg-white hover:opacity-90 transition-opacity"
              style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}
            >
              <div className="flex items-center justify-between">
                <span className="block text-[9px] font-black uppercase tracking-widest truncate">{template.label}</span>
                {template.isDouble && <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${theme.hex}33`, color: theme.hex }}>2 HOJAS</span>}
              </div>
              <span className="block text-[8px] opacity-55 mt-0.5 font-bold">{template.hint}</span>
            </button>
          ))}
        </div>
      </SidebarSection>

      {/* TOOLBOX - Collages, text, multimedia */}
      <SidebarSection id="tools" title="Herramientas" icon={<Sparkles size={16} />} open={openSections.tools} onToggle={toggleSection} theme={theme}>
        <div className="space-y-3">
          {/* Collage Presets */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 border-b pb-1 opacity-50" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}>Collages Rápidos</p>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => onAddCollage(2)} className="p-2 bg-white border rounded-xl hover:opacity-90 flex flex-col items-center justify-center gap-1 transition-all" style={{ borderColor: `${theme.hex}1a` }}>
                <LayoutGrid size={14} style={{ color: theme.hex }} /><span className="text-[8px] font-bold" style={{ color: theme.hex }}>2 Fotos</span>
              </button>
              <button onClick={() => onAddCollage(3)} className="p-2 bg-white border rounded-xl hover:opacity-90 flex flex-col items-center justify-center gap-1 transition-all" style={{ borderColor: `${theme.hex}1a` }}>
                <LayoutGrid size={14} style={{ color: theme.hex }} /><span className="text-[8px] font-bold" style={{ color: theme.hex }}>3 Fotos</span>
              </button>
              <button onClick={() => onAddCollage(4)} className="p-2 bg-white border rounded-xl hover:opacity-90 flex flex-col items-center justify-center gap-1 transition-all" style={{ borderColor: `${theme.hex}1a` }}>
                <LayoutGrid size={14} style={{ color: theme.hex }} /><span className="text-[8px] font-bold" style={{ color: theme.hex }}>4 Fotos</span>
              </button>
            </div>
          </div>

          {/* Text Presets */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 border-b pb-1 opacity-50" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}>Bloques de Texto</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={onAddText} className="p-2 bg-white border rounded-xl hover:opacity-90 text-[9px] font-bold flex items-center justify-center gap-1 transition-colors" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}><Type size={13} style={{ color: theme.hex }} /> Título</button>
              <button onClick={onAddText} className="p-2 bg-white border rounded-xl hover:opacity-90 text-[9px] font-bold flex items-center justify-center gap-1 transition-colors" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}><AlignLeft size={13} style={{ color: theme.hex }} /> Párrafo</button>
            </div>
          </div>

          {/* Multimedia */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 border-b pb-1 opacity-50" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}>Multimedia y Especiales</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={onAddImage} className="p-2 bg-white border rounded-xl hover:opacity-90 text-[9px] font-bold flex items-center justify-center gap-1 transition-colors" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}><ImageIcon size={13} className="text-pink-400" /> Foto</button>
              <button onClick={onAddVideo} className="p-2 bg-white border rounded-xl hover:opacity-90 text-[9px] font-bold flex items-center justify-center gap-1 transition-colors" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}><Video size={13} className="text-red-400" /> Video</button>
              <button onClick={onAddAudio} className="p-2 bg-white border rounded-xl hover:opacity-90 text-[9px] font-bold flex items-center justify-center gap-1 transition-colors" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}><Mic size={13} className="text-orange-400" /> Audio</button>
              <button onClick={() => onAddShape()} className="p-2 bg-white border rounded-xl hover:opacity-90 text-[9px] font-bold flex items-center justify-center gap-1 transition-colors" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}><Palette size={13} className="text-purple-400" /> Forma</button>
              <button onClick={onAddCalendar} className="p-2 bg-white border rounded-xl hover:opacity-90 text-[9px] font-bold flex items-center justify-center gap-1 transition-colors" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}><CalendarDays size={13} className="text-blue-400" /> Calendario</button>
              <button onClick={onOpenStickerModal} className="p-2 bg-white border rounded-xl hover:opacity-90 text-[9px] font-bold flex items-center justify-center gap-1 col-span-2 transition-colors" style={{ color: theme.hex, borderColor: `${theme.hex}1a` }}><Smile size={13} className="text-yellow-500" /> Stickers y Cintas</button>
            </div>
          </div>
        </div>
      </SidebarSection>

      {/* STYLE */}
      <SidebarSection id="style" title="Estilo de Hoja" icon={<Palette size={16} />} open={openSections.style} onToggle={toggleSection} theme={theme}>
        <div className="space-y-3">
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest mb-1.5 opacity-50" style={{ color: theme.hex }}>Fondo</h4>
            <div className="flex items-center gap-2 mb-2">
              <input type="color" value={selectedPage?.background_color || "#FFFDF8"} className="w-8 h-8 rounded-lg cursor-pointer shrink-0 border" style={{ borderColor: `${theme.hex}26` }} onChange={(e) => onSetBackground(e.target.value)} />
              <select 
                value={selectedPage?.background_style || "solid"} 
                onChange={(e) => onSetBackgroundStyle(e.target.value as any)} 
                className="flex-1 px-2 py-2 rounded-lg outline-none font-bold text-[10px] border"
                style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}26`, color: theme.hex }}
              >
                <option value="solid">Sólido</option>
                <option value="lines">Líneas</option>
                <option value="grid">Cuadrícula</option>
                <option value="dots">Puntos</option>
              </select>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {colors.map((color) => (
                <button 
                  key={color} 
                  onClick={() => onSetBackground(color)} 
                  className="aspect-square rounded-lg border-2 shadow-sm hover:scale-110 transition-transform" 
                  style={{ backgroundColor: color, borderColor: selectedPage?.background_color === color ? theme.hex : 'white', boxShadow: selectedPage?.background_color === color ? `0 0 0 2px ${theme.hex}4d` : 'none' }} 
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest mb-1.5 opacity-50" style={{ color: theme.hex }}>Estilo de Anillado</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Sin anillado", value: "none" },
                { label: "Espiral", value: "spiral" },
                { label: "Cosido", value: "stitch" },
                { label: "Cuero", value: "leather" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSetBindingStyle(option.value as "none" | "spiral" | "stitch" | "leather")}
                  className="p-2 rounded-xl border text-[9px] font-bold transition-all hover:opacity-90"
                  style={bindingStyle === option.value ? { backgroundColor: theme.hex, color: '#fff', borderColor: theme.hex } : { backgroundColor: '#fff', color: theme.hex, borderColor: `${theme.hex}1a` }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {backgrounds.length > 0 && (
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest mb-1.5 opacity-50" style={{ color: theme.hex }}>Fondos con Imagen</h4>
              <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                {backgrounds.map((asset) => (
                  <button key={asset.id} onClick={() => onSetBackground(asset.url, true)} className="aspect-square rounded-lg border-2 border-white shadow-sm overflow-hidden hover:scale-105 transition-transform">
                    <img src={getProxiedUrl(asset.url)} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
              {selectedPage?.background_url && (
                <div className="mt-2">
                  <h4 className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-50" style={{ color: theme.hex }}>Opacidad del Fondo</h4>
                  <div className="flex items-center gap-2">
                    <input type="range" min="0.05" max="1" step="0.05" value={selectedPage?.background_opacity ?? 1} onChange={(e) => onSetBackgroundOpacity(Number(e.target.value))} className="flex-1 cursor-pointer" style={{ accentColor: theme.hex }} />
                    <span className="text-[10px] font-bold w-8 text-right" style={{ color: theme.hex }}>{Math.round((selectedPage?.background_opacity ?? 1) * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarSection>

    </div>
  );
}

function SidebarSection({
  id,
  title,
  icon,
  open,
  onToggle,
  children,
  theme,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
  theme: any;
}) {
  return (
    <div className="rounded-2xl bg-white/70 border border-white shadow-sm overflow-hidden">
      <button onClick={() => onToggle(id)} className="w-full p-3 flex items-center justify-between" style={{ color: theme.hex }}>
        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <span style={{ color: theme.hex }}>{icon}</span>
          {title}
        </span>
        <ChevronRight size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-3 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TemplatePreviewModal({
  open,
  templates,
  dbTemplates,
  onClose,
  onChoose,
  theme,
}: {
  open: boolean;
  templates: { id: TemplateId; label: string; hint: string }[];
  dbTemplates: any[];
  onClose: () => void;
  onChoose: (template: TemplateId) => void;
  theme: any;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="w-full max-w-5xl bg-white rounded-[2rem] p-5 md:p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h3 className={`text-xl md:text-3xl font-black tracking-tighter italic`} style={{ color: theme.hex }}>Bocetos de plantilla</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: theme.hex }}>Sin texto ni imagen, solo composición</p>
              </div>
              <button onClick={onClose} className="p-3 rounded-full hover:opacity-80 transition-colors" style={{ backgroundColor: `${theme.hex}0d`, color: theme.hex }}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
              {templates.map((template) => {
                const dbTemplate = dbTemplates.find(t => t.id === template.id);
                return (
                  <button key={template.id} onClick={() => onChoose(template.id)} className="group p-4 rounded-2xl bg-[#FFFDF8] text-left border hover:opacity-95 transition-all" style={{ borderColor: `${theme.hex}1a` }}>
                    <div className="aspect-[3/4] rounded-xl bg-white shadow-inner mb-3 relative overflow-hidden border" style={{ backgroundColor: dbTemplate?.background_color || "#ffffff", borderColor: `${theme.hex}1a` }}>
                      <TemplateSketch id={template.id} dbTemplate={dbTemplate} theme={theme} />
                    </div>
                    <span className="block text-[11px] font-black uppercase tracking-widest" style={{ color: theme.hex }}>{template.label}</span>
                    <span className="block text-[9px] font-bold mt-1 opacity-50" style={{ color: theme.hex }}>{template.hint}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function TemplateSketch({ id, dbTemplate, theme }: { id: TemplateId; dbTemplate?: any; theme: any }) {
  if (dbTemplate) {
    const isDouble = dbTemplate.is_double_page;
    const elements = dbTemplate.elements_left || [];
    return (
      <>
        {elements.map((el: any) => (
          <div key={el.id} className="absolute shadow-sm" style={{
            left: `${isDouble ? el.x * 2 : el.x}%`,
            top: `${el.y}%`,
            width: `${isDouble ? el.w * 2 : el.w}%`,
            height: `${el.h}%`,
            backgroundColor: el.type === "text" || el.type === "calendar" ? `${theme.hex}26` : `${theme.hex}4d`,
            transform: `rotate(${el.rotation || 0}deg)`,
            borderRadius: el.type === "text" ? "4px" : "8px"
          }} />
        ))}
      </>
    );
  }

  if (id === "collage_three") {
    return (
      <>
        <div className="absolute top-[12%] left-[10%] right-[10%] h-[6%] rounded" style={{ backgroundColor: `${theme.hex}26` }} />
        <div className="absolute top-[24%] left-[10%] w-[50%] h-[28%] rounded" style={{ backgroundColor: `${theme.hex}4d` }} />
        <div className="absolute top-[24%] right-[10%] w-[24%] h-[20%] rounded" style={{ backgroundColor: `${theme.hex}26` }} />
        <div className="absolute bottom-[16%] right-[10%] w-[54%] h-[24%] rounded" style={{ backgroundColor: `${theme.hex}33` }} />
      </>
    );
  }
  if (id === "scrapbook_notes") {
    return (
      <>
        <div className="absolute top-[18%] left-[10%] w-[40%] h-[30%] rotate-[-6deg] rounded" style={{ backgroundColor: `${theme.hex}4d` }} />
        <div className="absolute top-[40%] right-[10%] w-[38%] h-[28%] rotate-[5deg] rounded" style={{ backgroundColor: `${theme.hex}33` }} />
        <div className="absolute bottom-[16%] left-[13%] w-[38%] h-[18%] rounded" style={{ backgroundColor: `${theme.hex}1a` }} />
      </>
    );
  }
  if (id === "full_photo") {
    return (
      <>
        <div className="absolute top-[8%] left-[8%] right-[8%] h-[65%] rounded" style={{ backgroundColor: `${theme.hex}4d` }} />
        <div className="absolute bottom-[11%] left-[16%] right-[16%] h-[14%] rounded bg-white shadow-sm border" style={{ borderColor: `${theme.hex}1a` }} />
      </>
    );
  }
  if (id === "journal") {
    return (
      <>
        <div className="absolute top-[12%] left-[12%] right-[12%] h-[7%] rounded" style={{ backgroundColor: `${theme.hex}33` }} />
        <div className="absolute top-[28%] left-[12%] right-[12%] h-[32%] rounded" style={{ backgroundColor: `${theme.hex}1a` }} />
        <div className="absolute bottom-[13%] left-[25%] right-[25%] h-[17%] rounded" style={{ backgroundColor: `${theme.hex}4d` }} />
      </>
    );
  }
  return (
    <>
      <div className="absolute top-[14%] left-[10%] right-[10%] h-[40%] rounded" style={{ backgroundColor: `${theme.hex}4d` }} />
      <div className="absolute bottom-[18%] left-[12%] right-[12%] h-[22%] rounded" style={{ backgroundColor: `${theme.hex}1a` }} />
    </>
  );
}
