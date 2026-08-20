"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Type, Image as ImageIcon, Save, 
  Trash2, Plus, Layers, 
  Copy, RotateCw, ZoomIn, ZoomOut,
  BringToFront, SendToBack,
  AlignLeft, AlignCenter, AlignRight,
  PanelLeftClose, PanelLeft, Video, Mic, Smile, GripHorizontal, MousePointer2, CalendarDays,
  LayoutGrid, PlayCircle, Maximize2, ChevronLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ElementType = "image" | "video" | "audio" | "text" | "sticker" | "shape" | "calendar";

interface TemplateElement {
  id: string;
  type: ElementType;
  x: number; 
  y: number; 
  w: number; 
  h: number; 
  z: number;
  rotation?: number;
  
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  textStyle?: "none" | "bubble-round" | "bubble-square" | "ribbon";
  
  shape?: "none" | "circle" | "heart" | "star";
  frameStyle?: "none" | "polaroid" | "wood" | "white" | "film";
  edgeFade?: boolean;
  mediaStyle?: "dark" | "light" | "colorful" | "minimal";
  bgColor?: string;
  
  url?: string; // for stickers
  opacity?: number;
  radius?: number;

  variable?: string; 
}

interface TemplateRecord {
  id: string;
  name: string;
  hint: string;
  is_double_page: boolean;
  elements: TemplateElement[]; 
  background_color: string;
  background_style: "solid" | "lines" | "grid" | "dots";
}

interface TemplateEditorProps {
  onBack?: () => void;
}

const FONTS = [
  { id: "f1", label: "Arial Limpia", family: "Arial, sans-serif" },
  { id: "f2", label: "Georgia Elegante", family: "Georgia, serif" },
  { id: "f8", label: "Comic Infantil", family: "'Comic Sans MS', cursive, sans-serif" },
  { id: "f13", label: "Brush Script Cursiva", family: "'Brush Script MT', cursive" },
  { id: "f17", label: "American Typewriter", family: "'American Typewriter', serif" },
  { id: "f20", label: "Copperplate Fuerte", family: "Copperplate, fantasy" },
  { id: "f21", label: "Papyrus Antigua", family: "Papyrus, fantasy" },
  { id: "f24", label: "Baskerville Clásica", family: "Baskerville, serif" },
  { id: "f30", label: "Segoe UI Moderna", family: "'Segoe UI', sans-serif" },
  { id: "great-vibes", label: "Great Vibes (Boda)", family: "'Great Vibes', cursive" },
  { id: "pacifico", label: "Pacifico (Relax)", family: "'Pacifico', cursive" },
  { id: "cinzel", label: "Cinzel (Cine)", family: "'Cinzel', serif" },
  { id: "dancing", label: "Dancing Script", family: "'Dancing Script', cursive" },
  { id: "satisfy", label: "Satisfy (Firma)", family: "'Satisfy', cursive" },
  { id: "caveat", label: "Caveat (Mano)", family: "'Caveat', cursive" },
];

export default function TemplateEditor({ onBack }: TemplateEditorProps) {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<TemplateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  
  const [dbStickers, setDbStickers] = useState<any[]>([]);
  const [showStickerModal, setShowStickerModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag states
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; width: number; height: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number; width: number; height: number; handle: string } | null>(null);

  useEffect(() => {
    loadTemplates();
    loadStickers();
  }, []);

  async function loadStickers() {
    const { data } = await supabase.from("assets").select("*").eq("type", "sticker").limit(100);
    if (data) setDbStickers(data);
  }

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase.from("album_templates").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      const mapped = data.map((t: any) => {
        const unified: TemplateElement[] = [];
        if (t.is_double_page) {
          (t.elements_left || []).forEach((el: any) => {
            const rightMatch = (t.elements_right || []).find((r: any) => r.id === el.id);
            if (rightMatch) return; 
            unified.push({ ...el, x: el.x / 2, w: el.w / 2 });
          });
          (t.elements_right || []).forEach((el: any) => {
             if(unified.find(u => u.id === el.id)) return; 
             unified.push({ ...el, x: (el.x / 2) + 50, w: el.w / 2 });
          });
        } else {
          unified.push(...(t.elements_left || []));
        }

        return {
          id: t.id,
          name: t.name,
          hint: t.hint || "",
          is_double_page: t.is_double_page,
          background_color: t.background_color || "#FFFDF8",
          background_style: t.background_style || "solid",
          elements: unified
        } as TemplateRecord;
      });
      setTemplates(mapped);
    }
    setLoading(false);
  }

  function createNew(isDoublePage: boolean = true) {
    const newTemplate: TemplateRecord = {
      id: crypto.randomUUID(),
      name: "Nueva Plantilla",
      hint: "",
      is_double_page: isDoublePage,
      elements: [],
      background_color: "#FFFDF8",
      background_style: "solid"
    };
    setActiveTemplate(newTemplate);
    setSelectedId(null);
  }

  function addPresetCollage(type: number) {
    let elements: TemplateElement[] = [];
    const color = "#FFF";
    
    if (type === 2) {
       elements = [
         { id: crypto.randomUUID(), type: "image", variable: "photo_1", x: 10, y: 15, w: 35, h: 70, z: 5, frameStyle: "white" },
         { id: crypto.randomUUID(), type: "image", variable: "photo_2", x: 55, y: 15, w: 35, h: 70, z: 5, frameStyle: "white" }
       ];
    } else if (type === 3) {
       elements = [
         { id: crypto.randomUUID(), type: "image", variable: "photo_1", x: 5, y: 10, w: 40, h: 80, z: 5, frameStyle: "white" },
         { id: crypto.randomUUID(), type: "image", variable: "photo_2", x: 50, y: 10, w: 45, h: 38, z: 5, frameStyle: "white" },
         { id: crypto.randomUUID(), type: "image", variable: "photo_3", x: 50, y: 52, w: 45, h: 38, z: 5, frameStyle: "white" },
       ];
    } else if (type === 4) {
       elements = [
         { id: crypto.randomUUID(), type: "image", variable: "photo_1", x: 5, y: 10, w: 42, h: 38, z: 5, frameStyle: "polaroid", rotation: -2 },
         { id: crypto.randomUUID(), type: "image", variable: "photo_2", x: 53, y: 10, w: 42, h: 38, z: 5, frameStyle: "polaroid", rotation: 2 },
         { id: crypto.randomUUID(), type: "image", variable: "photo_3", x: 5, y: 52, w: 42, h: 38, z: 5, frameStyle: "polaroid", rotation: 1 },
         { id: crypto.randomUUID(), type: "image", variable: "photo_4", x: 53, y: 52, w: 42, h: 38, z: 5, frameStyle: "polaroid", rotation: -1 },
       ];
    }

    const newTemplate: TemplateRecord = {
      id: crypto.randomUUID(),
      name: `Collage ${type} Fotos`,
      hint: "",
      is_double_page: true,
      elements,
      background_color: "#EFEBE2",
      background_style: "solid"
    };
    setActiveTemplate(newTemplate);
    setSelectedId(null);
  }

  async function saveTemplate() {
    if (!activeTemplate) return;
    setSaving(true);
    
    let elements_left: any[] = [];
    let elements_right: any[] = [];

    if (activeTemplate.is_double_page) {
      activeTemplate.elements.forEach(el => {
        // Center point of the element is x + w/2. If it's < 50, it belongs to the left page.
        const center = el.x + (el.w / 2);
        if (center < 50) {
          elements_left.push({ ...el, x: el.x * 2, w: el.w * 2 });
        } else {
          elements_right.push({ ...el, x: (el.x - 50) * 2, w: el.w * 2 });
        }
      });
    } else {
      elements_left = activeTemplate.elements;
    }

    const payload = {
      id: activeTemplate.id,
      name: activeTemplate.name,
      is_double_page: activeTemplate.is_double_page,
      elements_left: elements_left,
      elements_right: elements_right,
      background_color: activeTemplate.background_color
    };

    const { error } = await supabase.from("album_templates").upsert(payload as any);

    if (error) {
      alert("Error al guardar en base de datos: " + JSON.stringify(error));
      console.error("UPSERT ERROR:", error, payload);
    } else {
      await loadTemplates();
      alert("¡Plantilla guardada con éxito!");
    }
    setSaving(false);
  }

  async function deleteTemplate(id: string) {
    if(!confirm("¿Seguro que deseas eliminar esta plantilla?")) return;
    await supabase.from("album_templates").delete().eq("id", id);
    if(activeTemplate?.id === id) setActiveTemplate(null);
    loadTemplates();
  }

  function addPresetCalendar() {
    if (!activeTemplate) return;
    const imgId = crypto.randomUUID();
    const titleId = crypto.randomUUID();
    const gridId = crypto.randomUUID();

    const imgEl: TemplateElement = { id: imgId, type: "image", variable: "photo_1", x: 5, y: 10, w: 40, h: 80, z: 5, frameStyle: "none" };
    const titleEl: TemplateElement = { id: titleId, type: "text", variable: "month_name", text: "November", x: 50, y: 15, w: 45, h: 20, z: 5, fontSize: 64, fontFamily: "'Great Vibes', cursive", textAlign: "center", color: "#111" };
    const gridEl: TemplateElement = { id: gridId, type: "calendar", variable: "calendar_grid", x: 55, y: 40, w: 35, h: 45, z: 5, color: "#333", fontFamily: "Arial, sans-serif" };

    setActiveTemplate(prev => {
      if(!prev) return prev;
      return { ...prev, elements: [...prev.elements, imgEl, titleEl, gridEl] };
    });
    setSelectedId(null);
  }

  function addElement(type: ElementType, preset?: string) {
    if (!activeTemplate) return;
    const id = crypto.randomUUID();
    let newEl: TemplateElement;
    
    if (type === "text") {
      newEl = { id, type, x: 10, y: 10, w: 30, h: 10, z: 10, text: "Nuevo Texto", color: "#4A4238", fontSize: 24, fontFamily: "Georgia, serif", rotation: 0, textAlign: "center", textStyle: "none", variable: preset || "" };
      if (preset === "title") { newEl.text = "TÍTULO PRINCIPAL"; newEl.fontSize = 42; newEl.w = 60; newEl.fontFamily = "'Cinzel', serif"; }
      if (preset === "description") { newEl.text = "Escribe una historia o anécdota aquí..."; newEl.fontSize = 18; newEl.w = 40; newEl.h = 20; newEl.textAlign = "left"; }
      if (preset === "date") { newEl.text = "20 de Mayo, 2026"; newEl.fontSize = 16; newEl.color = "#888"; newEl.w = 25; }
      if (preset === "bubble") { newEl.text = "¡Dijo su primera palabra!"; newEl.textStyle = "bubble-round"; newEl.h = 15; newEl.w = 25; newEl.color = "#000"; }
      if (preset === "ribbon") { newEl.text = "¡MOMENTO MÁGICO!"; newEl.textStyle = "ribbon"; newEl.h = 12; newEl.w = 40; newEl.color = "#FFF"; }
    } else if (type === "image" || type === "video") {
      newEl = { id, type, x: 10, y: 10, w: 30, h: 40, z: 5, radius: 0, rotation: 0, frameStyle: "none", shape: "none", edgeFade: false, variable: preset || (type==="video" ? "media_1" : "photo_1") };
    } else if (type === "audio") {
      newEl = { id, type, x: 10, y: 10, w: 35, h: 12, z: 6, rotation: 0, variable: preset || "media_1" };
    } else if (type === "calendar") {
      newEl = { id, type, x: 10, y: 10, w: 35, h: 40, z: 5, rotation: 0, color: "#333", fontFamily: "Arial, sans-serif", variable: "calendar_grid" };
    } else if (type === "sticker") {
      newEl = { id, type, x: 10, y: 10, w: 15, h: 15, z: 20, rotation: 0, url: preset || "" };
    } else {
      newEl = { id, type, x: 10, y: 10, w: 30, h: 30, z: 1, color: "#EADBD4", opacity: 1, radius: 0, rotation: 0 };
    }

    setActiveTemplate(prev => {
      if(!prev) return prev;
      return { ...prev, elements: [...prev.elements, newEl] };
    });
    setSelectedId(id);
  }

  function updateActiveElement(changes: Partial<TemplateElement>) {
    if (!activeTemplate || !selectedId) return;
    setActiveTemplate(prev => {
      if(!prev) return prev;
      return { ...prev, elements: prev.elements.map(el => el.id === selectedId ? { ...el, ...changes } : el) };
    });
  }

  function deleteActiveElement() {
    if (!activeTemplate || !selectedId) return;
    setActiveTemplate(prev => {
      if(!prev) return prev;
      return { ...prev, elements: prev.elements.filter(el => el.id !== selectedId) };
    });
    setSelectedId(null);
  }

  function duplicateActiveElement() {
    if (!activeTemplate || !selectedId) return;
    setActiveTemplate(prev => {
      if(!prev) return prev;
      const target = prev.elements.find(el => el.id === selectedId);
      if(!target) return prev;
      const newEl = { ...target, id: crypto.randomUUID(), x: Math.min(target.x + 5, 90), y: Math.min(target.y + 5, 90) };
      return { ...prev, elements: [...prev.elements, newEl] };
    });
  }

  function changeZIndex(direction: 1 | -1) {
    if (!activeTemplate || !selectedId) return;
    setActiveTemplate(prev => {
      if(!prev) return prev;
      return { ...prev, elements: prev.elements.map(el => el.id === selectedId ? { ...el, z: Math.max(0, el.z + direction) } : el) };
    });
  }

  const getProxiedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('.r2.dev') || url.includes('.r2.cloudflarestorage.com') || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL && url.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_URL))) {
      return `/api/download?url=${encodeURIComponent(url)}&inline=true`;
    }
    return url;
  };

  const selectedEl = activeTemplate?.elements.find(el => el.id === selectedId);

  // Canvas Handlers
  const handlePointerDownMove = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    const elContainer = document.getElementById(`editor-canvas`);
    if (!elContainer) return;
    const rect = elContainer.getBoundingClientRect();
    const el = activeTemplate!.elements.find(x => x.id === id);
    if (!el) return;
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, width: rect.width, height: rect.height };
  };

  const handlePointerDownResize = (e: React.PointerEvent, id: string, handle: string) => {
    e.stopPropagation();
    setSelectedId(id);
    const elContainer = document.getElementById(`editor-canvas`);
    if (!elContainer) return;
    const rect = elContainer.getBoundingClientRect();
    const el = activeTemplate!.elements.find(x => x.id === id);
    if (!el) return;
    resizeRef.current = { id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, origW: el.w, origH: el.h, width: rect.width, height: rect.height, handle };
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeTemplate) return;
      
      if (dragRef.current) {
        const { id, startX, startY, origX, origY, width, height } = dragRef.current;
        const dx = ((e.clientX - startX) / width) * 100;
        const dy = ((e.clientY - startY) / height) * 100;
        setActiveTemplate(prev => {
          if(!prev) return prev;
          return { ...prev, elements: prev.elements.map(el => el.id === id ? { ...el, x: origX + dx, y: origY + dy } : el) };
        });
      }
      
      if (resizeRef.current) {
        const { id, startX, startY, origX, origY, origW, origH, width, height, handle } = resizeRef.current;
        const dx = ((e.clientX - startX) / width) * 100;
        const dy = ((e.clientY - startY) / height) * 100;
        
        setActiveTemplate(prev => {
          if(!prev) return prev;
          return { ...prev, elements: prev.elements.map(el => {
            if (el.id !== id) return el;
            let nX = origX, nY = origY, nW = origW, nH = origH;
            
            if (handle.includes('e')) nW = Math.max(5, origW + dx);
            if (handle.includes('s')) nH = Math.max(5, origH + dy);
            if (handle.includes('w')) { nW = Math.max(5, origW - dx); nX = origX + (origW - nW); }
            if (handle.includes('n')) { nH = Math.max(5, origH - dy); nY = origY + (origH - nH); }
            
            return { ...el, x: nX, y: nY, w: nW, h: nH };
          })};
        });
      }
    };
    const handlePointerUp = () => { dragRef.current = null; resizeRef.current = null; };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeTemplate]);

  const getBgStyle = () => {
    if (!activeTemplate) return {};
    const styles: React.CSSProperties = { backgroundColor: activeTemplate.background_color };
    if (activeTemplate.background_style === "lines") {
      styles.backgroundImage = 'repeating-linear-gradient(transparent, transparent 39px, rgba(0,0,0,0.1) 40px)';
    } else if (activeTemplate.background_style === "grid") {
      styles.backgroundImage = 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)';
      styles.backgroundSize = '20px 20px';
    } else if (activeTemplate.background_style === "dots") {
      styles.backgroundImage = 'radial-gradient(rgba(0,0,0,0.1) 2px, transparent 2px)';
      styles.backgroundSize = '20px 20px';
    }
    return styles;
  };

  return (
    <div className="flex h-full w-full bg-[#f4f5f7] overflow-hidden text-sm font-sans" onClick={() => setSelectedId(null)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Cinzel:wght@400..900&family=Dancing+Script:wght@400..700&family=Great+Vibes&family=Pacifico&family=Satisfy&display=swap');
      `}</style>
      {/* LEFT SIDEBAR */}
      <div className="bg-white border-r border-gray-200 flex flex-col z-10 shrink-0 overflow-hidden w-[300px]">
            <div className="p-4 border-b border-gray-200 flex flex-col gap-3 min-w-[300px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {onBack && (
                    <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                    </button>
                  )}
                  <h2 className="font-bold text-gray-800 text-lg">Plantillas</h2>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => createNew(false)} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-[10px] font-bold">+ 1 Hoja</button>
                  <button onClick={() => createNew(true)} className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors text-[10px] font-bold">+ 2 Hojas</button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-w-[300px] bg-gray-50/50">
              {loading ? (
                <p className="text-center text-gray-400 py-4 text-xs">Cargando...</p>
              ) : templates.map(t => (
                <div key={t.id} className={`p-2.5 rounded-xl cursor-pointer flex justify-between items-center group transition-colors shadow-sm ${activeTemplate?.id === t.id ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:border-gray-400'}`} onClick={() => { setActiveTemplate(t); setSelectedId(null); }}>
                  <div className="truncate pr-2">
                    <p className={`font-bold truncate text-xs ${activeTemplate?.id === t.id ? 'text-white' : 'text-gray-800'}`}>{t.name}</p>
                    <p className={`text-[9px] truncate mt-0.5 font-black uppercase ${activeTemplate?.id === t.id ? 'text-gray-400' : 'text-blue-500'}`}>{t.is_double_page ? "Plantilla Doble (2 Hojas)" : "Plantilla Simple (1 Hoja)"}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }} className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-colors ${activeTemplate?.id === t.id ? 'text-white hover:bg-gray-800' : 'text-red-500 hover:bg-red-50'}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* TOOLBOX WHEN TEMPLATE ACTIVE */}
            {activeTemplate && (
              <div className="p-4 border-t border-gray-200 bg-white flex flex-col gap-2 min-w-[300px] overflow-y-auto max-h-[55vh] custom-scrollbar">
                
                {/* COLLAGE PRESETS */}
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 border-b border-gray-100 pb-1">Collages Rápidos</p>
                <div className="grid grid-cols-4 gap-1 mb-2">
                   <button onClick={() => addPresetCollage(2)} className="p-1.5 bg-gray-50 border border-gray-200 rounded hover:border-blue-400 flex flex-col items-center justify-center gap-1"><LayoutGrid size={14} className="text-gray-500"/><span className="text-[9px] font-bold text-gray-600">2 Fotos</span></button>
                   <button onClick={() => addPresetCollage(3)} className="p-1.5 bg-gray-50 border border-gray-200 rounded hover:border-blue-400 flex flex-col items-center justify-center gap-1"><LayoutGrid size={14} className="text-gray-500"/><span className="text-[9px] font-bold text-gray-600">3 Fotos</span></button>
                   <button onClick={() => addPresetCollage(4)} className="p-1.5 bg-gray-50 border border-gray-200 rounded hover:border-blue-400 flex flex-col items-center justify-center gap-1"><LayoutGrid size={14} className="text-gray-500"/><span className="text-[9px] font-bold text-gray-600">4 Fotos</span></button>
                </div>

                {/* TEXT PRESETS */}
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 border-b border-gray-100 pb-1 mt-1">Bloques de Texto</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                   <button onClick={() => addElement("text", "title")} className="p-2 bg-white border border-gray-200 rounded hover:border-blue-400 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1"><Type size={14} className="text-blue-500" /> Título</button>
                   <button onClick={() => addElement("text", "description")} className="p-2 bg-white border border-gray-200 rounded hover:border-blue-400 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1"><AlignLeft size={14} className="text-purple-500" /> Párrafo</button>
                   <button onClick={() => addElement("text", "bubble")} className="p-2 bg-white border border-gray-200 rounded hover:border-blue-400 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1"><Smile size={14} className="text-pink-500" /> Burbuja</button>
                   <button onClick={() => addElement("text", "ribbon")} className="p-2 bg-white border border-gray-200 rounded hover:border-blue-400 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1"><Layers size={14} className="text-yellow-600" /> Listón</button>
                </div>

                {/* MULTIMEDIA PRESETS */}
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 border-b border-gray-100 pb-1 mt-1">Multimedia y Especiales</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                   <button onClick={() => addElement("image")} className="p-2 bg-white border border-gray-200 rounded hover:border-blue-400 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1"><ImageIcon size={14} className="text-pink-500" /> Foto</button>
                   <button onClick={() => addElement("video")} className="p-2 bg-white border border-gray-200 rounded hover:border-blue-400 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1"><Video size={14} className="text-red-500" /> Video</button>
                   <button onClick={() => addElement("audio")} className="p-2 bg-white border border-gray-200 rounded hover:border-blue-400 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1"><Mic size={14} className="text-orange-500" /> Audio</button>
                   <button onClick={addPresetCalendar} className="p-2 bg-white border border-gray-200 rounded hover:border-blue-400 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1"><CalendarDays size={14} className="text-teal-600" /> Calendario</button>
                   <button onClick={() => setShowStickerModal(true)} className="p-2 bg-white border border-gray-200 rounded hover:border-blue-400 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 col-span-2"><Smile size={14} className="text-yellow-500" /> Explorar Stickers</button>
                </div>
              </div>
            )}
          </div>
      {/* STICKER PICKER MODAL */}
      <AnimatePresence>
        {showStickerModal && (
          <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowStickerModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Elige un Sticker</h2>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
                {dbStickers.map(s => (
                  <button key={s.id} onClick={() => { addElement("sticker", s.url); setShowStickerModal(false); }} className="aspect-square bg-gray-50 rounded-xl hover:bg-gray-100 hover:scale-105 transition-all p-2 flex items-center justify-center">
                    <img src={getProxiedUrl(s.url)} crossOrigin="anonymous" className="w-full h-full object-contain" />
                  </button>
                ))}
                {dbStickers.length === 0 && <p className="col-span-full text-center text-gray-400 text-sm py-10">No hay stickers disponibles.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* TOP TOOLBAR */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 shrink-0 z-20 shadow-sm" onClick={e => e.stopPropagation()}>
          {onBack && (
            <button 
              onClick={onBack} 
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors mr-3 text-xs font-bold"
              title="Volver al Panel"
            >
              <ChevronLeft size={16} /> Volver
            </button>
          )}

          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors mr-3" title="Ocultar/Mostrar Menú Lateral">
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>

          {activeTemplate ? (
            <>
              <div className="flex-1 flex items-center gap-4">
                <input 
                  value={activeTemplate.name} 
                  onChange={(e) => setActiveTemplate({ ...activeTemplate, name: e.target.value })}
                  className="font-black text-lg text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 outline-none py-1 transition-colors w-40 md:w-56"
                  placeholder="Nombre..."
                />
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden md:inline">Fondo:</span>
                  <input type="color" value={activeTemplate.background_color} onChange={(e) => setActiveTemplate({...activeTemplate, background_color: e.target.value})} className="w-6 h-6 p-0 border-0 rounded cursor-pointer border border-gray-200" />
                  <select value={activeTemplate.background_style} onChange={(e) => setActiveTemplate({...activeTemplate, background_style: e.target.value as any})} className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700 outline-none">
                    <option value="solid">Sólido</option>
                    <option value="lines">Líneas</option>
                    <option value="grid">Cuadrícula</option>
                    <option value="dots">Puntos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center bg-gray-100 rounded-md p-1 border border-gray-200">
                  <button onClick={() => setZoom(Math.max(0.2, zoom - 0.1))} className="p-1 text-gray-500 hover:text-gray-800"><ZoomOut size={14}/></button>
                  <span className="text-[10px] font-bold w-10 text-center text-gray-700">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1 text-gray-500 hover:text-gray-800"><ZoomIn size={14}/></button>
                </div>
                <button onClick={saveTemplate} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md font-bold transition-all shadow-md disabled:opacity-50 text-xs">
                  {saving ? "Guardando..." : <><Save size={14}/> <span>Guardar</span></>}
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500 font-medium text-xs">Selecciona o crea una plantilla en el menú izquierdo.</p>
          )}
        </div>

        {/* CANVAS AREA */}
        {activeTemplate ? (
          <div className="flex-1 overflow-auto bg-[#e5e7eb] relative p-8 flex items-center justify-center custom-scrollbar" ref={containerRef}>
            
            {/* PROPERTIES TOOLBAR (Floating Canva Style) */}
            {selectedEl && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.2)] border border-gray-200 p-2 flex items-center gap-2 z-[9999] text-[11px] flex-wrap justify-center max-w-[95vw]"
                onClick={e => e.stopPropagation()}
              >
                
                {/* DYNAMIC BINDING (First because it's most important) */}
                <div className="flex flex-col justify-center border-r border-gray-200 pr-2 mr-1">
                  <span className="text-[8px] font-black uppercase text-gray-400 mb-0.5">Vincular a:</span>
                  <select value={selectedEl.variable || ""} onChange={(e) => updateActiveElement({ variable: e.target.value })} className="bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded border border-blue-200 outline-none max-w-[100px] text-[10px]">
                    <option value="">(Ninguno)</option>
                    {selectedEl.type === "image" || selectedEl.type === "video" || selectedEl.type === "audio" ? (
                      <>
                        <option value="photo_1">Media 1 (Principal)</option>
                        <option value="photo_2">Media 2</option>
                        <option value="photo_3">Media 3</option>
                        <option value="photo_4">Media 4</option>
                        <option value="photo_5">Media 5</option>
                        <option value="photo_6">Media 6</option>
                      </>
                    ) : selectedEl.type === "text" ? (
                      <>
                        <option value="title">Título</option>
                        <option value="date">Fecha</option>
                        <option value="description">Descripción</option>
                        <option value="child_name">Nombre Bebé</option>
                      </>
                    ) : null}
                  </select>
                </div>

                {/* TEXT SPECIFIC */}
                {selectedEl.type === "text" && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-2 mr-1">
                    <div className="flex flex-col items-center gap-0.5">
                       <span className="text-[7px] font-black uppercase text-gray-400">Texto</span>
                       <input type="color" value={selectedEl.color} onChange={(e) => updateActiveElement({ color: e.target.value })} className="w-5 h-5 p-0 border-0 cursor-pointer rounded-full overflow-hidden shrink-0" title="Color de Texto" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                       <span className="text-[7px] font-black uppercase text-gray-400">Fondo</span>
                       <input type="color" value={selectedEl.bgColor || "#ffffff"} onChange={(e) => updateActiveElement({ bgColor: e.target.value })} className="w-5 h-5 p-0 border-0 cursor-pointer rounded-full overflow-hidden shrink-0 shadow-sm border border-gray-200" title="Color de Fondo del Texto" />
                    </div>
                    
                    {/* FONT SIZE */}
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-1 shrink-0">
                      <span className="text-[10px] font-bold text-gray-500 mr-1">px</span>
                      <input type="number" value={selectedEl.fontSize || 16} onChange={(e) => updateActiveElement({ fontSize: Number(e.target.value) })} className="w-10 py-0.5 bg-transparent font-mono text-[11px] font-bold text-center outline-none" title="Tamaño de letra" />
                    </div>

                    {/* CUSTOM FONT DROPDOWN PREVIEW */}
                    <div className="relative shrink-0">
                       <button onClick={() => setFontPickerOpen(!fontPickerOpen)} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded font-bold text-gray-700 min-w-[120px] text-left truncate" style={{ fontFamily: selectedEl.fontFamily }}>
                         {FONTS.find(f => f.family === selectedEl.fontFamily)?.label || "Fuente"}
                       </button>
                       {fontPickerOpen && (
                         <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto w-48 z-50 p-1">
                           {FONTS.map(f => (
                             <button key={f.id} onClick={() => { updateActiveElement({ fontFamily: f.family }); setFontPickerOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm transition-colors border-b border-gray-50 last:border-0" style={{ fontFamily: f.family }}>
                               {f.label}
                             </button>
                           ))}
                         </div>
                       )}
                    </div>

                    <select value={selectedEl.textStyle || "none"} onChange={(e) => updateActiveElement({ textStyle: e.target.value as any })} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded outline-none font-bold text-gray-700">
                      <option value="none">Texto Normal</option>
                      <option value="bubble-round">Burbuja Redonda</option>
                      <option value="bubble-square">Burbuja Cuadrada</option>
                      <option value="ribbon">Listón (Cinta)</option>
                    </select>
                    
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded overflow-hidden">
                      <button onClick={() => updateActiveElement({textAlign: "left"})} className={`p-1 ${selectedEl.textAlign==="left"?'bg-gray-200 text-blue-600':'text-gray-500'}`}><AlignLeft size={14}/></button>
                      <button onClick={() => updateActiveElement({textAlign: "center"})} className={`p-1 border-l border-r border-gray-200 ${selectedEl.textAlign==="center"||!selectedEl.textAlign?'bg-gray-200 text-blue-600':'text-gray-500'}`}><AlignCenter size={14}/></button>
                      <button onClick={() => updateActiveElement({textAlign: "right"})} className={`p-1 ${selectedEl.textAlign==="right"?'bg-gray-200 text-blue-600':'text-gray-500'}`}><AlignRight size={14}/></button>
                    </div>
                  </div>
                )}

                {/* MEDIA SPECIFIC */}
                {(selectedEl.type === "image" || selectedEl.type === "video" || selectedEl.type === "audio") && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-2 mr-1">
                    {(selectedEl.type === "video" || selectedEl.type === "audio") && (
                       <div className="flex flex-col gap-0.5">
                         <span className="text-[8px] font-black uppercase text-gray-400">Estilo Reproductor</span>
                         <select value={selectedEl.mediaStyle || "dark"} onChange={(e) => updateActiveElement({ mediaStyle: e.target.value as any })} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded outline-none font-bold text-gray-700">
                           <option value="dark">Oscuro (Dark)</option>
                           <option value="light">Claro (Light)</option>
                           <option value="colorful">Colorido</option>
                           <option value="minimal">Minimalista</option>
                         </select>
                       </div>
                    )}
                    {(selectedEl.type === "image" || selectedEl.type === "video") && (
                       <>
                         <div className="flex flex-col gap-0.5">
                           <span className="text-[8px] font-black uppercase text-gray-400">Formato</span>
                           <select value={selectedEl.shape || "none"} onChange={(e) => updateActiveElement({ shape: e.target.value as any })} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded outline-none font-bold text-gray-700">
                             <option value="none">Rectángulo</option>
                             <option value="circle">Círculo</option>
                             <option value="heart">Corazón</option>
                             <option value="star">Estrella</option>
                           </select>
                         </div>
                         <div className="flex flex-col gap-0.5">
                           <span className="text-[8px] font-black uppercase text-gray-400">Marco</span>
                           <select value={selectedEl.frameStyle || "none"} onChange={(e) => updateActiveElement({ frameStyle: e.target.value as any })} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded outline-none font-bold text-gray-700">
                             <option value="none">Ninguno</option>
                             <option value="white">Blanco Simple</option>
                             <option value="polaroid">Polaroid</option>
                             <option value="wood">Madera</option>
                             <option value="film">Cinta de Cine</option>
                           </select>
                         </div>
                       </>
                    )}
                  </div>
                )}

                {/* CALENDAR SPECIFIC */}
                {selectedEl.type === "calendar" && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-2 mr-1">
                    <input type="color" value={selectedEl.color} onChange={(e) => updateActiveElement({ color: e.target.value })} className="w-6 h-6 p-0 border-0 cursor-pointer rounded-full overflow-hidden" title="Color del Texto" />
                    <div className="relative">
                       <button onClick={() => setFontPickerOpen(!fontPickerOpen)} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded font-bold text-gray-700 min-w-[120px] text-left truncate" style={{ fontFamily: selectedEl.fontFamily }}>
                         {FONTS.find(f => f.family === selectedEl.fontFamily)?.label || "Fuente"}
                       </button>
                       {fontPickerOpen && (
                         <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto w-48 z-[9999] p-1">
                           {FONTS.map(f => (
                             <button key={f.id} onClick={() => { updateActiveElement({ fontFamily: f.family }); setFontPickerOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm transition-colors border-b border-gray-50 last:border-0" style={{ fontFamily: f.family }}>
                               {f.label}
                             </button>
                           ))}
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {/* LAYERS & ROTATION */}
                <div className="flex items-center gap-2 border-r border-gray-200 pr-2 mr-1">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black uppercase text-gray-400 mb-0.5">Capas</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => changeZIndex(-1)} className="p-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded" title="Atrás"><SendToBack size={12}/></button>
                        <span className="font-mono text-gray-500 w-4 text-center">{selectedEl.z}</span>
                        <button onClick={() => changeZIndex(1)} className="p-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded" title="Adelante"><BringToFront size={12}/></button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center ml-1">
                      <span className="text-[8px] font-black uppercase text-gray-400 mb-0.5">Rotar</span>
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-1">
                        <RotateCw size={10} className="text-gray-400"/>
                        <input type="number" value={selectedEl.rotation || 0} onChange={(e) => updateActiveElement({ rotation: Number(e.target.value) })} className="w-8 py-0.5 bg-transparent font-mono text-[10px] text-center outline-none" />
                      </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-1">
                  <button onClick={duplicateActiveElement} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Duplicar"><Copy size={14} /></button>
                  <button onClick={deleteActiveElement} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            )}

            {/* THE CANVAS / SPREAD */}
            <div 
              id="editor-canvas"
              className={`relative shadow-[0_20px_50px_rgba(0,0,0,0.15)] origin-center transition-transform w-full ${activeTemplate.is_double_page ? 'max-w-[1000px] aspect-[3/2]' : 'max-w-[500px] aspect-[3/4]'}`}
              style={{ 
                transform: `scale(${zoom})`, 
                ...getBgStyle() 
              }}
            >
              {/* Spine shadow if double page - THIS MUST BE Z-[9999] so it overlays the elements in the middle! */}
              {activeTemplate.is_double_page && (
                <>
                  <div className="absolute left-[50%] top-0 bottom-0 w-16 -translate-x-full z-[9999] pointer-events-none mix-blend-multiply" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.12), transparent)' }} />
                  <div className="absolute left-[50%] top-0 bottom-0 w-[2px] bg-black/15 z-[9999] pointer-events-none mix-blend-multiply" />
                  <div className="absolute left-[50%] top-0 bottom-0 w-16 z-[9999] pointer-events-none mix-blend-multiply" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)' }} />
                </>
              )}

              {activeTemplate.elements.map(el => {
                const isSelected = selectedId === el.id;
                
                let extraStyles: React.CSSProperties = {};
                let innerClass = "w-full h-full flex flex-col items-center justify-center overflow-hidden";
                
                if (el.type === "image" || el.type === "video") {
                  if (el.shape === "circle") extraStyles.borderRadius = "50%";
                  if (el.shape === "heart") extraStyles.clipPath = "path('M 50 25 C 25 -10, -10 25, 50 90 C 110 25, 75 -10, 50 25 Z')"; 
                  if (el.shape === "star") extraStyles.clipPath = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"; 
                  // Frame
                  if (el.frameStyle === "white") { extraStyles.border = "6px solid white"; extraStyles.boxShadow = "0 4px 6px rgba(0,0,0,0.1)"; }
                  if (el.frameStyle === "polaroid") { extraStyles.border = "8px solid white"; extraStyles.borderBottomWidth = "30px"; extraStyles.boxShadow = "0 8px 15px rgba(0,0,0,0.15)"; }
                  if (el.frameStyle === "wood") { extraStyles.border = "10px solid #8B5A2B"; extraStyles.boxShadow = "inset 0 0 10px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.2)"; }
                  if (el.frameStyle === "film") { extraStyles.borderTop = "8px dashed black"; extraStyles.borderBottom = "8px dashed black"; extraStyles.borderLeft = "2px solid black"; extraStyles.borderRight = "2px solid black"; extraStyles.backgroundColor = "black"; }
                  // Edge fade
                  if (el.edgeFade) { extraStyles.maskImage = "radial-gradient(ellipse at center, black 40%, transparent 100%)"; extraStyles.WebkitMaskImage = extraStyles.maskImage; }
                }

                if (el.type === "text") {
                  if (el.bgColor) extraStyles.backgroundColor = el.bgColor;
                  if (el.textStyle === "bubble-round") {
                     extraStyles.backgroundColor = el.color ? el.color + '20' : '#fff'; 
                     extraStyles.borderRadius = '20px';
                     extraStyles.border = `2px solid ${el.color}`;
                     extraStyles.padding = '10px';
                  } else if (el.textStyle === "bubble-square") {
                     extraStyles.backgroundColor = el.color ? el.color + '20' : '#fff'; 
                     extraStyles.borderRadius = '5px';
                     extraStyles.border = `2px solid ${el.color}`;
                     extraStyles.padding = '10px';
                  } else if (el.textStyle === "ribbon") {
                     extraStyles.backgroundColor = el.color;
                     extraStyles.color = '#fff';
                     extraStyles.clipPath = 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)';
                     extraStyles.padding = '5px 20px';
                  }
                }

                if(el.type === 'shape') {
                  extraStyles.backgroundColor = el.color;
                } else if(el.type === 'image' || el.type === 'video' || el.type === 'audio') {
                  if (el.type === 'video') {
                     extraStyles.backgroundColor = el.mediaStyle === 'light' ? 'rgba(255,255,255,0.9)' : el.mediaStyle === 'colorful' ? 'rgba(236, 72, 153, 0.9)' : el.mediaStyle === 'minimal' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.85)';
                  } else {
                     extraStyles.backgroundColor = 'rgba(0,0,0,0.08)';
                  }
                }

                return (
                  <div
                    key={el.id}
                    className={`absolute transition-shadow group ${isSelected ? 'ring-1 ring-blue-500 z-[9990]' : 'hover:ring-1 hover:ring-blue-300/50'} select-none`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.w}%`,
                      height: `${el.h}%`,
                      zIndex: el.z,
                      transform: `rotate(${el.rotation || 0}deg)`,
                      opacity: el.type === 'shape' ? el.opacity : 1,
                      borderRadius: el.type === 'shape' ? `${el.radius || 0}px` : undefined,
                      ...extraStyles
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                  >
                    {/* DRAG HANDLE OVERLAY (So user can click anywhere in element to drag if not text) */}
                    <div className="absolute inset-0 z-10 cursor-move" onPointerDown={(e) => handlePointerDownMove(e, el.id)} />

                    {/* RESIZE HANDLES (Visible only when selected) */}
                    {isSelected && (
                       <>
                         <div onPointerDown={(e) => handlePointerDownResize(e, el.id, 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-600 rounded-full z-50 cursor-nwse-resize border-2 border-white shadow-sm" />
                         <div onPointerDown={(e) => handlePointerDownResize(e, el.id, 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-600 rounded-full z-50 cursor-nesw-resize border-2 border-white shadow-sm" />
                         <div onPointerDown={(e) => handlePointerDownResize(e, el.id, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-600 rounded-full z-50 cursor-nesw-resize border-2 border-white shadow-sm" />
                         <div onPointerDown={(e) => handlePointerDownResize(e, el.id, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-600 rounded-full z-50 cursor-nwse-resize border-2 border-white shadow-sm" />
                       </>
                    )}

                    {/* SELECTION / MOVE BUTTON */}
                    <div 
                      onPointerDown={(e) => handlePointerDownMove(e, el.id)}
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center cursor-move z-50 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      <GripHorizontal size={12} />
                    </div>

                    {/* INNER CONTENT REPS */}
                    {el.type === 'image' && (
                      <div className={`${innerClass} backdrop-blur-sm relative pointer-events-none`}>
                        <ImageIcon size={32} className="text-gray-400 mb-2" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/70 px-2 py-1 rounded-full shadow-sm">{el.variable || "Foto"}</span>
                      </div>
                    )}

                    {el.type === 'video' && (
                      <div className={`${innerClass} relative overflow-hidden pointer-events-none`}>
                        {/* Fake video background to look like a loop */}
                        <div className={`absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] ${el.mediaStyle === 'light' ? 'invert' : ''}`} />
                        <div className={`absolute inset-0 bg-gradient-to-br ${el.mediaStyle === 'light' ? 'from-white/30 to-gray-200/30' : el.mediaStyle === 'colorful' ? 'from-pink-500/30 to-purple-500/30' : el.mediaStyle === 'minimal' ? 'from-transparent' : 'from-red-900/30 to-black/30'}`} />
                        
                        <div className={`relative z-10 w-16 h-16 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border mb-2 ${el.mediaStyle === 'light' ? 'bg-black/10 border-black/10' : 'bg-white/20 border-white/30'}`}>
                          <PlayCircle size={32} className={el.mediaStyle === 'light' ? 'text-black' : 'text-white'} />
                        </div>
                        <span className={`relative z-10 text-[10px] font-black uppercase tracking-widest backdrop-blur px-3 py-1 rounded-full shadow-sm ${el.mediaStyle === 'light' ? 'bg-black/10 text-black' : 'bg-red-500/80 text-white'}`}>
                          {el.variable || "Video Loop"}
                        </span>
                        
                        {/* Fake progress bar at bottom */}
                        <div className={`absolute bottom-3 inset-x-4 h-1 rounded-full overflow-hidden ${el.mediaStyle === 'light' ? 'bg-black/10' : 'bg-white/20'}`}>
                           <div className={`h-full w-1/3 rounded-full ${el.mediaStyle === 'light' ? 'bg-black' : el.mediaStyle === 'colorful' ? 'bg-purple-500' : 'bg-red-500'}`} />
                        </div>
                      </div>
                    )}

                    {el.type === 'audio' && (
                      <div className={`w-full h-full flex flex-col items-center justify-center rounded-xl shadow-inner border p-2 relative overflow-hidden pointer-events-none ${el.mediaStyle === 'light' ? 'bg-white border-gray-200' : el.mediaStyle === 'colorful' ? 'bg-pink-100 border-pink-300' : el.mediaStyle === 'minimal' ? 'bg-transparent border-transparent' : 'bg-[#1A1A1A] border-gray-800'}`}>
                         {/* Audio Player Premium UI */}
                         <div className={`absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r mix-blend-overlay ${el.mediaStyle === 'colorful' ? 'from-pink-500/20' : 'from-orange-500/20 to-transparent'}`} />
                         <div className="w-full flex items-center gap-3 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg border ${el.mediaStyle === 'light' ? 'bg-gray-100 border-gray-300 text-gray-800' : el.mediaStyle === 'colorful' ? 'bg-gradient-to-br from-pink-400 to-pink-600 border-pink-300/50 text-white' : 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-300/50 text-white'}`}>
                               <PlayCircle size={16} />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                               <div className="flex justify-between items-end">
                                  <span className={`text-[9px] font-black uppercase tracking-widest truncate ${el.mediaStyle === 'light' || el.mediaStyle === 'colorful' ? 'text-gray-800' : 'text-white/90'}`}>{el.variable || "Nota de Voz"}</span>
                                  <span className={`text-[8px] font-mono ${el.mediaStyle === 'light' || el.mediaStyle === 'colorful' ? 'text-gray-500' : 'text-white/50'}`}>0:00 / 1:24</span>
                               </div>
                               {/* Fake waveform */}
                               <div className="w-full h-2 flex items-end gap-[1px]">
                                 {[...Array(20)].map((_, i) => (
                                   <div key={i} className={`flex-1 rounded-t-sm ${el.mediaStyle === 'light' ? 'bg-gray-400' : el.mediaStyle === 'colorful' ? 'bg-pink-400' : 'bg-orange-400/80'}`} style={{ height: `${Math.random() * 100}%` }} />
                                 ))}
                               </div>
                            </div>
                         </div>
                      </div>
                    )}

                    {el.type === 'calendar' && (
                      <div className={`${innerClass} pointer-events-none p-4`} style={{ fontFamily: el.fontFamily, color: el.color || "#333" }}>
                         <div className="w-full grid grid-cols-7 gap-1 text-center font-bold tracking-widest mb-4">
                           <span className="text-[10px]">M</span><span className="text-[10px]">T</span><span className="text-[10px]">W</span><span className="text-[10px]">T</span><span className="text-[10px]">F</span><span className="text-[10px]">S</span><span className="text-[10px]">S</span>
                         </div>
                         <div className="w-full flex-1 grid grid-cols-7 gap-1 text-center">
                            <div className="text-[12px] opacity-20">-</div><div className="text-[12px] opacity-20">-</div>
                            {[...Array(30)].map((_, i) => (
                              <div key={i} className="text-[12px] flex items-center justify-center">{i+1}</div>
                            ))}
                         </div>
                      </div>
                    )}

                    {el.type === 'sticker' && (
                      <div className="w-full h-full flex items-center justify-center pointer-events-none">
                        <img src={getProxiedUrl(el.url || "")} className="w-full h-full object-contain" />
                      </div>
                    )}
                    
                    {el.type === 'text' && (
                      <div className={`w-full h-full flex ${el.textAlign === 'center' || !el.textAlign ? 'justify-center' : el.textAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                        {isSelected ? (
                          <textarea 
                            value={el.text} 
                            onChange={(e) => updateActiveElement({ text: e.target.value })}
                            onPointerDown={e => e.stopPropagation()} 
                            className="w-full h-full bg-transparent resize-none outline-none leading-tight overflow-hidden relative z-20 p-2"
                            style={{ 
                              color: el.textStyle === 'ribbon' ? '#fff' : el.color, 
                              fontSize: `${(el.fontSize || 16)}px`, 
                              fontFamily: el.fontFamily, 
                              textAlign: el.textAlign || "center" 
                            }}
                          />
                        ) : (
                          <div className="w-full break-words leading-tight flex items-center p-2 relative z-20 pointer-events-none" 
                               style={{ 
                                 color: el.textStyle === 'ribbon' ? '#fff' : el.color, 
                                 fontSize: `${(el.fontSize || 16)}px`, 
                                 fontFamily: el.fontFamily, 
                                 justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                 textAlign: el.textAlign || "center" 
                               }}>
                            {el.text}
                          </div>
                        )}
                        {el.variable && <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full shadow-sm transition-opacity z-50 ${isSelected ? 'opacity-0' : 'opacity-100'}`}>{el.variable}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Layers className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-700">Diseñador de Álbum Digital</h3>
              <p className="text-gray-500 mt-2">Selecciona una plantilla de la barra lateral.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
