"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Plus, Trash2, Download, Save, 
  Settings2, ImageIcon, ChevronLeft, Edit3,
  X, Wand2, Maximize2, Sticker as StickerIcon,
  ZoomIn, ZoomOut, RefreshCw, Hand, 
  RotateCw, Check, Minus, Type, Columns, Rows, Palette,
  Paintbrush, Layout, Eye, EyeOff, Menu, Home, User, LogOut, ChevronRight, UserCircle2, Move,
  Dices, ChevronDown, Upload, AlignCenter
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { exportElementAsPng, normalizeExportFilename, waitForExportAssets, generateElementBlob } from "@/lib/exportCalendarImage";

const BOARD_WIDTH = 1800;
const BOARD_HEIGHT = 2400;

interface PregnancyCalendarProps {
  childId: string;
  calendarId: string;
  sectionId?: string | null;
  theme: any;
  onBack: () => void;
  autoDownload?: boolean;
  onAutoDownloadComplete?: () => void;
  readOnly?: boolean;
  hideHeader?: boolean;
  variant?: 'full' | 'thumbnail';
}

export default function PregnancyCalendar({ childId, calendarId, sectionId = null, theme, onBack, autoDownload = false, onAutoDownloadComplete, readOnly = false, hideHeader = false, variant = 'full' }: PregnancyCalendarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [showMasterMenu, setShowMasterMenu] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string | null>(null);
  
  const numberWords = ["Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez", "Once", "Doce", "Trece", "Catorce", "Quince", "Dieciséis", "Diecisiete", "Dieciocho", "Diecinueve", "Veinte", "Veintiuno", "Veintidós", "Veintitrés", "Veinticuatro"];
  const colors = ["#E91E63", "#D4AF37", "#2196F3", "#4CAF50", "#4A4238", "#FF9800", "#795548", "#607D8B", "#000000", "#FFFFFF"];

  const bgOptions = [
    { id: 'classic', name: 'Crema', value: '#FDFBF7', type: 'color' },
    { id: 'wood', name: 'Madera', value: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.15\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")', type: 'texture' },
    { id: 'linen', name: 'Lino', value: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.05\' numOctaves=\'5\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")', type: 'texture' },
    { id: 'sand', name: 'Arenado', value: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")', type: 'texture' },
    { id: 'pink', name: 'Rosa', value: '#FFF5F7', type: 'color' },
    { id: 'blue', name: 'Azul', value: '#F0F7FF', type: 'color' },
    { id: 'green', name: 'Menta', value: '#F2FFF9', type: 'color' }
  ];

  const frameStyles = [
    { id: 'classic', name: 'Clásico' },
    { id: 'polaroid', name: 'Polaroid' },
    { id: 'stitched', name: 'Costura' },
    { id: 'gold', name: 'Oro' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'wood', name: 'Madera' }
  ];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (containerRef.current) {
        const cw = containerRef.current.offsetWidth - 20;
        setAutoScale(Math.min(cw / 2400, 1));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getProxiedUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("data:") || url.startsWith("/") || url.includes("localhost") || url.includes("127.0.0.1")) {
      return url;
    }
    if (url.startsWith("http")) {
      return `/api/download?url=${encodeURIComponent(url)}&inline=true`;
    }
    return url;
  };

  const getProxiedBg = (bgValue: string) => {
    if (!bgValue) return "none";
    if (bgValue.startsWith("url")) {
      const match = bgValue.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (match && match[1]) {
        const innerUrl = match[1];
        return `url("${getProxiedUrl(innerUrl)}")`;
      }
    }
    return bgValue;
  };

  const [title, setTitle] = useState("PRIMER AÑO DE");
  const [titleColor, setTitleColor] = useState('#4A4238');
  const [titleFontSize, setTitleFontSize] = useState(50);
  const [babyName, setBabyName] = useState("");
  const [nickname, setNickname] = useState("");
  const [useNickname, setUseNickname] = useState(false);
  const [nameColor, setNameColor] = useState('#E91E63');
  const [nameFontSize, setNameFontSize] = useState(180);
  const [boardBg, setBoardBg] = useState(bgOptions[0].value);
  const [boardCustomColor, setBoardCustomColor] = useState('#FDFBF7');
  const [bgOpacity, setBgOpacity] = useState(1);
  const [activeFrameStyle, setActiveFrameStyle] = useState('classic');
  const [frameScale, setFrameScale] = useState(1);
  
  const [gridConfig, setGridConfig] = useState({ rows: 4, cols: 3 });
  const [slots, setSlots] = useState<Record<string, string>>({}); 
  const [slotAdjust, setSlotAdjust] = useState<Record<string, { scale: number, x: number, y: number }>>({});
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [slotRotations, setSlotRotations] = useState<Record<string, number>>({});
  const [heroConfig, setHeroConfig] = useState({ src: "/stickers/st1.png", size: 450, rotation: 0 });
  const [anchoredStickers, setAnchoredStickers] = useState<Record<string, any>>({});
  const [freeTexts, setFreeTexts] = useState<any[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showHeroPicker, setShowHeroPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [assetTab, setAssetTab] = useState<'global' | 'mine' | 'tape'>('global');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  
  const [memories, setMemories] = useState<any[]>([]);
  const [child, setChild] = useState<any>(null);
  const [dbStickers, setDbStickers] = useState<any[]>([]);
  const [dbBackgrounds, setDbBackgrounds] = useState<any[]>([]);
  const [dbTapes, setDbTapes] = useState<any[]>([]);

  const filteredMemories = useMemo(() => {
    if (filterMonth === 'all') return memories;
    return memories.filter(m => m.month_number === filterMonth);
  }, [memories, filterMonth]);

  useEffect(() => {
    async function load() {
      setIsLoaded(false);
      const { data: { session } } = await supabase.auth.getSession();
      
      const memoriesQuery = supabase.from("pregnancy_memories").select("*").eq("child_id", childId);
      if (sectionId) {
        memoriesQuery.eq("section_id", sectionId);
      } else {
        memoriesQuery.is("section_id", null);
      }

      const [childRes, memsRes, sticksRes, bgsRes, tapesRes, calRes] = await Promise.all([
        supabase.from("children").select("*").eq("id", childId).single(),
        memoriesQuery.order('memory_date', { ascending: true }),
        supabase.from("assets").select("*").eq("type", "sticker").or(`user_id.is.null,user_id.eq.${session?.user?.id}`),
        supabase.from("assets").select("*").eq("type", "background").or(`user_id.is.null,user_id.eq.${session?.user?.id}`),
        supabase.from("assets").select("*").eq("type", "tape").or(`user_id.is.null,user_id.eq.${session?.user?.id}`),
        supabase.from("pregnancy_calendars").select("*").eq("id", calendarId).single()
      ]);

      const childData = childRes.data;
      if (childData) {
        setChild(childData);
        setNickname(childData.nickname || "");
      }
      
      if (memsRes.data) setMemories(memsRes.data);
      if (sticksRes.data) setDbStickers(sticksRes.data);
      if (bgsRes.data) setDbBackgrounds(bgsRes.data);
      if (tapesRes.data) setDbTapes(tapesRes.data);

      const cal = calRes.data;
      if (cal) {
        setTitle(cal.title || "PRIMER AÑO DE");
        setBabyName(cal.display_name || childData?.name || "");
        setSlots(cal.photos_config || {});
        setSlotAdjust(cal.photos_adjust || {});
        setLabels(cal.labels_config || {});
        setAnchoredStickers(cal.stickers_config || {});
        const lConfig = cal.layout_config || {};
        setGridConfig({ rows: lConfig.rows || 3, cols: lConfig.cols || 4 });
        setSlotRotations(lConfig.rotations || {});
        setHeroConfig({ src: cal.hero_image || "/stickers/st1.png", size: lConfig.heroSize || 450, rotation: lConfig.heroRotation || 0 });
        
        if (lConfig.frameScale !== undefined) setFrameScale(lConfig.frameScale);
        if (lConfig.useNickname !== undefined) setUseNickname(lConfig.useNickname);
        if (lConfig.nameColor) setNameColor(lConfig.nameColor);
        if (lConfig.nameFontSize) setNameFontSize(lConfig.nameFontSize);
        if (lConfig.titleColor) setTitleColor(lConfig.titleColor);
        if (lConfig.titleFontSize) setTitleFontSize(lConfig.titleFontSize);
        if (lConfig.boardBg) setBoardBg(lConfig.boardBg);
        if (lConfig.boardCustomColor) setBoardCustomColor(lConfig.boardCustomColor);
        if (lConfig.bgOpacity !== undefined) setBgOpacity(lConfig.bgOpacity);
        if (lConfig.frameStyle) setActiveFrameStyle(lConfig.frameStyle);
        if (lConfig.freeTexts) setFreeTexts(lConfig.freeTexts);
      }
      setIsLoaded(true);
    }
    load();
  }, [calendarId, childId, sectionId]);

  const handleSave = async () => {
    setLoading(true);
    
    let thumbnailUrl = null;
    try {
      if (boardRef.current) {
        const blob = await generateElementBlob(boardRef.current);
        if (blob) {
          const fileName = `thumb-${calendarId}-${Date.now()}.png`;
          const filePath = `calendar-thumbnails/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, blob, { upsert: true });

          if (!uploadError) {
            const { data: publicData } = supabase.storage
              .from('assets')
              .getPublicUrl(filePath);
            thumbnailUrl = publicData.publicUrl;
          }
        }
      }
    } catch (err) {
      console.warn("Silent capture failed:", err);
    }

    await supabase.from("pregnancy_calendars").update({
      title,
      display_name: useNickname ? nickname : babyName,
      photos_config: slots,
      photos_adjust: slotAdjust,
      labels_config: labels,
      stickers_config: anchoredStickers,
      hero_image: heroConfig.src,
      layout_config: { 
        ...gridConfig, 
        thumbnail_url: thumbnailUrl, // Guardamos aquí para evitar Error 400
        rotations: slotRotations,
        heroSize: heroConfig.size, 
        heroRotation: heroConfig.rotation, 
        frameScale,
        nameColor, 
        nameFontSize,
        titleColor,
        titleFontSize,
        boardBg,
        boardCustomColor,
        bgOpacity,
        frameStyle: activeFrameStyle,
        useNickname,
        freeTexts
      }
    }).eq("id", calendarId);
    setLoading(false);
    setEditMode(false);
    setSelectedObjectId(null);
    setActiveStickerId(null);
    setActiveTextId(null);
    setSelectedSlot(null);
  };

  const downloadImage = async () => {
    if (!boardRef.current) return;
    setLoading(true);
    try {
      await exportElementAsPng(boardRef.current, `calendario-${normalizeExportFilename(babyName)}`, {
        backgroundElement: containerRef.current,
        frameWidth: 1200,
        padding: 80,
      });
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar la imagen. Revisa que las fotos del calendario sigan disponibles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoDownload || !isLoaded || !boardRef.current) return;

    let cancelled = false;
    async function runAutoDownload() {
      await waitForExportAssets(boardRef.current!);
      await new Promise(resolve => window.setTimeout(resolve, 250));
      if (cancelled) return;
      await downloadImage();
      onAutoDownloadComplete?.();
    }

    runAutoDownload();

    return () => {
      cancelled = true;
    };
  }, [autoDownload, isLoaded]);

  const shuffleRotations = () => {
    const newRots: Record<string, number> = {};
    Array.from({ length: 24 }).forEach((_, i) => {
      newRots[`slot-${i}`] = (Math.random() * 6) - 3;
    });
    setSlotRotations(newRots);
  };

  const resetRotations = () => {
    setSlotRotations({});
  };

  const addStickerToAnchor = (src: string) => {
    if (!selectedAnchor) return;
    setAnchoredStickers({ ...anchoredStickers, [selectedAnchor]: { src, size: 280, rotation: 0 } });
    setShowStickerPicker(false);
  };

  const handleUserAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'sticker' | 'background' | 'tape') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setLoading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('files', file);
    formData.append('type', type);

    const { data: { session } } = await supabase.auth.getSession();
    
    try {
      const res = await fetch('/api/user/assets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
        body: formData
      });
      if (res.ok) {
        const { assets } = await res.json();
        if (type === 'sticker') setDbStickers([...dbStickers, ...assets]);
        else if (type === 'tape') setDbTapes([...dbTapes, ...assets]);
        else setDbBackgrounds([...dbBackgrounds, ...assets]);
        alert("¡Subido con éxito a tu colección!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const PhotoFrame = ({ id, label, isHero = false }: { id: string, label: string, isHero?: boolean }) => {
    const rot = slotRotations[id] || 0;
    const frameBase = "relative w-full transition-all duration-500 flex items-center justify-center mb-2 overflow-visible";
    const frameAspect = isHero ? 'aspect-[3.2/5]' : 'aspect-[1/1.1]';
    const adj = slotAdjust[id] || { scale: 1, x: 0, y: 0 };
    
    let borderStyle = "border-[14px] border-white shadow-[0_20px_50px_rgba(0,0,0,0.12),inset_0_2px_15px_rgba(0,0,0,0.06)] bg-white";
    
    if (activeFrameStyle === 'polaroid') {
      borderStyle = "border-[12px] border-b-[50px] border-white shadow-xl bg-white";
    } else if (activeFrameStyle === 'stitched') {
      borderStyle = "border-[14px] border-white shadow-lg bg-white border-dashed";
    } else if (activeFrameStyle === 'wood') {
      borderStyle = "border-[16px] shadow-[0_25px_60px_rgba(0,0,0,0.2)] bg-[#5D4037] border-[#8D6E63] rounded-lg";
    } else if (activeFrameStyle === 'gold') {
      borderStyle = "border-[14px] border-white shadow-[0_25px_60px_rgba(0,0,0,0.16)] bg-white";
    } else if (activeFrameStyle === 'minimal') {
      borderStyle = "border-[6px] border-white shadow-sm bg-white";
    }

    const getFrameBoxShadow = () => {
      if (activeFrameStyle === 'stitched') {
        return `0 0 0 2px ${theme.hex}1a`;
      }
      if (activeFrameStyle === 'gold') {
        return `0 0 0 2px ${theme.hex}66`;
      }
      return undefined;
    };

    return (
      <div className={`flex flex-col items-center mx-auto ${isHero ? 'w-[320px] shrink-0' : 'w-full'}`} style={{ transform: `rotate(${rot}deg) scale(${isHero ? 1 : frameScale})`, maxWidth: isHero ? '320px' : '480px' }}>
        <div className={`${frameBase} ${frameAspect} ${borderStyle} rounded-sm`} style={{ boxShadow: getFrameBoxShadow() }}>
          {['tl', 'tc', 'tr', 'lc', 'rc', 'bl', 'br'].map(corner => {
            const anchorId = `${id}-${corner}`;
            const s = anchoredStickers[anchorId];
            const posMap: Record<string, string> = {
              tl: '-top-20 -left-20', tc: '-top-24 left-1/2 -translate-x-1/2', tr: '-top-20 -right-20',
              lc: 'top-1/2 -left-24 -translate-y-1/2', rc: 'top-1/2 -right-24 -translate-y-1/2',
              bl: '-bottom-20 -left-20', br: '-bottom-20 -right-20'
            };
            const pos = posMap[corner];
            
            return (
              <div key={corner} className={`absolute z-30 ${pos}`}>
                {s ? (
                  <div className="relative group" onClick={(e) => { e.stopPropagation(); setActiveStickerId(anchorId); }}>
                    <img src={getProxiedUrl(s.src)} crossOrigin="anonymous" style={{ width: `${s.size}px`, transform: `rotate(${s.rotation || 0}deg)`, boxShadow: activeStickerId === anchorId ? `0 0 0 8px ${theme.hex}66` : undefined }} className={`h-auto object-contain drop-shadow-2xl ${activeStickerId === anchorId ? 'rounded-[2rem] p-8 bg-white/20' : ''}`} />
                    {editMode && activeStickerId === anchorId && (
                      <div className={`absolute -top-24 left-1/2 -translate-x-1/2 flex gap-4 z-[200] no-export bg-white p-4 rounded-[2.5rem] shadow-[0_25px_50px_rgba(0,0,0,0.3)] border-2 ${theme.borderAccent} min-w-[320px] justify-center items-center`}>
                         <button onClick={(e) => { e.stopPropagation(); const n = {...anchoredStickers}; delete n[anchorId]; setAnchoredStickers(n); setActiveStickerId(null); }} className="p-4 bg-red-500 text-white rounded-full shadow-lg"><Trash2 size={28}/></button>
                         <button onClick={(e) => { e.stopPropagation(); const n = {...anchoredStickers}; n[anchorId].size += 80; setAnchoredStickers(n); }} className={`p-4 ${theme.primaryBg} ${theme.textActive} rounded-full shadow-lg`}><Plus size={28}/></button>
                         <button onClick={(e) => { e.stopPropagation(); const n = {...anchoredStickers}; n[anchorId].size = Math.max(40, n[anchorId].size - 80); setAnchoredStickers(n); }} className={`p-4 bg-white ${theme.text} rounded-full border-2 shadow-lg`} style={{ borderColor: `${theme.hex}1a` }}><Minus size={28}/></button>
                         <button onClick={(e) => { e.stopPropagation(); const n = {...anchoredStickers}; n[anchorId].rotation = (n[anchorId].rotation || 0) + 45; setAnchoredStickers(n); }} className="p-4 bg-blue-600 text-white rounded-full shadow-lg"><RotateCw size={28}/></button>
                      </div>
                    )}
                  </div>
                ) : (
                  editMode && (
                    <button onClick={(e) => { e.stopPropagation(); setSelectedAnchor(anchorId); setShowStickerPicker(true); }} className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-dashed no-export hover:text-white transition-all shadow-xl scale-110 hover:${theme.primaryBg}`} style={{ backgroundColor: `${theme.hex}0d`, borderColor: `${theme.hex}66`, color: theme.hex }}>
                      <Plus size={48} />
                    </button>
                  )
                )}
              </div>
            );
          })}

          <div className="w-full h-full overflow-hidden flex items-center justify-center relative rounded-sm group cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedSlot(id); }} style={{ backgroundColor: `${theme.hex}05` }}>
            {slots[id] ? (
              <motion.img 
                drag={editMode && selectedSlot === id}
                dragMomentum={false}
                onDrag={(e, info) => {
                  const n = {...slotAdjust};
                  if (!n[id]) n[id] = { scale: 1, x: 0, y: 0 };
                  n[id].x += info.delta.x / (autoScale * userZoom);
                  n[id].y += info.delta.y / (autoScale * userZoom);
                  setSlotAdjust(n);
                }}
                src={getProxiedUrl(slots[id])} 
                crossOrigin="anonymous"
                style={{ 
                  scale: adj.scale, 
                  x: adj.x, 
                  y: adj.y,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }} 
                className="absolute inset-0 w-full h-full object-cover pointer-events-auto" 
              />
            ) : (
              <ImageIcon size={72} style={{ color: `${theme.hex}0d` }} />
            )}
            
            {editMode && (
              <div className={`absolute inset-0 bg-black/10 flex items-center justify-center transition-opacity no-export ${selectedSlot === id ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                 <div className="flex gap-4">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedSlot(id); setShowPhotoPicker(true); }} className={`p-6 bg-white rounded-full ${theme.text} shadow-2xl hover:scale-110 transition-transform`}><Camera size={32}/></button>
                    {slots[id] && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); const n = {...slotAdjust}; if (!n[id]) n[id] = { scale: 1, x: 0, y: 0 }; n[id].scale += 0.2; setSlotAdjust(n); }} className={`p-6 ${theme.primaryBg} ${theme.textActive} rounded-full shadow-2xl hover:scale-110 transition-transform`}><ZoomIn size={32}/></button>
                        <button onClick={(e) => { e.stopPropagation(); const n = {...slotAdjust}; if (!n[id]) n[id] = { scale: 1, x: 0, y: 0 }; n[id].scale = Math.max(0.5, n[id].scale - 0.2); setSlotAdjust(n); }} className={`p-6 bg-white rounded-full shadow-2xl hover:scale-110 transition-transform ${theme.text}`}><ZoomOut size={32}/></button>
                      </>
                    )}
                 </div>
              </div>
            )}
          </div>
        </div>
        {editMode ? (
          <input value={labels[id] || label} onClick={(e) => e.stopPropagation()} onChange={(e) => setLabels({...labels, [id]: e.target.value})} className={`text-center text-3xl font-black ${theme.text} bg-transparent outline-none uppercase tracking-widest px-2 w-full border-b-2 border-dashed`} style={{ borderColor: `${theme.hex}66` }} />
        ) : (
          <span className="text-3xl font-black uppercase tracking-widest text-center" style={{ color: `${theme.hex}99` }}>{labels[id] || label}</span>
        )}
      </div>
    );
  };

  const isTexture = boardBg.includes('patterns');

  const addFreeText = () => {
    const newText = {
      id: `text-${Date.now()}`,
      text: "Escribe aquí...",
      x: 1200,
      y: 800,
      fontSize: 80,
      color: "#4A4238",
      fontFamily: "'Dancing Script', cursive",
      rotation: 0
    };
    setFreeTexts([...freeTexts, newText]);
    setActiveTextId(newText.id);
    setEditMode(true);
  };


  const memoizedBoard = useMemo(() => (
    <div 
      style={{ 
        width: `${BOARD_WIDTH}px`,
        height: `${BOARD_HEIGHT}px`,
        backgroundColor: isTexture ? boardCustomColor : (boardBg.startsWith('#') ? boardBg : 'white'),
        backgroundImage: boardBg.startsWith('url') 
          ? `linear-gradient(rgba(255,255,255,${1 - bgOpacity}), rgba(255,255,255,${1 - bgOpacity})), ${isTexture ? `${getProxiedBg(boardBg)}, linear-gradient(${boardCustomColor}, ${boardCustomColor})` : getProxiedBg(boardBg)}`
          : 'none',
        backgroundBlendMode: isTexture ? 'normal, multiply, normal' : 'normal, normal',
        backgroundSize: isTexture ? 'auto, auto, auto' : 'auto, cover',
        backgroundRepeat: isTexture ? 'repeat, repeat, no-repeat' : 'no-repeat, no-repeat',
        backgroundPosition: 'center',
        backgroundOrigin: 'border-box'
      }} 
      className="relative rounded-[8rem] shadow-2xl border-[32px] border-white shrink-0 overflow-hidden"
    >
      <div className="relative w-full h-full p-12 md:p-24 flex flex-col items-center">
        <div className="absolute pointer-events-none opacity-30" style={{ top: '80px', left: '80px', right: '80px', bottom: '80px' }}>
          <div className="absolute top-0 left-[100px] right-[100px] h-[6px]" style={{ backgroundImage: `linear-gradient(to right, ${theme.hex} 50%, transparent 50%)`, backgroundSize: '40px 100%' }} />
          <div className="absolute bottom-0 left-[100px] right-[100px] h-[6px]" style={{ backgroundImage: `linear-gradient(to right, ${theme.hex} 50%, transparent 50%)`, backgroundSize: '40px 100%' }} />
          <div className="absolute top-[100px] bottom-[100px] left-0 w-[6px]" style={{ backgroundImage: `linear-gradient(to bottom, ${theme.hex} 50%, transparent 50%)`, backgroundSize: '100% 40px' }} />
          <div className="absolute top-[100px] bottom-[100px] right-0 w-[6px]" style={{ backgroundImage: `linear-gradient(to bottom, ${theme.hex} 50%, transparent 50%)`, backgroundSize: '100% 40px' }} />
          <div className="absolute top-0 left-0 w-[100px] h-[100px] border-t-[6px] border-l-[6px] border-dashed rounded-tl-[4rem]" style={{ borderColor: theme.hex }} />
          <div className="absolute top-0 right-0 w-[100px] h-[100px] border-t-[6px] border-r-[6px] border-dashed rounded-tr-[4rem]" style={{ borderColor: theme.hex }} />
          <div className="absolute bottom-0 left-0 w-[100px] h-[100px] border-b-[6px] border-l-[6px] border-dashed rounded-bl-[4rem]" style={{ borderColor: theme.hex }} />
          <div className="absolute bottom-0 right-0 w-[100px] h-[100px] border-b-[6px] border-r-[6px] border-dashed rounded-br-[4rem]" style={{ borderColor: theme.hex }} />
        </div>
        
        <div className="absolute left-0 right-0 flex justify-center z-[500] pointer-events-none" style={{ top: "130px" }}>
          {editMode ? (
            <div className="flex flex-col items-center">
              <input 
                value={title} 
                onClick={(e) => { e.stopPropagation(); setSelectedObjectId('title'); setActiveTextId(null); }} 
                onChange={(e) => setTitle(e.target.value.toUpperCase())} 
                className={`bg-transparent text-center font-black tracking-[1em] outline-none border-b-4 border-dashed transition-all cursor-pointer`} 
                style={{ 
                  color: titleColor, 
                  fontSize: `${titleFontSize}px`, 
                  borderColor: selectedObjectId === 'title' ? theme.hex : 'rgba(0,0,0,0.1)',
                  width: `${Math.max(10, title.length + 1)}ch` 
                }} 
              />
              <div className="flex items-center gap-4 mt-2 no-export pointer-events-auto">
                 <input 
                   value={useNickname ? nickname : babyName} 
                   onClick={(e) => { e.stopPropagation(); setSelectedObjectId('name'); }} 
                   onChange={(e) => useNickname ? setNickname(e.target.value) : setBabyName(e.target.value)}
                   className="bg-transparent text-center font-black tracking-tighter outline-none border-b-2 border-dashed"
                   style={{ color: nameColor, fontSize: `${nameFontSize/3}px`, borderColor: `${theme.hex}33` }}
                 />
                 <button 
                   onClick={(e) => { e.stopPropagation(); setUseNickname(!useNickname); }}
                   className={`px-4 py-1 rounded-full text-[8px] font-black uppercase transition-all ${useNickname ? `${theme.primaryBg} ${theme.textActive}` : `${theme.bgLight} ${theme.text}`}`}
                 >
                   {useNickname ? 'Apodo Activo' : 'Usar Apodo'}
                 </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h3 className={`font-outfit font-black tracking-[0.9em] uppercase transition-all`} style={{ color: titleColor, fontSize: `${titleFontSize}px` }}>{title}</h3>
              <h2 className="font-outfit font-black tracking-tighter transition-all" style={{ color: nameColor, fontSize: `${nameFontSize}px`, marginTop: '-20px' }}>{useNickname ? nickname : babyName}</h2>
            </div>
          )}
        </div>
        
        <div className="relative w-full flex items-center justify-between overflow-visible mt-6 px-16">
          <div className="z-[10] relative"><PhotoFrame id="hero" label="Mi primer día" isHero={true} /></div>
          <div className="z-[10] relative overflow-visible translate-y-0 pointer-events-auto">
            <div className="relative flex items-center justify-center group overflow-visible" style={{ width: `${heroConfig.size}px` }}>
              <img src={getProxiedUrl(heroConfig.src)} crossOrigin="anonymous" style={{ width: '100%', height: 'auto', transform: `rotate(${heroConfig.rotation}deg)` }} className="object-contain" />
              {editMode && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-6 no-export bg-white p-8 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] border-2 z-[600] min-h-[400px] justify-center items-center" style={{ borderColor: `${theme.hex}33` }}>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setShowHeroPicker(true); }} className={`p-8 ${theme.primaryBg} ${theme.textActive} rounded-full shadow-xl hover:scale-110 transition-transform`}><Wand2 size={42}/></button>
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.hex }}>Cambiar</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setHeroConfig({...heroConfig, size: heroConfig.size + 150}); }} className={`p-6 bg-white ${theme.text} rounded-full border-2 shadow-xl hover:opacity-90`} style={{ borderColor: `${theme.hex}33` }}><Plus size={36}/></button>
                  <button onClick={(e) => { e.stopPropagation(); setHeroConfig({...heroConfig, size: Math.max(100, heroConfig.size - 150)}); }} className={`p-6 bg-white ${theme.text} rounded-full border-2 shadow-xl hover:opacity-90`} style={{ borderColor: `${theme.hex}33` }}><Minus size={36}/></button>
                  <button onClick={(e) => { e.stopPropagation(); setHeroConfig({...heroConfig, rotation: (heroConfig.rotation || 0) + 45}); }} className="p-6 bg-blue-600 text-white rounded-full shadow-xl hover:rotate-90 transition-transform"><RotateCw size={36}/></button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center overflow-visible mt-4 mb-48 px-12 md:px-20">
          <div className="grid gap-x-12 md:gap-x-16 gap-y-24 transition-all duration-500 w-full" style={{ gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`, width: '100%' }}>
            {Array.from({ length: gridConfig.rows * gridConfig.cols }).map((_, i) => (<PhotoFrame key={i} id={`slot-${i}`} label={numberWords[i] || (i+1).toString()} />))}
          </div>
        </div>

        {freeTexts.map(t => (
          <motion.div
            key={t.id}
            drag={editMode && activeTextId === t.id}
            dragMomentum={false}
            onDrag={(e, info) => {
              const n = [...freeTexts]; const i = n.findIndex(txt => txt.id === t.id); n[i].x += info.delta.x / (autoScale * userZoom); n[i].y += info.delta.y / (autoScale * userZoom); setFreeTexts(n);
            }}
            initial={false}
            style={{ position: 'absolute', left: t.x, top: t.y, x: '-50%', y: '-50%', zIndex: activeTextId === t.id ? 650 : 600, rotate: t.rotation || 0, cursor: editMode ? 'grab' : 'default', boxShadow: activeTextId === t.id ? `0 0 0 4px ${theme.hex}66` : undefined }}
            onClick={(e) => { e.stopPropagation(); if (editMode) { setActiveTextId(t.id); setSelectedObjectId(null); setActiveStickerId(null); } }}
            className={`flex flex-col items-center group ${activeTextId === t.id ? 'rounded-3xl p-6 bg-white/10' : ''}`}
          >
            {editMode && activeTextId === t.id ? (
              <textarea value={t.text} onChange={(e) => { const n = [...freeTexts]; const i = n.findIndex(txt => txt.id === t.id); n[i].text = e.target.value; setFreeTexts(n); }} className="bg-transparent outline-none text-center resize-none w-[600px] custom-scrollbar no-export" style={{ fontFamily: t.fontFamily, fontSize: `${t.fontSize}px`, color: t.color }} />
            ) : (
              <p className="text-center whitespace-pre-wrap select-none" style={{ fontFamily: t.fontFamily, fontSize: `${t.fontSize}px`, color: t.color }}>{t.text}</p>
            )}
          </motion.div>
        ))}

        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-40 pointer-events-none">
          <img src="/logo.png" crossOrigin="anonymous" className="w-24 h-24 object-contain grayscale" />
          <div className="flex flex-col items-start"><span className={`text-5xl font-black tracking-tighter leading-none ${theme.text}`}>TinyWorld</span><span className="text-xs font-bold uppercase tracking-[0.4em] mt-1" style={{ color: `${theme.hex}99` }}>Premium Pregnancy Calendar</span></div>
        </div>
      </div>
    </div>
  ), [editMode, title, titleColor, titleFontSize, selectedObjectId, heroConfig, gridConfig, numberWords, freeTexts, activeTextId, autoScale, userZoom, slots, slotAdjust, labels, boardBg, boardCustomColor, bgOpacity, isTexture]);

  if (variant === 'thumbnail') {
    return (
      <div className="w-[1800px] h-[2400px] flex justify-center items-center overflow-hidden">
        <div 
          style={{ 
            transform: `scale(1)`,
            transformOrigin: 'center center'
          }}
          className="relative shrink-0"
        >
          {memoizedBoard}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full flex-1 flex flex-col overflow-hidden relative ${theme.bg}`} ref={containerRef} onClick={() => { setActiveStickerId(null); setSelectedObjectId(null); setSelectedSlot(null); setActiveTextId(null); }}>
      {!hideHeader && (
        <>
          {isMobile ? (
            <div className="fixed top-0 left-0 right-0 z-[600] bg-white/70 backdrop-blur-xl border-b border-white/50 px-4 py-4 flex items-center justify-between shadow-sm">
              <button 
                onClick={onBack} 
                className={`p-2 bg-white rounded-xl shadow-md ${theme.text} border`}
                style={{ borderColor: `${theme.hex}0d` }}
              >
                <ChevronLeft size={20} />
              </button>
              
              <h1 className={`text-base font-black italic tracking-tighter ${theme.text}`}>Calendario</h1>

              <div className="flex items-center gap-2">
                {!readOnly && editMode && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowThemePicker(true); }} 
                      className={`w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center border ${theme.text}`}
                      style={{ borderColor: `${theme.hex}0d` }}
                    >
                      <Paintbrush size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); addFreeText(); }} 
                      className="w-9 h-9 rounded-full shadow-md flex items-center justify-center"
                      style={{ backgroundColor: `${theme.hex}1a`, color: theme.hex }}
                    >
                      <Type size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSave(); }} 
                      className={`w-9 h-9 ${theme.primaryBg} ${theme.textActive} rounded-full shadow-md flex items-center justify-center`}
                      disabled={loading}
                    >
                      {loading ? "..." : <Check size={16} />}
                    </button>
                  </>
                )}
                {!readOnly && !editMode && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditMode(true); }} 
                      className={`px-3 py-1.5 bg-white ${theme.text} rounded-xl shadow-md flex items-center gap-1 border text-[10px] font-black uppercase tracking-wider transition-all hover:${theme.bgLight} active:scale-95`}
                      style={{ borderColor: `${theme.hex}0d` }}
                    >
                      <Edit3 size={12} style={{ color: theme.hex }} />
                      <span>Editar</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadImage(); }}
                      className={`w-9 h-9 ${theme.primaryBg} ${theme.textActive} rounded-full shadow-md flex items-center justify-center active:scale-90 transition-all`}
                    >
                      <Download size={16} />
                    </button>
                  </>
                )}
                {readOnly && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); downloadImage(); }}
                    className={`w-9 h-9 ${theme.primaryBg} ${theme.textActive} rounded-full shadow-md flex items-center justify-center active:scale-90 transition-all`}
                  >
                    <Download size={16} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={`fixed top-0 left-0 right-0 z-[600] bg-white/95 backdrop-blur-xl border-b shadow-2xl no-export ${theme.borderAccent}`}>
              <div className="max-w-7xl mx-auto px-3 py-2 md:px-6 md:py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={onBack} className="p-2.5 md:p-3 bg-red-600 text-white rounded-xl md:rounded-2xl shadow-lg hover:scale-110 transition-transform"><ChevronLeft size={24} /></button>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowMasterMenu(!showMasterMenu); }} className={`p-2.5 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm ${theme.text} hover:opacity-80 transition-all border`} style={{ borderColor: `${theme.hex}0d` }}><Menu size={24} /></button>
                    <AnimatePresence>
                      {showMasterMenu && (
                        <>
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMasterMenu(false)} className="fixed inset-0 z-[-1]" />
                          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className={`absolute top-16 left-0 w-64 bg-white rounded-[2rem] shadow-2xl border p-3 overflow-hidden ${theme.borderAccent}`}>
                            <div className="flex flex-col gap-1">
                               <button onClick={() => router.push(`/dashboard/child/${childId}`)} className={`w-full p-4 hover:${theme.bgLight} rounded-2xl flex items-center gap-4 ${theme.text} transition-colors group`}><div className={`p-2 ${theme.bgLight} rounded-xl group-hover:${theme.primaryBg} group-hover:${theme.textActive} transition-colors`}><Home size={18}/></div><span className="font-black uppercase tracking-widest text-[10px]">Inicio del Bebé</span></button>
                               <button onClick={() => router.push('/dashboard?view=profile')} className={`w-full p-4 hover:${theme.bgLight} rounded-2xl flex items-center gap-4 ${theme.text} transition-colors group`}><div className={`p-2 ${theme.bgLight} rounded-xl group-hover:${theme.primaryBg} group-hover:${theme.textActive} transition-colors`} style={{ color: theme.hex }}><User size={18}/></div><span className="font-black uppercase tracking-widest text-[10px]">Mi Perfil</span></button>
                               <div className="h-px my-1 mx-4" style={{ backgroundColor: `${theme.hex}1a` }} />
                               <button onClick={handleLogout} className="w-full p-4 hover:bg-red-50 rounded-2xl flex items-center gap-4 text-red-500 transition-colors group"><div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors"><LogOut size={18}/></div><span className="font-black uppercase tracking-widest text-[10px]">Cerrar Sesión</span></button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className={`flex items-center gap-2 ${theme.bgLight} p-1.5 md:p-2 rounded-xl border ${theme.borderAccent}`}>
                     <ZoomIn size={16} className="opacity-40" style={{ color: theme.hex }} />
                     <input type="range" min="0.1" max="3" step="0.1" value={userZoom} onChange={(e) => setUserZoom(parseFloat(e.target.value))} className="w-12 md:w-32 cursor-pointer" style={{ accentColor: theme.hex }} />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-3">
                  {!readOnly && editMode && (
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setShowThemePicker(true); }} className={`p-2 md:p-3 bg-white ${theme.text} rounded-xl shadow-sm border ${theme.borderAccent} flex items-center gap-1.5 hover:${theme.bgLight} transition-colors`}><Paintbrush size={18}/>{ !isMobile && <span className="text-[10px] font-black uppercase">DISEÑO</span>}</button>
                      <button onClick={(e) => { e.stopPropagation(); addFreeText(); }} className="p-2 md:p-3 rounded-xl shadow-sm border flex items-center gap-1.5 transition-colors" style={{ backgroundColor: `${theme.hex}1a`, color: theme.hex, borderColor: `${theme.hex}33` }}><Type size={18}/>{ !isMobile && <span className="text-[10px] font-black uppercase">AÑADIR TEXTO</span>}</button>
                    </div>
                  )}
                  {!readOnly && !editMode ? (
                    <div className="flex gap-1.5 md:gap-3">
                      <button onClick={(e) => { e.stopPropagation(); setEditMode(true); }} className={`flex items-center gap-1.5 px-3 md:px-6 py-2 md:py-3 rounded-xl bg-white ${theme.text} font-black shadow-sm border ${theme.borderAccent} text-[10px] md:text-xs uppercase`}><Settings2 size={18}/>{!isMobile && <span>Editar</span>}</button>
                      <button onClick={(e) => { e.stopPropagation(); downloadImage(); }} className={`flex items-center gap-1.5 px-3 md:px-6 py-2 md:py-3 rounded-xl ${theme.primaryBg} ${theme.textActive} font-black shadow-lg text-[10px] md:text-xs uppercase`}><Download size={18}/>{!isMobile && <span>Exportar</span>}</button>
                    </div>
                  ) : !readOnly && (
                    <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className={`flex items-center gap-2 px-4 md:px-10 py-2 md:py-3 rounded-xl ${theme.primaryBg} ${theme.textActive} font-black shadow-lg text-[10px] md:text-xs uppercase`}><Check size={20}/>{!isMobile && (loading ? '...' : 'GUARDAR')}</button>
                  )}
                  {readOnly && (
                    <button onClick={(e) => { e.stopPropagation(); downloadImage(); }} className={`flex items-center gap-1.5 px-4 md:px-10 py-2 md:py-3 rounded-xl ${theme.primaryBg} ${theme.textActive} font-black shadow-lg text-[10px] md:text-xs uppercase`}><Download size={20}/><span>{isMobile ? 'Bajar' : 'Descargar Imagen'}</span></button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

          <AnimatePresence>
            {editMode && (activeTextId || selectedObjectId) && (
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className={`w-full bg-white border-t ${theme.borderAccent} px-3 py-4 flex flex-col md:flex-row items-center justify-center gap-6 no-export shadow-2xl z-[700]`}>
                 <div className="flex items-center gap-6 w-full md:w-auto overflow-x-auto custom-scrollbar px-4">
                    {(selectedObjectId === 'name' || selectedObjectId === 'title') && (
                      <div className={`flex items-center gap-4 shrink-0 pr-4 border-r ${theme.borderAccent}`}>
                        <span className={`text-[10px] font-black ${theme.text} uppercase tracking-widest italic`}>{selectedObjectId === 'name' ? 'Configurar Nombre' : 'Configurar Título'}</span>
                        {selectedObjectId === 'name' && child?.nickname && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const newUseNickname = !useNickname;
                              setUseNickname(newUseNickname);
                              setBabyName(newUseNickname ? child.nickname : child.name);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${useNickname ? `${theme.primaryBg} ${theme.textActive} shadow-lg` : `${theme.bgLight} ${theme.text} border ${theme.borderAccent}`}`}
                          >
                            <RefreshCw size={14} className={useNickname ? 'animate-spin-slow' : ''} />
                            {useNickname ? 'Usar Nombre Real' : 'Usar Apodo'}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => { 
                        if (activeTextId) {
                          const n = [...freeTexts]; const i = n.findIndex(t => t.id === activeTextId); n[i].fontSize = Math.max(10, n[i].fontSize - 5); setFreeTexts(n);
                        } else if (selectedObjectId === 'name') {
                          setNameFontSize(Math.max(20, nameFontSize - 10));
                        } else if (selectedObjectId === 'title') {
                          setTitleFontSize(Math.max(10, titleFontSize - 5));
                        }
                      }} className={`p-2 ${theme.bgLight} rounded-lg border ${theme.borderAccent} ${theme.text}`}><Minus size={16}/></button>
                      
                      <input type="range" min="10" max="500" step="5" 
                        value={activeTextId ? (freeTexts.find(t => t.id === activeTextId)?.fontSize || 80) : (selectedObjectId === 'name' ? nameFontSize : titleFontSize)} 
                        onChange={(e) => { 
                          const val = parseInt(e.target.value);
                          if (activeTextId) {
                            const n = [...freeTexts]; const i = n.findIndex(t => t.id === activeTextId); n[i].fontSize = val; setFreeTexts(n);
                          } else if (selectedObjectId === 'name') {
                            setNameFontSize(val);
                          } else if (selectedObjectId === 'title') {
                            setTitleFontSize(val);
                          }
                        }} className="w-32 cursor-pointer" style={{ accentColor: theme.hex }} />
                      
                      <button onClick={() => { 
                        if (activeTextId) {
                          const n = [...freeTexts]; const i = n.findIndex(t => t.id === activeTextId); n[i].fontSize = Math.min(500, n[i].fontSize + 5); setFreeTexts(n);
                        } else if (selectedObjectId === 'name') {
                          setNameFontSize(Math.min(500, nameFontSize + 10));
                        } else if (selectedObjectId === 'title') {
                          setTitleFontSize(Math.min(200, titleFontSize + 5));
                        }
                      }} className={`p-2 ${theme.bgLight} rounded-lg border ${theme.borderAccent} ${theme.text}`}><Plus size={16}/></button>
                    </div>

                    <div className={`flex gap-1.5 ${theme.bgLight} p-1.5 rounded-full shrink-0 border ${theme.borderAccent}`}>
                       {colors.map(c => <button key={c} onClick={() => { 
                          if (activeTextId) {
                            const n = [...freeTexts]; const i = n.findIndex(t => t.id === activeTextId); n[i].color = c; setFreeTexts(n);
                          } else if (selectedObjectId === 'name') {
                            setNameColor(c);
                          } else if (selectedObjectId === 'title') {
                            setTitleColor(c);
                          }
                       }} className={`w-6 h-6 rounded-full border-2 ${(activeTextId ? freeTexts.find(t => t.id === activeTextId)?.color : (selectedObjectId === 'name' ? nameColor : titleColor)) === c ? 'scale-125' : 'border-transparent'}`} style={{ backgroundColor: c, borderColor: (activeTextId ? freeTexts.find(t => t.id === activeTextId)?.color : (selectedObjectId === 'name' ? nameColor : titleColor)) === c ? theme.hex : 'transparent' }} />)}
                    </div>

                    {activeTextId && (
                      <>
                        <div className={`flex gap-2 shrink-0 ${theme.bgLight} p-1 rounded-xl`}>
                          {[{ name: 'Manuscrita', val: "'Dancing Script', cursive" }, { name: 'Elegante', val: "'Playfair Display', serif" }, { name: 'Moderna', val: "'Outfit', sans-serif" }, { name: 'Divertida', val: "'Pacifico', cursive" }].map(f => (
                            <button key={f.val} onClick={() => { const n = [...freeTexts]; const i = n.findIndex(t => t.id === activeTextId); n[i].fontFamily = f.val; setFreeTexts(n); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${freeTexts.find(t => t.id === activeTextId)?.fontFamily === f.val ? `${theme.primaryBg} ${theme.textActive} shadow-md` : `bg-white ${theme.text} hover:bg-white/80 border`}`} style={{ fontFamily: f.val, borderColor: freeTexts.find(t => t.id === activeTextId)?.fontFamily === f.val ? 'transparent' : `${theme.hex}1a` }}>{f.name}</button>
                          ))}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); const n = freeTexts.filter(t => t.id !== activeTextId); setFreeTexts(n); setActiveTextId(null); }} className="p-3 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"><Trash2 size={20}/></button>
                        <button onClick={() => { const n = [...freeTexts]; const i = n.findIndex(t => t.id === activeTextId); n[i].rotation = (n[i].rotation || 0) + 45; setFreeTexts(n); }} className="p-3 bg-blue-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform shrink-0"><RotateCw size={20}/></button>
                      </>
                    )}

                    <button onClick={() => { setActiveTextId(null); setSelectedObjectId(null); }} className={`p-2 ${theme.bgLight} rounded-full shadow-sm shrink-0`}><X size={16} className="opacity-40" style={{ color: theme.hex }} /></button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

      <div className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing pt-24 pb-24">
        <motion.div drag dragMomentum={false} className="w-full h-full flex justify-center items-start overflow-visible">
          <div 
            ref={boardRef} 
            style={{ 
              transform: `scale(${autoScale * userZoom})`, 
              transformOrigin: 'top center', 
              width: '2400px',
              backgroundColor: isTexture ? boardCustomColor : (boardBg.startsWith('#') ? boardBg : 'white'),
              backgroundImage: boardBg.startsWith('url') 
                ? `linear-gradient(rgba(255,255,255,${1 - bgOpacity}), rgba(255,255,255,${1 - bgOpacity})), ${isTexture ? `${getProxiedBg(boardBg)}, linear-gradient(${boardCustomColor}, ${boardCustomColor})` : getProxiedBg(boardBg)}`
                : 'none',
              backgroundBlendMode: isTexture ? 'normal, multiply, normal' : 'normal, normal',
              backgroundSize: isTexture ? 'auto, auto, auto' : 'auto, cover',
              backgroundRepeat: isTexture ? 'repeat, repeat, no-repeat' : 'no-repeat, no-repeat',
              backgroundPosition: 'center',
              backgroundOrigin: 'border-box'
            }} 
            className="relative rounded-[8rem] shadow-2xl border-[32px] border-white shrink-0 overflow-hidden transition-all duration-700"
          >
            <div className="relative w-full h-full p-12 md:p-24 flex flex-col items-center">
            <div className="absolute pointer-events-none opacity-30" style={{ top: '80px', left: '80px', right: '80px', bottom: '80px' }}>
              <div className="absolute top-0 left-[100px] right-[100px] h-[6px]" style={{ backgroundImage: `linear-gradient(to right, ${theme.hex} 50%, transparent 50%)`, backgroundSize: '40px 100%' }} />
              <div className="absolute bottom-0 left-[100px] right-[100px] h-[6px]" style={{ backgroundImage: `linear-gradient(to right, ${theme.hex} 50%, transparent 50%)`, backgroundSize: '40px 100%' }} />
              <div className="absolute top-[100px] bottom-[100px] left-0 w-[6px]" style={{ backgroundImage: `linear-gradient(to bottom, ${theme.hex} 50%, transparent 50%)`, backgroundSize: '100% 40px' }} />
              <div className="absolute top-[100px] bottom-[100px] right-0 w-[6px]" style={{ backgroundImage: `linear-gradient(to bottom, ${theme.hex} 50%, transparent 50%)`, backgroundSize: '100% 40px' }} />
              <div className="absolute top-0 left-0 w-[100px] h-[100px] border-t-[6px] border-l-[6px] border-dashed rounded-tl-[4rem]" style={{ borderColor: theme.hex }} />
              <div className="absolute top-0 right-0 w-[100px] h-[100px] border-t-[6px] border-r-[6px] border-dashed rounded-tr-[4rem]" style={{ borderColor: theme.hex }} />
              <div className="absolute bottom-0 left-0 w-[100px] h-[100px] border-b-[6px] border-l-[6px] border-dashed rounded-bl-[4rem]" style={{ borderColor: theme.hex }} />
              <div className="absolute bottom-0 right-0 w-[100px] h-[100px] border-b-[6px] border-r-[6px] border-dashed rounded-br-[4rem]" style={{ borderColor: theme.hex }} />
            </div>
            
            <div className="absolute left-0 right-0 flex justify-center z-[500] pointer-events-none" style={{ top: "130px" }}>
               <div className="text-center flex flex-col items-center w-full max-w-[1500px] mx-auto pointer-events-none">
                  {editMode ? (
                    <div className="flex flex-col items-center no-export w-full pointer-events-auto">
                      <input 
                        value={babyName} 
                        onClick={(e) => { e.stopPropagation(); setSelectedObjectId('name'); setActiveTextId(null); }} 
                        onChange={(e) => setBabyName(e.target.value)} 
                        className={`bg-transparent border-b-4 border-dashed px-2 py-2 text-center outline-none transition-all cursor-pointer inline-block`} 
                        style={{ 
                          color: nameColor, 
                          fontFamily: "'Dancing Script', cursive", 
                          fontSize: `${nameFontSize}px`, 
                          borderColor: selectedObjectId === 'name' ? '#D4AF37' : 'rgba(0,0,0,0.1)',
                          width: `${Math.max(5, babyName.length + 1)}ch` 
                        }} 
                      />
                    </div>
                  ) : (
                    <h1 className="leading-tight mt-4 mb-0 whitespace-nowrap drop-shadow-sm transition-all pointer-events-none" style={{ fontFamily: "'Dancing Script', cursive", color: nameColor, fontSize: `${nameFontSize * 1.8}px` }}>{babyName || "Tu Bebé"}</h1>
                  )}
               </div>
            </div>

            <div className="relative w-full h-[750px] flex flex-col items-center overflow-visible pointer-events-none">
              <div className="w-full flex justify-center mb-6 z-[610] pointer-events-auto">
                 {editMode ? (
                   <input 
                     value={title} 
                     onClick={(e) => { e.stopPropagation(); setSelectedObjectId('title'); setActiveTextId(null); }} 
                     onChange={(e) => setTitle(e.target.value.toUpperCase())} 
                     className={`bg-transparent text-center font-black tracking-[1em] outline-none border-b-4 border-dashed transition-all cursor-pointer`} 
                     style={{ 
                       color: titleColor, 
                       fontSize: `${titleFontSize}px`, 
                       borderColor: selectedObjectId === 'title' ? '#D4AF37' : 'rgba(0,0,0,0.1)',
                       width: `${Math.max(10, title.length + 1)}ch` 
                     }} 
                   />
                 ) : (
                   <h3 className={`font-outfit font-black tracking-[0.9em] uppercase transition-all`} style={{ color: titleColor, fontSize: `${titleFontSize}px` }}>{title}</h3>
                 )}
              </div>
              
              <div className="relative w-full flex items-center justify-between overflow-visible mt-6 px-16">
                 <div className="z-[10] relative"><PhotoFrame id="hero" label="Mi primer día" isHero={true} /></div>
                 <div className="z-[10] relative overflow-visible translate-y-0 pointer-events-auto">
                    <div className="relative flex items-center justify-center group overflow-visible" style={{ width: `${heroConfig.size}px` }}>
                       <img src={getProxiedUrl(heroConfig.src)} style={{ width: '100%', height: 'auto', transform: `rotate(${heroConfig.rotation}deg)` }} className="object-contain" />
                       {editMode && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-6 no-export bg-white p-8 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] border-2 z-[600] min-h-[400px] justify-center items-center" style={{ borderColor: `${theme.hex}33` }}>
                             <div className="flex flex-col items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setShowHeroPicker(true); }} className={`p-8 ${theme.primaryBg} ${theme.textActive} rounded-full shadow-xl hover:scale-110 transition-transform`}><Wand2 size={42}/></button>
                                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.hex }}>Cambiar</span>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); setHeroConfig({...heroConfig, size: heroConfig.size + 150}); }} className={`p-6 bg-white ${theme.text} rounded-full border-2 shadow-xl hover:opacity-90`} style={{ borderColor: `${theme.hex}33` }}><Plus size={36}/></button>
                             <button onClick={(e) => { e.stopPropagation(); setHeroConfig({...heroConfig, size: Math.max(100, heroConfig.size - 150)}); }} className={`p-6 bg-white ${theme.text} rounded-full border-2 shadow-xl hover:opacity-90`} style={{ borderColor: `${theme.hex}33` }}><Minus size={36}/></button>
                             <button onClick={(e) => { e.stopPropagation(); setHeroConfig({...heroConfig, rotation: (heroConfig.rotation || 0) + 45}); }} className="p-6 bg-blue-600 text-white rounded-full shadow-xl hover:rotate-90 transition-transform"><RotateCw size={36}/></button>
                          </div>
                        )}
                    </div>
                 </div>
              </div>
            </div>

            <div className="w-full flex flex-col items-center overflow-visible mt-4 mb-48 px-12 md:px-20">
              <div className="grid gap-x-12 md:gap-x-16 gap-y-24 transition-all duration-500 w-full" style={{ gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`, width: '100%' }}>
                {Array.from({ length: gridConfig.rows * gridConfig.cols }).map((_, i) => (<PhotoFrame key={i} id={`slot-${i}`} label={numberWords[i] || (i+1).toString()} />))}
              </div>
            </div>

            {freeTexts.map(t => (
              <motion.div
                key={t.id}
                drag={editMode && activeTextId === t.id}
                dragMomentum={false}
                onDrag={(e, info) => {
                  const n = [...freeTexts]; const i = n.findIndex(txt => txt.id === t.id); n[i].x += info.delta.x / (autoScale * userZoom); n[i].y += info.delta.y / (autoScale * userZoom); setFreeTexts(n);
                }}
                initial={false}
                style={{ 
                  position: 'absolute', 
                  left: t.x, 
                  top: t.y, 
                  x: '-50%', 
                  y: '-50%', 
                  zIndex: activeTextId === t.id ? 650 : 600, 
                  rotate: t.rotation || 0, 
                  cursor: editMode ? 'grab' : 'default',
                  boxShadow: activeTextId === t.id ? `0 0 0 4px ${theme.hex}66` : 'none'
                }}
                onClick={(e) => { e.stopPropagation(); if (editMode) { setActiveTextId(t.id); setSelectedObjectId(null); setActiveStickerId(null); } }}
                className={`flex flex-col items-center group ${activeTextId === t.id ? 'rounded-3xl p-6 bg-white/10' : ''}`}
              >
                {editMode && activeTextId === t.id ? (
                  <textarea value={t.text} onChange={(e) => { const n = [...freeTexts]; const i = n.findIndex(txt => txt.id === t.id); n[i].text = e.target.value; setFreeTexts(n); }} className="bg-transparent outline-none text-center resize-none w-[600px] custom-scrollbar no-export" style={{ fontFamily: t.fontFamily, fontSize: `${t.fontSize}px`, color: t.color }} />
                ) : (
                  <p className="text-center whitespace-pre-wrap select-none" style={{ fontFamily: t.fontFamily, fontSize: `${t.fontSize}px`, color: t.color }}>{t.text}</p>
                )}
              </motion.div>
            ))}

            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-40 pointer-events-none">
              <img src="/logo.png" className="w-24 h-24 object-contain grayscale" />
              <div className="flex flex-col items-start"><span className={`text-5xl font-black ${theme.text} tracking-tighter leading-none`}>TinyWorld</span><span className={`text-xs font-bold ${theme.text}/60 uppercase tracking-[0.4em] mt-1`}>Premium Pregnancy Calendar</span></div>
            </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showThemePicker && (
          <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 md:p-10 bg-black/40 backdrop-blur-md no-export">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`${theme.bg} w-full max-w-2xl rounded-[3.5rem] p-8 md:p-12 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border-[6px] border-white/50`}>
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h3 className={`text-2xl md:text-3xl font-black ${theme.text} uppercase tracking-tighter flex items-center gap-3`}><Paintbrush style={{ color: theme.hex }}/> Panel de Diseño</h3>
                <button onClick={() => setShowThemePicker(false)} className="p-4 bg-white/50 rounded-full hover:bg-white transition-colors shadow-sm"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 py-4">
                 <div className="bg-white/40 rounded-3xl border border-white/60 overflow-hidden">
                    <button onClick={() => setActiveSettingsTab(activeSettingsTab === 'grid' ? null : 'grid')} className={`w-full p-6 flex justify-between items-center font-black ${theme.text} uppercase text-xs tracking-widest hover:bg-white/40 transition-colors`}><span className="flex items-center gap-3"><Columns size={18} style={{ color: theme.hex }}/> Estructura (Filas/Cols)</span><ChevronDown size={20} className={`transition-transform duration-300 ${activeSettingsTab === 'grid' ? 'rotate-180' : ''}`} /></button>
                    <AnimatePresence>{activeSettingsTab === 'grid' && (<motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><div className="p-8 pt-0 grid grid-cols-2 gap-8 border-t border-white/40 mt-4 pt-6"><div className="space-y-4"><span className={`text-[10px] font-black ${theme.text}/60 uppercase`}>Columnas: {gridConfig.cols}</span><div className="flex items-center gap-4"><button onClick={() => setGridConfig({...gridConfig, cols: Math.max(1, gridConfig.cols - 1)})} className={`p-3 bg-white rounded-xl shadow-sm border ${theme.borderAccent} ${theme.text}`}><Minus size={16}/></button><button onClick={() => setGridConfig({...gridConfig, cols: Math.min(6, gridConfig.cols + 1)})} className={`p-3 bg-white rounded-xl shadow-sm border ${theme.borderAccent} ${theme.text}`}><Plus size={16}/></button></div></div><div className="space-y-4"><span className={`text-[10px] font-black ${theme.text}/60 uppercase`}>Filas: {gridConfig.rows}</span><div className="flex items-center gap-4"><button onClick={() => setGridConfig({...gridConfig, rows: Math.max(1, gridConfig.rows - 1)})} className={`p-3 bg-white rounded-xl shadow-sm border ${theme.borderAccent} ${theme.text}`}><Minus size={16}/></button><button onClick={() => setGridConfig({...gridConfig, rows: Math.min(6, gridConfig.rows + 1)})} className={`p-3 bg-white rounded-xl shadow-sm border ${theme.borderAccent} ${theme.text}`}><Plus size={16}/></button></div></div></div></motion.div>)}</AnimatePresence>
                 </div>
                 <div className="bg-white/40 rounded-3xl border border-white/60 overflow-hidden">
                    <button onClick={() => setActiveSettingsTab(activeSettingsTab === 'scale' ? null : 'scale')} className={`w-full p-6 flex justify-between items-center font-black ${theme.text} uppercase text-xs tracking-widest hover:bg-white/40 transition-colors`}><span className="flex items-center gap-3"><Maximize2 size={18} style={{ color: theme.hex }}/> Agrandar Marcos</span><ChevronDown size={20} className={`transition-transform duration-300 ${activeSettingsTab === 'scale' ? 'rotate-180' : ''}`} /></button>
                    <AnimatePresence>{activeSettingsTab === 'scale' && (<motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><div className="p-8 pt-0 border-t border-white/40 mt-4 pt-6"><span className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 block text-center" style={{ color: theme.hex }}>Tamaño Global ({Math.round(frameScale * 100)}%)</span><div className="flex items-center gap-4"><Minus size={16} className={`${theme.text} opacity-40`} /><input type="range" min="0.5" max="1.5" step="0.05" value={frameScale} onChange={e => setFrameScale(parseFloat(e.target.value))} className={`w-full h-4 ${theme.bgLight} rounded-full cursor-pointer`} style={{ accentColor: theme.hex }} /><Plus size={16} className={`${theme.text} opacity-40`} /></div></div></motion.div>)}</AnimatePresence>
                 </div>
                 <div className="bg-white/40 rounded-3xl border border-white/60 overflow-hidden">
                    <button onClick={() => setActiveSettingsTab(activeSettingsTab === 'look' ? null : 'look')} className={`w-full p-6 flex justify-between items-center font-black ${theme.text} uppercase text-xs tracking-widest hover:bg-white/40 transition-colors`}><span className="flex items-center gap-3"><Palette size={18} style={{ color: theme.hex }}/> Estilo y Texturas</span><ChevronDown size={20} className={`transition-transform duration-300 ${activeSettingsTab === 'look' ? 'rotate-180' : ''}`} /></button>
                    <AnimatePresence>{activeSettingsTab === 'look' && (<motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><div className="p-8 pt-0 space-y-8 border-t border-white/40 mt-4 pt-6"><div className="space-y-4"><span className={`text-[10px] font-black ${theme.text}/60 uppercase`}>Marcos de Fotos</span><div className="grid grid-cols-3 gap-2">{frameStyles.map(style => (<button key={style.id} onClick={() => setActiveFrameStyle(style.id)} className={`py-3 rounded-xl font-black text-[8px] uppercase transition-all ${activeFrameStyle === style.id ? `${theme.primaryBg} ${theme.textActive}` : `bg-white ${theme.text} border ${theme.borderAccent}`}`}>{style.name}</button>))}</div></div>{isTexture && (<div className="space-y-4"><span className={`text-[10px] font-black ${theme.text}/60 uppercase`}>Color de Textura</span><div className="flex flex-wrap gap-2">{colors.map(c => <button key={c} onClick={() => setBoardCustomColor(c)} className={`w-8 h-8 rounded-full border-2 ${boardCustomColor === c ? 'scale-110' : 'border-transparent'}`} style={{ backgroundColor: c, borderColor: boardCustomColor === c ? theme.hex : 'transparent' }} />)}<input type="color" value={boardCustomColor} onChange={e => setBoardCustomColor(e.target.value)} className="w-8 h-8 rounded-full border-2 border-white cursor-pointer bg-transparent" /></div></div>)}<div className="space-y-4"><div className="flex items-center justify-between"><span className={`text-[10px] font-black ${theme.text}/60 uppercase`}>Fondo del Tablero</span><div className="flex bg-white/60 p-1 rounded-full text-[8px] font-black uppercase"><button onClick={() => setAssetTab('global')} className={`px-4 py-1.5 rounded-full transition-all ${assetTab === 'global' ? `${theme.primaryBg} ${theme.textActive} shadow-md` : theme.text}`}>Tienda</button><button onClick={() => setAssetTab('mine')} className={`px-4 py-1.5 rounded-full transition-all ${assetTab === 'mine' ? `${theme.primaryBg} ${theme.textActive} shadow-md` : theme.text}`}>Míos</button><label className={`px-4 py-1.5 rounded-full ${theme.text} hover:opacity-80 cursor-pointer flex items-center gap-1 border-l ${theme.borderAccent} ml-1`}><Upload size={10}/><input type="file" className="hidden" onChange={(e) => handleUserAssetUpload(e, 'background')} /></label></div></div><div className="grid grid-cols-5 gap-2">{assetTab === 'global' ? (<>{bgOptions.map(opt => (<button key={opt.id} onClick={() => setBoardBg(opt.value)} className="aspect-square rounded-xl border-2 transition-all" style={{ backgroundColor: opt.type === 'color' ? opt.value : '#fff', backgroundImage: opt.type === 'texture' ? opt.value : 'none', backgroundSize: 'cover', borderColor: boardBg === opt.value ? theme.hex : '#ffffff' }} />))}{dbBackgrounds.filter(b => !b.user_id).map(bg => (<button key={bg.id} onClick={() => setBoardBg(`url("${bg.url}")`)} className="aspect-square rounded-xl border-2 transition-all overflow-hidden" style={{ borderColor: boardBg === `url("${bg.url}")` ? theme.hex : '#ffffff' }}><img src={getProxiedUrl(bg.url)} className="w-full h-full object-cover" /></button>))}</>) : (dbBackgrounds.filter(b => b.user_id).map(bg => (<button key={bg.id} onClick={() => setBoardBg(`url("${bg.url}")`)} className="aspect-square rounded-xl border-2 transition-all overflow-hidden" style={{ borderColor: boardBg === `url("${bg.url}")` ? theme.hex : '#ffffff' }}><img src={getProxiedUrl(bg.url)} className="w-full h-full object-cover" /></button>)))}</div><div className="space-y-4 pt-4 border-t border-white/40"><div className="flex justify-between items-center"><span className={`text-[10px] font-black ${theme.text}/60 uppercase`}>Intensidad del Fondo</span><span className="text-[10px] font-black uppercase" style={{ color: theme.hex }}>{Math.round(bgOpacity * 100)}%</span></div><div className="flex items-center gap-4"><EyeOff size={16} className={`${theme.text} opacity-40`} /><input type="range" min="0" max="1" step="0.05" value={bgOpacity} onChange={e => setBgOpacity(parseFloat(e.target.value))} className={`w-full h-4 ${theme.bgLight} rounded-full cursor-pointer`} style={{ accentColor: theme.hex }} /><Eye size={16} className={`${theme.text} opacity-40`} /></div></div></div></div></motion.div>)}</AnimatePresence>
                 </div>
                 <div className="bg-white/40 rounded-3xl border border-white/60 overflow-hidden">
                    <button onClick={() => setActiveSettingsTab(activeSettingsTab === 'rots' ? null : 'rots')} className={`w-full p-6 flex justify-between items-center font-black ${theme.text} uppercase text-xs tracking-widest hover:bg-white/40 transition-colors`}><span className="flex items-center gap-3"><RotateCw size={18} style={{ color: theme.hex }}/> Rotaciones Orgánicas</span><ChevronDown size={20} className={`transition-transform duration-300 ${activeSettingsTab === 'rots' ? 'rotate-180' : ''}`} /></button>
                    <AnimatePresence>{activeSettingsTab === 'rots' && (<motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><div className="p-8 pt-0 border-t border-white/40 mt-4 pt-6"><div className="grid grid-cols-2 gap-4"><button onClick={resetRotations} className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase transition-all shadow-sm ${Object.keys(slotRotations).length === 0 ? `${theme.primaryBg} ${theme.textActive}` : `bg-white ${theme.text} border-2 ${theme.borderAccent}`}`}>Normal</button><button onClick={shuffleRotations} className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase transition-all shadow-sm ${Object.keys(slotRotations).length > 0 ? `${theme.primaryBg} ${theme.textActive}` : `bg-white ${theme.text} border-2 ${theme.borderAccent}`}`}>Aleatorio</button></div>{Object.keys(slotRotations).length > 0 && (<button onClick={shuffleRotations} className="w-full mt-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2" style={{ backgroundColor: `${theme.hex}1a`, color: theme.hex }}><RefreshCw size={14}/> Cambiar Pose</button>)}</div></motion.div>)}</AnimatePresence>
                 </div>
              </div>
              <div className="mt-8 shrink-0"><button onClick={() => setShowThemePicker(false)} className={`w-full py-5 ${theme.primaryBg} ${theme.textActive} font-black rounded-[2rem] text-lg uppercase tracking-widest hover:opacity-90 transition-colors shadow-xl`}>Cerrar Diseño</button></div>
            </motion.div>
          </div>
        )}
        {(showStickerPicker || showHeroPicker) && (
          <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md no-export">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[3rem] p-6 md:p-8 shadow-2xl relative border-[6px] border-white/30">
              <button onClick={() => { setShowStickerPicker(false); setShowHeroPicker(false); }} className="absolute -top-4 -right-4 p-3 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform z-[810]"><X size={20}/></button>
              <div className="flex justify-between items-center mb-6 px-2"><h3 className={`text-xl md:text-2xl font-black ${theme.text} uppercase tracking-tighter`}>Colección</h3><div className={`flex ${theme.bgLight} p-1 rounded-full text-[8px] font-black uppercase shadow-inner overflow-x-auto no-scrollbar max-w-[220px]`}><button onClick={() => setAssetTab('global')} className={`px-4 py-1.5 rounded-full transition-all whitespace-nowrap ${assetTab === 'global' ? `${theme.primaryBg} ${theme.textActive} shadow-md` : theme.text}`}>Stickers</button><button onClick={() => setAssetTab('tape')} className={`px-4 py-1.5 rounded-full transition-all whitespace-nowrap ${assetTab === 'tape' ? `${theme.primaryBg} ${theme.textActive} shadow-md` : theme.text}`}>Cintas</button><label className={`px-4 py-1.5 rounded-full ${theme.text} hover:opacity-85 cursor-pointer flex items-center gap-1 border-l ${theme.borderAccent} ml-1`}><Upload size={10}/><input type="file" className="hidden" onChange={(e) => handleUserAssetUpload(e, assetTab === 'tape' ? 'tape' : 'sticker')} /></label></div></div>
              <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">{(assetTab === 'global' ? dbStickers : dbTapes).map(s => (<button key={s.id} onClick={(e) => { e.stopPropagation(); showHeroPicker ? (setHeroConfig({...heroConfig, src: s.url}), setShowHeroPicker(false)) : addStickerToAnchor(s.url); }} className={`p-2 rounded-2xl transition-all flex items-center justify-center aspect-square group ${theme.bgLight} relative`} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.hex}1a`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}><img src={getProxiedUrl(s.url)} className="w-full h-full object-contain group-hover:scale-125 transition-transform" />{s.user_id && <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: theme.hex }} title="Mi asset" />}</button>))}</div>
              <div className="mt-8"><button onClick={() => { setShowStickerPicker(false); setShowHeroPicker(false); }} className={`w-full py-4 ${theme.primaryBg} ${theme.textActive} font-black rounded-[2rem] text-sm uppercase tracking-widest hover:opacity-90 transition-colors shadow-lg`}>Listo</button></div>
            </motion.div>
          </div>
        )}
        {showPhotoPicker && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-10 backdrop-blur-2xl no-export" style={{ backgroundColor: `${theme.hex}f2` }}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white w-full max-w-6xl rounded-[3rem] md:rounded-[4rem] p-6 md:p-16 h-[85vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-8 shrink-0"><h3 className={`text-2xl md:text-5xl font-black ${theme.text} uppercase tracking-tighter`}>Galería</h3><button onClick={() => setShowPhotoPicker(false)} className={`p-4 ${theme.bgLight} rounded-full`}><X size={isMobile ? 24 : 32} /></button></div>
              <div className="flex gap-2 overflow-x-auto pb-6 mb-4 custom-scrollbar shrink-0 px-2"><button onClick={() => setFilterMonth('all')} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 ${filterMonth === 'all' ? `${theme.primaryBg} ${theme.textActive} shadow-md` : `${theme.bgLight} ${theme.text}`}`}>Todos</button>{[...Array(12)].map((_, i) => (<button key={i+1} onClick={() => setFilterMonth(i+1)} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 ${filterMonth === i+1 ? `${theme.primaryBg} ${theme.textActive} shadow-md` : `${theme.bgLight} ${theme.text}`}`}>Mes {i+1}</button>))}</div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2"><div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10">{filteredMemories.map(m => (m.media_urls || []).map((url:string, idx:number) => (<button key={`${m.id}-${idx}`} onClick={() => { setSlots({...slots, [selectedSlot!]: url}); setShowPhotoPicker(false); }} className="aspect-square rounded-2xl md:rounded-[3rem] overflow-hidden border-4 md:border-8 shadow-xl transition-all relative group" style={{ borderColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.hex} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}><img src={getProxiedUrl(url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /><div className="absolute top-2 left-2 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full text-[8px] font-black text-white uppercase">Mes {m.month_number}</div></button>)))}</div></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Outfit:wght@400;900&display=swap');
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme.hex}30; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
