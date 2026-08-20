"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Image as ImageIcon, 
  Video, Mic, FolderPlus, Folder, 
  Grid, Calendar, Trash2, Download, 
  X, Check, MoreVertical, 
  ArrowLeft, CheckCircle2, Circle, AlertCircle,
  Camera, Wand2, MousePointer2, LogOut,
  Book, BookOpen, Layers, Filter, ChevronDown, Sparkles, ChevronLeft, ChevronRight,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import MediaEditor from "@/components/Common/MediaEditor";

interface GalleryItem {
  id: string; // memoryId-url
  url: string;
  type: 'image' | 'video' | 'audio';
  date: string;
  month: number;
  memoryId: string;
}

interface CustomFolder {
  id: string;
  name: string;
  itemsCount: number;
}

interface FolderItemMapping {
  folder_id: string;
  memory_id: string;
  media_url: string;
}

interface PregnancyGalleryProps {
  childId: string;
  sectionId?: string | null;
  child: any;
  theme: any;
  onBack: () => void;
  
  view: 'folders' | 'months' | 'items';
  setView: (v: 'folders' | 'months' | 'items') => void;
  currentFolder: {id: string, name: string, filterMonth?: number, isCustom?: boolean} | null;
  setCurrentFolder: (f: {id: string, name: string, filterMonth?: number, isCustom?: boolean} | null) => void;
  isDeleteMode: boolean;
  setIsDeleteMode: (d: boolean) => void;
  isMultiSelectMode: boolean;
  setIsMultiSelectMode: (m: boolean) => void;
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  
  triggerAdd: boolean;
  setTriggerAdd: (t: boolean) => void;
  triggerDelete: boolean;
  setTriggerDelete: (t: boolean) => void;
  triggerNewFolder: boolean;
  setTriggerNewFolder: (t: boolean) => void;
  triggerUpload: boolean;
  setTriggerUpload: (t: boolean) => void;
}

export default function PregnancyGallery({ 
  childId, 
  sectionId = null,
  child, 
  theme, 
  onBack,
  view,
  setView,
  currentFolder,
  setCurrentFolder,
  isDeleteMode,
  setIsDeleteMode,
  isMultiSelectMode,
  setIsMultiSelectMode,
  selectedItems,
  setSelectedItems,
  triggerAdd,
  setTriggerAdd,
  triggerDelete,
  setTriggerDelete,
  triggerNewFolder,
  setTriggerNewFolder,
  triggerUpload,
  setTriggerUpload
}: PregnancyGalleryProps) {
  const [loading, setLoading] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState<'image' | 'video' | 'audio'>('image');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [folders, setFolders] = useState<CustomFolder[]>([]);
  const [activeFolderMappings, setActiveFolderMappings] = useState<FolderItemMapping[] | null>(null);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderWizard, setShowFolderWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardMonthFilter, setWizardMonthFilter] = useState<number | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [showDownloadChoice, setShowDownloadChoice] = useState(false);
  
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);

  const getProxiedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('.r2.dev') || url.includes('.r2.cloudflarestorage.com') || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL && url.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_URL))) {
      return `/api/download?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    loadGalleryData();
    return () => window.removeEventListener('resize', checkMobile);
  }, [childId]);

  useEffect(() => {
    if (currentFolder?.isCustom) {
      fetchFolderContent(currentFolder.id);
    } else {
      setActiveFolderMappings(null);
    }
    setActiveMediaTab('image');
  }, [currentFolder]);

  // Escuchadores de triggers desde la cabecera principal de escritorio
  useEffect(() => {
    if (triggerAdd && currentFolder) {
      setEditingFolderId(currentFolder.id);
      setNewFolderName(currentFolder.name);
      fetchFolderContent(currentFolder.id).then(() => {
        setWizardStep(2);
        setSelectedItems([]);
        setShowFolderWizard(true);
      });
      setTriggerAdd(false);
    }
  }, [triggerAdd, currentFolder]);

  useEffect(() => {
    if (triggerDelete) {
      setShowDeleteConfirm(true);
      setTriggerDelete(false);
    }
  }, [triggerDelete]);

  useEffect(() => {
    if (triggerNewFolder) {
      setShowFolderWizard(true);
      setWizardStep(1);
      setSelectedItems([]);
      setTriggerNewFolder(false);
    }
  }, [triggerNewFolder]);

  useEffect(() => {
    if (triggerUpload) {
      setShowUploadModal(true);
      setTriggerUpload(false);
    }
  }, [triggerUpload]);

  async function loadGalleryData() {
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
      
      const { data: memories } = await memoriesQuery.order('memory_date', { ascending: false });

      const allItems: GalleryItem[] = [];
      memories?.forEach(mem => {
        if (mem.media_urls) {
          const dateObj = new Date(mem.memory_date);
          const realMonth = dateObj.getMonth() + 1;
          mem.media_urls.forEach((url: string) => {
            let detectedType: 'image' | 'video' | 'audio' = 'image';
            if (url.match(/\.(mp4|webm|mov)/i)) detectedType = 'video';
            else if (url.match(/\.(mp3|wav|ogg|m4a)/i)) detectedType = 'audio';
            
            allItems.push({ 
              id: `${mem.id}-${url}`, 
              url, 
              type: detectedType, 
              date: mem.memory_date, 
              month: realMonth, 
              memoryId: mem.id 
            });
          });
        }
      });
      setItems(allItems);

      const foldersQuery = supabase
        .from("pregnancy_folders")
        .select(`id, name, pregnancy_folder_items (count)`)
        .eq("child_id", childId);
        
      if (sectionId) {
        foldersQuery.eq("section_id", sectionId);
      } else {
        foldersQuery.is("section_id", null);
      }
      
      const { data: customFolders } = await foldersQuery;

      if (customFolders) {
        setFolders(customFolders.map((f: any) => ({ id: f.id, name: f.name, itemsCount: f.pregnancy_folder_items?.[0]?.count || 0 })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFolderContent(folderId: string) {
    const { data } = await supabase.from("pregnancy_folder_items").select("memory_id, media_url").eq("folder_id", folderId);
    if (data) setActiveFolderMappings(data as FolderItemMapping[]);
    else setActiveFolderMappings([]);
  }

  const handleDelete = async (onlyFromFolder: boolean = false) => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      if (folderToDelete) {
        await supabase.from("pregnancy_folder_items").delete().eq("folder_id", folderToDelete);
        await supabase.from("pregnancy_folders").delete().eq("id", folderToDelete);
        setFolderToDelete(null);
      } else {
        const itemsToHandle = isMultiSelectMode ? items.filter(it => selectedItems.includes(it.id)) : items.filter(it => it.id === selectedItems[0]);
        for (const item of itemsToHandle) {
          if (onlyFromFolder && currentFolder?.isCustom) {
            await supabase.from("pregnancy_folder_items").delete().eq("folder_id", currentFolder.id).eq("memory_id", item.memoryId).eq("media_url", item.url);
          } else {
            const { data: currentMemory } = await supabase.from("pregnancy_memories").select("media_urls").eq("id", item.memoryId).single();
            if (currentMemory) {
              const newUrls = currentMemory.media_urls.filter((u: string) => u !== item.url);
              if (newUrls.length === 0) {
                // Si no quedan más archivos, borramos el recuerdo completo
                await supabase.from("pregnancy_memories").delete().eq("id", item.memoryId);
              } else {
                // Si aún quedan archivos, solo actualizamos la lista
                await supabase.from("pregnancy_memories").update({ media_urls: newUrls }).eq("id", item.memoryId);
              }
            }
          }
        }
      }
      setSelectedItems([]); setIsDeleteMode(false); setIsMultiSelectMode(false); 
      await loadGalleryData();
      if (currentFolder?.isCustom) fetchFolderContent(currentFolder.id);
      
      // Notificar al Hub para que refresque la lista de recuerdos si es necesario
      if ((window as any).refreshPregnancyMemories) {
        (window as any).refreshPregnancyMemories();
      }
    } catch (err) { alert("Error"); } finally { setLoading(false); }
  };

  const createFolderWithItems = async () => {
    if (!newFolderName && !editingFolderId) return;
    setIsUploading(true);
    try {
      let folderId = editingFolderId;

      if (!folderId) {
        const folderData: any = { child_id: childId, name: newFolderName };
        if (sectionId) {
          folderData.section_id = sectionId;
        }
        const { data: folder, error: fErr } = await supabase.from("pregnancy_folders").insert(folderData).select().single();
        if (fErr) throw fErr;
        folderId = folder.id;
      }

      if (folderId && selectedItems.length > 0) {
        const selectedObjects = items.filter(i => selectedItems.includes(i.id));
        const itemsToInsert = selectedObjects.map(obj => ({ folder_id: folderId, memory_id: obj.memoryId, media_url: obj.url }));
        await supabase.from("pregnancy_folder_items").insert(itemsToInsert);
      }

      setShowFolderWizard(false); setNewFolderName(""); setSelectedItems([]); setWizardStep(1); setEditingFolderId(null);
      await loadGalleryData();
      if (currentFolder?.isCustom) fetchFolderContent(currentFolder.id);
    } catch (err) { alert("Error al guardar cambios"); } finally { setIsUploading(false); }
  };

  const downloadFile = async (url: string, withFrame: boolean) => {
    setShowDownloadChoice(false);
    try {
      const urlWithoutQuery = url.split("?")[0];
      const match = urlWithoutQuery.match(/\.([a-zA-Z0-9]+)$/);
      const isVideo = previewItem?.type === 'video' || (match && ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(match[1].toLowerCase()));
      const isAudio = previewItem?.type === 'audio' || (match && ['mp3', 'wav', 'm4a', 'ogg'].includes(match[1].toLowerCase()));
      const ext = match ? match[1].toLowerCase() : (isVideo ? 'mp4' : isAudio ? 'mp3' : 'png');

      if (!withFrame || isVideo || isAudio) {
        const filename = `TinyWorld_${isVideo ? 'Video' : isAudio ? 'Audio' : 'Foto'}_${Date.now()}.${ext}`;
        const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = `/api/download?url=${encodeURIComponent(url)}`;
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      canvas.width = 1080;
      canvas.height = 1350;

      const bgColor = theme.bg.includes('pink') ? '#FFF5F7' : theme.bg.includes('blue') ? '#F0F9FF' : '#F9F8F6';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.shadowColor = 'rgba(0,0,0,0.14)';
      ctx.shadowBlur = 50;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 25;

      const pW = 800;
      const pH = 1000;
      const pX = (canvas.width - pW) / 2;
      const pY = 120;
      ctx.fillStyle = '#FFFFFF';
      
      const radius = 20;
      ctx.beginPath();
      ctx.moveTo(pX + radius, pY);
      ctx.lineTo(pX + pW - radius, pY);
      ctx.quadraticCurveTo(pX + pW, pY, pX + pW, pY + radius);
      ctx.lineTo(pX + pW, pY + pH - radius);
      ctx.quadraticCurveTo(pX + pW, pY + pH, pX + pW - radius, pY + pH);
      ctx.lineTo(pX + radius, pY + pH);
      ctx.quadraticCurveTo(pX, pY + pH, pX, pY + pH - radius);
      ctx.lineTo(pX, pY + radius);
      ctx.quadraticCurveTo(pX, pY, pX + radius, pY);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      const margin = 50;
      const photoW = pW - (margin * 2);
      const photoH = photoW; 
      const photoX = pX + margin;
      const photoY = pY + margin;

      const scale = Math.max(photoW / img.width, photoH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = photoX + (photoW - drawW) / 2;
      const drawY = photoY + (photoH - drawH) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(photoX, photoY, photoW, photoH);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.src = "/logo.png";
      
      await new Promise((resolve) => {
        logo.onload = resolve;
        logo.onerror = resolve;
      });

      ctx.fillStyle = '#C2B6B0'; 
      ctx.textAlign = 'center';
      
      const text = 'TINYWORLD';
      ctx.font = 'bold 24px Montserrat, sans-serif';
      ctx.letterSpacing = '10px';
      const textWidth = ctx.measureText(text).width;
      
      const logoAspect = logo.width / logo.height;
      const logoW = 80; 
      const logoH = logoW / logoAspect;
      
      const totalWidth = textWidth + logoW + 30;
      const startX = (canvas.width - totalWidth) / 2;
      const centerY = pY + pH - 110;

      ctx.drawImage(logo, startX, centerY - (logoH/2), logoW, logoH);
      ctx.textAlign = 'left';
      ctx.fillText(text, startX + logoW + 30, centerY + 8);
      
      ctx.textAlign = 'center';
      ctx.font = 'italic 18px Montserrat, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.globalAlpha = 0.5;
      if (previewItem) {
        ctx.fillText(new Date(previewItem.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(), canvas.width / 2, pY + pH - 60);
      }
      ctx.globalAlpha = 1.0;

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `TinyWorld_Polaroid_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Error en descarga:", err);
      alert("Hubo un problema al generar la descarga.");
    }
  };

  const getFilteredItems = () => {
    if (currentFolder?.id === 'all') return items;
    if (currentFolder?.filterMonth) return items.filter(it => it.month === currentFolder.filterMonth);
    if (currentFolder?.isCustom) {
      if (!activeFolderMappings) return [];
      return items.filter(it => activeFolderMappings.some(m => m.memory_id === it.memoryId && m.media_url === it.url));
    }
    return [];
  };

  const filteredItems = getFilteredItems();
  const photosCount = filteredItems.filter(it => it.type === 'image').length;
  const videosCount = filteredItems.filter(it => it.type === 'video').length;
  const audiosCount = filteredItems.filter(it => it.type === 'audio').length;
  const displayedItems = filteredItems.filter(it => it.type === activeMediaTab);

  const showNextPreview = () => {
    if (!previewItem) return;
    const idx = displayedItems.findIndex((item) => item.id === previewItem.id);
    if (idx !== -1 && idx < displayedItems.length - 1) {
      setPreviewItem(displayedItems[idx + 1]);
    }
  };

  const showPrevPreview = () => {
    if (!previewItem) return;
    const idx = displayedItems.findIndex((item) => item.id === previewItem.id);
    if (idx > 0) {
      setPreviewItem(displayedItems[idx - 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPreviewModal || !previewItem) return;
      if (e.key === "ArrowRight") {
        showNextPreview();
      } else if (e.key === "ArrowLeft") {
        showPrevPreview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreviewModal, previewItem, displayedItems]);

  const monthsWithContent = Array.from(new Set(items.map(it => it.month))).sort((a, b) => a - b);

  async function handleFileUpload(e: any) {
    const files = Array.from(e.target.files || []) as File[]; 
    if (files.length === 0) return;
    
    // Si hay un video, abrimos el editor primero (tomamos el primero si hay varios)
    const videoFile = files.find(f => f.type.startsWith('video'));
    if (videoFile) {
      setFileToEdit(videoFile);
      return;
    }

    // Si solo son fotos, subida normal
    await processAndUpload(files);
  }

  async function processAndUpload(files: File[], forcedType?: 'video' | 'audio') {
    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      for (const file of files) {
        const formData = new FormData();
        const detectedType = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
        const mediaType = forcedType || detectedType;
        
        formData.append("childId", childId);
        formData.append("module", "pregnancy");
        formData.append("section", "gallery");
        formData.append("mediaType", mediaType);
        formData.append("files", file);

        const response = await fetch("/api/media", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al subir");
        }

        const payload = await response.json();
        const url = payload.uploaded?.[0]?.url;

        if (url) {
          const insertMemory: any = { 
            child_id: childId, 
            title: mediaType === 'video' ? "Video de Galería" : mediaType === 'audio' ? "Audio de Galería" : "Foto de Galería", 
            description: "Subido desde la galería",
            memory_date: uploadDate, 
            media_urls: [url], 
            media_type: mediaType,
            month_number: new Date(uploadDate).getMonth() + 1
          };
          if (sectionId) {
            insertMemory.section_id = sectionId;
          }
          await supabase.from("pregnancy_memories").insert(insertMemory);
        }
      }

      setShowUploadModal(false); 
      setFileToEdit(null);
      await loadGalleryData();
    } catch (err: any) { 
      alert("Error al subir: " + err.message); 
    } finally { 
      setIsUploading(false); 
    }
  }

  function toggleItemSelection(id: string) { if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter(i => i !== id)); else setSelectedItems([...selectedItems, id]); }

  function FolderCard({ icon, title, count, color, onClick }: any) {
    // Si es personalizado, usamos el color dinámico del tema
    const folderColorClass = color === 'taupe' 
      ? `${theme.bgLight} ${theme.text}`
      : color === 'sage' 
        ? 'bg-emerald-500/10 text-emerald-500' 
        : `${theme.bgLight} ${theme.text}`; // Todo
    
    return (
      <motion.button 
        whileHover={{ y: -5 }} 
        onClick={onClick} 
        className={`bg-white/60 hover:bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border ${theme.borderAccent} flex flex-row md:flex-col items-center gap-3 md:gap-6 group w-full text-left md:text-center relative overflow-hidden backdrop-blur-sm`}
      >
        <div className={`w-12 h-12 md:w-20 md:h-20 shrink-0 rounded-full ${folderColorClass} flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner relative z-10`}>{icon}</div>
        <div className="relative z-10">
          <h2 className={`text-sm md:text-xl font-black ${theme.text} leading-tight tracking-tighter truncate w-full`}>{title}</h2>
          <p className={`${theme.text} opacity-40 text-[8px] md:text-xs font-bold uppercase tracking-widest mt-0.5 md:mt-2`}>{count} Archivos</p>
        </div>
        <div className={`absolute top-0 right-0 w-24 h-24 ${theme.bgLight} rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000 opacity-20`} />
      </motion.button>
    );
  }

  return (
    <div className={`flex-1 transition-colors duration-500 flex flex-col pb-32 relative`}>
      {/* CABECERA MÓVIL UNIFICADA (Estilo Baúl) */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-[150] bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between shadow-sm">
          <button 
            onClick={() => {
              setIsDeleteMode(false);
              setIsMultiSelectMode(false);
              setSelectedItems([]);
              if (view === 'folders') onBack();
              else if (view === 'months') setView('folders');
              else setView(currentFolder?.filterMonth ? 'months' : 'folders');
            }} 
            className={`p-2 bg-white rounded-xl shadow-md ${theme.text} border ${theme.borderAccent}`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <h1 className={`text-lg font-black ${theme.text} tracking-tighter italic truncate max-w-[150px]`}>
            {view === 'folders' ? 'Galería' : view === 'months' ? 'Meses' : currentFolder?.name}
          </h1>

          {view === 'items' ? (
            <div className="flex items-center gap-2">
              {currentFolder?.isCustom && !isDeleteMode && (
                <button 
                  onClick={() => { 
                    setEditingFolderId(currentFolder.id); 
                    setNewFolderName(currentFolder.name); 
                    fetchFolderContent(currentFolder.id).then(() => { 
                      setWizardStep(2); 
                      setSelectedItems([]); 
                      setShowFolderWizard(true); 
                    }); 
                  }} 
                  className={`p-2 ${theme.bgLight} ${theme.text} rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all border ${theme.borderAccent}`}
                >
                  <Plus size={18} />
                </button>
              )}
              
              {!isDeleteMode ? (
                <button 
                  onClick={() => setIsDeleteMode(true)} 
                  className="p-2 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => { setIsMultiSelectMode(!isMultiSelectMode); setSelectedItems([]); }} 
                    className={`p-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center transition-all ${isMultiSelectMode ? `${theme.primaryBg} ${theme.textActive} shadow-md` : `bg-white ${theme.text} border ${theme.borderAccent} shadow-sm`}`}
                  >
                    {isMultiSelectMode ? <X size={16} /> : <CheckCircle2 size={16} />}
                  </button>
                  
                  {isMultiSelectMode && selectedItems.length > 0 && (
                    <button 
                      onClick={() => setShowDeleteConfirm(true)} 
                      className="p-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 shadow-md shadow-red-500/20"
                    >
                      <Trash2 size={16} />
                      <span className="text-[9px] font-black">({selectedItems.length})</span>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => { setIsDeleteMode(false); setIsMultiSelectMode(false); setSelectedItems([]); }} 
                    className={`px-3 py-1.5 ${theme.primaryBg} ${theme.textActive} rounded-xl text-[10px] font-black uppercase shadow-md`}
                  >
                    Listo
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setShowAddMenu(!showAddMenu)}
                className={`w-10 h-10 ${theme.primaryBg} ${theme.textActive} rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all`}
              >
                <motion.div animate={{ rotate: showAddMenu ? 45 : 0 }}>
                  <Plus size={22} />
                </motion.div>
              </button>
              <AnimatePresence>
                {showAddMenu && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className={`absolute right-0 mt-3 w-48 bg-white rounded-[1.5rem] shadow-2xl border ${theme.borderAccent} p-2 z-[200]`}>
                    <button onClick={() => { setShowAddMenu(false); setShowUploadModal(true); }} className={`w-full flex items-center gap-3 p-3 hover:${theme.bgLight} rounded-xl transition-all text-left`}><div className={`w-8 h-8 ${theme.bgLight} ${theme.text} rounded-full flex items-center justify-center`}><ImageIcon size={16} /></div><span className={`text-xs font-black ${theme.text} uppercase tracking-widest`}>Subir Foto</span></button>
                    <button onClick={() => { setShowAddMenu(false); setShowFolderWizard(true); }} className={`w-full flex items-center gap-3 p-3 hover:${theme.bgLight} rounded-xl transition-all text-left`}><div className={`w-8 h-8 ${theme.bgLight} ${theme.text} rounded-full flex items-center justify-center`}><FolderPlus size={16} /></div><span className={`text-xs font-black ${theme.text} uppercase tracking-widest`}>Nueva Carpeta</span></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}



      <main className={`flex-1 ${isMobile ? 'mt-24 p-4' : 'p-0 md:pt-0'}`}>
        <AnimatePresence mode="wait">
          {view === 'folders' ? (
            <motion.div key="folders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`space-y-6 md:space-y-8 ${isMobile ? '' : 'px-8 md:px-12 py-6'}`}>
              {!isMobile && (
                <div className="flex justify-between items-center gap-3">
                  <div className="w-full flex items-center gap-3">
                    <h2 className={`text-xl md:text-3xl font-black ${theme.text} flex items-center gap-2 md:gap-3 tracking-tighter`}><ImageIcon className="shrink-0" size={24} /> Galería</h2>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
                <FolderCard icon={<Grid size={isMobile ? 20 : 28} />} title="Todo" count={items.length} color="gold" onClick={() => { setView('items'); setCurrentFolder({id: 'all', name: 'Todo', isCustom: false}); }} />
                <FolderCard icon={<BookOpen size={isMobile ? 20 : 28} />} title="Por Mes" count={monthsWithContent.length} color="sage" onClick={() => setView('months')} />
                {folders.map(f => (
                  <div key={f.id} className="relative group">
                    <FolderCard icon={<Folder size={isMobile ? 20 : 28} />} title={f.name} count={f.itemsCount} color="taupe" onClick={() => { setView('items'); setCurrentFolder({id: f.id, name: f.name, isCustom: true}); }} />
                    <div className={`absolute top-2 right-2 md:top-4 md:right-4 flex gap-1.5 transition-all ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button onClick={(e) => { e.stopPropagation(); setFolderToDelete(f.id); setShowDeleteConfirm(true); }} className="p-2 bg-red-50 text-red-500 rounded-xl shadow-sm hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : view === 'months' ? (
            <motion.div key="months" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={`space-y-6 ${isMobile ? '' : 'px-8 md:px-12 py-6'}`}>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {monthsWithContent.map(m => {
                  const firstItem = items.find(it => it.month === m); const monthName = monthNames[m - 1];
                  return (
                    <motion.button key={m} whileHover={{ y: -5 }} onClick={() => { setView('items'); setCurrentFolder({id: `month-${m}`, name: monthName, filterMonth: m, isCustom: false}); }} className={`group bg-white/60 hover:bg-white p-3 md:p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border ${theme.borderAccent} flex flex-col gap-4`}>
                      <div className={`w-full aspect-square rounded-2xl ${theme.bg} overflow-hidden shadow-inner flex items-center justify-center`}>
                        {firstItem ? <img src={getProxiedUrl(firstItem.url)} crossOrigin="anonymous" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <BookOpen className={theme.text} size={32} />}
                      </div>
                      <div className="text-left px-1">
                        <h4 className={`text-sm md:text-xl font-black ${theme.text} leading-tight`}>{monthName}</h4>
                        <p className={`text-[10px] md:text-xs ${theme.text} opacity-40 font-bold uppercase tracking-widest mt-1`}>{items.filter(it => it.month === m).length} Fotos</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="items" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={`space-y-6 ${isMobile ? '' : 'px-8 md:px-12 py-6'}`}>

              {/* Pestañas de tipo de media flotantes premium */}
              <div className="flex items-center gap-1.5 bg-white/40 p-1.5 rounded-2xl border border-white/40 shadow-inner w-fit mx-auto md:mx-0 backdrop-blur-md">
                <button 
                  onClick={() => setActiveMediaTab('image')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeMediaTab === 'image' ? `${theme.primaryBg} ${theme.textActive} shadow-lg scale-105` : `bg-transparent ${theme.text} opacity-40 hover:bg-white/20 hover:opacity-100`}`}
                >
                  <ImageIcon size={14} /> Fotos ({photosCount})
                </button>
                <button 
                  onClick={() => setActiveMediaTab('video')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeMediaTab === 'video' ? `${theme.primaryBg} ${theme.textActive} shadow-lg scale-105` : `bg-transparent ${theme.text} opacity-40 hover:bg-white/20 hover:opacity-100`}`}
                >
                  <Video size={14} /> Videos ({videosCount})
                </button>
                <button 
                  onClick={() => setActiveMediaTab('audio')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeMediaTab === 'audio' ? `${theme.primaryBg} ${theme.textActive} shadow-lg scale-105` : `bg-transparent ${theme.text} opacity-40 hover:bg-white/20 hover:opacity-100`}`}
                >
                  <Mic size={14} /> Audios ({audiosCount})
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 pb-24">
                {displayedItems.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => isMultiSelectMode ? toggleItemSelection(item.id) : !isDeleteMode && (setPreviewItem(item), setShowPreviewModal(true))} 
                    className={`group relative bg-white/80 p-2 md:p-3 rounded-[2rem] shadow-sm hover:shadow-xl border border-white transition-all cursor-pointer`}
                    style={isMultiSelectMode && selectedItems.includes(item.id) ? { outline: `4px solid ${theme.hex}` } : {}}
                  >
                    <div className={`aspect-square ${theme.bgLight} overflow-hidden rounded-[1.5rem] relative flex items-center justify-center`}>
                      {item.type === 'image' ? (
                        <img src={getProxiedUrl(item.url)} crossOrigin="anonymous" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : item.type === 'video' ? (
                        <div className="w-full h-full relative">
                          <video src={getProxiedUrl(item.url)} crossOrigin="anonymous" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white"><Video size={32} /></div>
                        </div>
                      ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center ${theme.bgLight} ${theme.text} gap-2`}>
                          <Mic size={32} />
                          <span className="text-[8px] font-black uppercase">Audio</span>
                        </div>
                      )}
                      
                      <AnimatePresence>{isDeleteMode && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">{isMultiSelectMode ? (<div className="w-10 h-10 rounded-full border-4 flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: selectedItems.includes(item.id) ? theme.hex : 'rgba(255,255,255,0.8)', borderColor: selectedItems.includes(item.id) ? theme.hex : '#ffffff' }}><Check size={20} strokeWidth={5} /></div>) : (<button onClick={(e) => { e.stopPropagation(); setSelectedItems([item.id]); setShowDeleteConfirm(true); }} className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><Trash2 size={24} /></button>)}</motion.div>)}</AnimatePresence>
                    </div>
                    {!currentFolder?.isCustom && (
                      <div className="py-2 px-1 text-center"><p className={`text-[9px] md:text-[11px] font-black ${theme.text} opacity-25 uppercase tracking-widest`}>{new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p></div>
                    )}
                  </div>
                ))}
                {displayedItems.length === 0 && (
                  <div className={`col-span-full py-20 text-center ${theme.text} opacity-20 font-black uppercase tracking-[0.2em] italic`}>
                    No hay {activeMediaTab === 'image' ? 'fotos' : activeMediaTab === 'video' ? 'videos' : 'audios'} en este álbum
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showFolderWizard && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className={`bg-white rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 w-full max-w-4xl shadow-2xl relative flex flex-col border border-white ${wizardStep === 1 ? 'max-h-[60vh] md:max-h-[80vh]' : 'max-h-[90vh]'}`}
            >
              <button onClick={() => { setShowFolderWizard(false); setEditingFolderId(null); }} className={`absolute top-6 right-6 p-2 ${theme.text} opacity-20 hover:text-red-500 transition-colors z-[10]`}><X size={isMobile ? 24 : 32} /></button>
              
              {wizardStep === 1 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-8 md:py-16 text-center">
                  <div className={`w-16 h-16 md:w-24 md:h-24 ${theme.bgLight} ${theme.text} rounded-full flex items-center justify-center mb-6`}><FolderPlus size={isMobile ? 32 : 48} /></div>
                  <h3 className={`text-xl md:text-3xl font-black ${theme.text} tracking-tighter italic mb-8`}>Nombra tu nuevo álbum</h3>
                  <input 
                    autoFocus 
                    placeholder="Ej: Mi Baby Shower" 
                    value={newFolderName} 
                    onChange={(e) => setNewFolderName(e.target.value)} 
                    className={`w-full p-4 md:p-6 ${theme.bgLight} rounded-2xl md:rounded-[2rem] outline-none text-lg md:text-2xl font-black text-center border-2 border-transparent focus:border-current transition-all placeholder:opacity-20 mb-8 ${theme.text}`} 
                  />
                  <button onClick={() => newFolderName && setWizardStep(2)} disabled={!newFolderName} className={`px-10 py-4 md:px-12 md:py-5 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-2xl md:rounded-[2rem] font-black text-xs md:text-lg shadow-xl disabled:opacity-20 hover:scale-105 transition-transform tracking-widest uppercase`}>Siguiente</button>
                </div>
              ) : (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="mb-4 md:mb-8 text-center md:text-left pr-8">
                    <h3 className={`text-lg md:text-2xl font-black ${theme.text} tracking-tighter`}>Selecciona las fotos</h3>
                    <p className={`text-[8px] md:text-[10px] font-black ${theme.text} opacity-30 uppercase tracking-widest mt-0.5`}>Álbum: {newFolderName}</p>
                  </div>

                  <div className="mb-4 flex items-center justify-center md:justify-start">
                    <div className={`flex items-center gap-2 ${theme.bgLight} p-1.5 rounded-xl border ${theme.borderAccent}`}>
                      <Filter size={14} className={`${theme.text} opacity-30 ml-1`} />
                      <select value={wizardMonthFilter || ""} onChange={(e) => setWizardMonthFilter(e.target.value ? Number(e.target.value) : null)} className={`bg-transparent text-[9px] md:text-[10px] font-black ${theme.text} uppercase outline-none cursor-pointer pr-2`}>
                        <option value="">Todos los meses</option>
                        {monthsWithContent.map(m => (<option key={m} value={m}>{monthNames[m-1]}</option>))}
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 pr-1 mb-4 custom-scrollbar">
                    {items.filter(it => !wizardMonthFilter || it.month === wizardMonthFilter).map((item) => {
                      const isAlreadyInFolder = activeFolderMappings?.some(m => m.memory_id === item.memoryId && m.media_url === item.url);
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => !isAlreadyInFolder && toggleItemSelection(item.id)} 
                          className={`relative aspect-square rounded-xl md:rounded-2xl overflow-hidden cursor-pointer transition-all 
                            ${isAlreadyInFolder ? 'opacity-30 grayscale cursor-not-allowed scale-90' : 'hover:opacity-100'}
                          `}
                          style={selectedItems.includes(item.id) ? { outline: `4px solid ${theme.hex}`, transform: 'scale(0.95)' } : {}}
                        >
                          <img src={getProxiedUrl(item.url)} className="w-full h-full object-cover" />
                          {selectedItems.includes(item.id) && <div className="absolute inset-0 flex items-center justify-center shadow-inner" style={{ backgroundColor: `${theme.hex}33` }}><CheckCircle2 className="text-white drop-shadow-md" size={isMobile ? 32 : 40} /></div>}
                          {isAlreadyInFolder && <div className="absolute inset-0 flex items-center justify-center"><div className={`p-2 bg-white/80 rounded-full ${theme.text} shadow-sm`}><Check size={20} /></div></div>}
                        </div>
                      );
                    })}
                  </div>

                  <div className={`pt-4 border-t ${theme.borderAccent} flex flex-row items-center justify-between gap-2`}>
                    <div className="flex flex-col">
                      <span className={`text-[8px] md:text-xs font-black ${theme.text} opacity-30 uppercase tracking-widest leading-none`}>{selectedItems.length} Nuevas</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { if(editingFolderId) setShowFolderWizard(false); else setWizardStep(1); }} className={`px-4 py-3 md:px-8 md:py-4 ${theme.text} opacity-40 font-black text-[9px] md:text-xs uppercase tracking-widest`}>Atrás</button>
                      <button onClick={createFolderWithItems} disabled={selectedItems.length === 0} className={`px-4 py-3 md:px-10 md:py-4 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-xl md:rounded-[1.5rem] font-black text-[9px] md:text-xs shadow-lg disabled:opacity-20 uppercase tracking-widest hover:scale-105 transition-transform whitespace-nowrap`}>Finalizar</button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`bg-white rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-2xl text-center border border-white/20`}>
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <AlertCircle size={32} />
              </div>
              <h3 className={`text-xl font-black ${theme.text} mb-2 tracking-tighter italic`}>{folderToDelete ? '¿Borrar este álbum?' : '¿Cómo deseas borrar?'}</h3>
              <p className={`${theme.text} opacity-50 text-[10px] md:text-xs mb-8`}>{folderToDelete ? "Se eliminará la carpeta del álbum. Las fotos seguirán guardadas en el sistema principal." : currentFolder?.isCustom ? "Puedes quitar la foto de este álbum o eliminarla de todo el sistema." : "Esto quitará la foto de la galería. El texto del recuerdo permanecerá intacto."}</p>
              <div className="flex flex-col gap-2.5">
                {folderToDelete ? (
                  <button onClick={() => handleDelete(true)} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs shadow-lg uppercase tracking-widest hover:bg-red-600 transition-colors">Confirmar Borrado</button>
                ) : (
                  <>
                    {currentFolder?.isCustom && (
                      <button onClick={() => handleDelete(true)} className={`w-full py-4 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest transition-all`}>
                        <Layers size={14}/> Solo quitar de este álbum
                      </button>
                    )}
                    <button onClick={() => handleDelete(false)} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-red-600 transition-all">
                      <Trash2 size={14}/> Borrar del sistema
                    </button>
                  </>
                )}
                <button onClick={() => { setShowDeleteConfirm(false); setSelectedItems([]); setFolderToDelete(null); }} className={`w-full py-4 ${theme.text} opacity-30 font-black text-xs uppercase tracking-widest`}>Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreviewModal && previewItem && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 md:p-4 bg-black/95 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
              className={`${theme.bg} p-4 md:p-6 rounded-[2.5rem] shadow-2xl max-w-full md:max-w-lg w-full relative flex flex-col items-center border border-white/20`}
            >
              <button 
                onClick={() => setShowPreviewModal(false)} 
                className="absolute top-4 right-4 text-gray-700 bg-white/80 hover:bg-white transition-all p-2 rounded-full shadow-md z-[2100] cursor-pointer hover:scale-110"
              >
                <X size={20} />
              </button>
              
              <div className="w-full aspect-square bg-white/40 overflow-hidden rounded-[2rem] mb-6 flex items-center justify-center shadow-inner group relative border border-white/30">
                {previewItem.type === 'image' ? (
                  <img src={getProxiedUrl(previewItem.url)} crossOrigin="anonymous" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : previewItem.type === 'video' ? (
                  <video src={getProxiedUrl(previewItem.url)} crossOrigin="anonymous" controls className="w-full h-full object-contain bg-black rounded-[1.5rem]" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-6">
                    <div className={`w-24 h-24 ${theme.bgLight} ${theme.text} rounded-full flex items-center justify-center shadow-inner animate-pulse`}>
                      <Mic size={48} />
                    </div>
                    <audio src={getProxiedUrl(previewItem.url)} crossOrigin="anonymous" controls className="w-full" />
                  </div>
                )}

                {/* Visual Chevrons */}
                {(() => {
                  const idx = displayedItems.findIndex(item => item.id === previewItem.id);
                  return (
                    <>
                      {idx > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); showPrevPreview(); }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-all z-40 cursor-pointer shadow-md"
                          title="Anterior"
                        >
                          <ChevronLeft size={20} />
                        </button>
                      )}
                      {idx !== -1 && idx < displayedItems.length - 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); showNextPreview(); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-all z-40 cursor-pointer shadow-md"
                          title="Siguiente"
                        >
                          <ChevronRight size={20} />
                        </button>
                      )}
                    </>
                  );
                })()}
                
                <div className="absolute bottom-4 right-4 z-30">
                  {!showDownloadChoice ? (
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowDownloadChoice(true)} 
                      className="w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 transition-all cursor-pointer backdrop-blur-sm"
                    >
                      <Download size={22} />
                    </motion.button>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      className="flex flex-col gap-2 p-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white"
                    >
                      <div className="flex gap-2">
                        {previewItem.type === 'image' && (
                          <button 
                            onClick={() => downloadFile(previewItem.url, true)} 
                            className={`px-4 py-2.5 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-2`}
                          >
                            Polaroid
                          </button>
                        )}
                        <button 
                          onClick={() => downloadFile(previewItem.url, false)} 
                          className={`px-4 py-2.5 bg-white ${theme.text} border ${theme.borderAccent} rounded-xl text-[9px] font-black uppercase tracking-widest hover:${theme.bgLight}`}
                        >
                          {previewItem.type === 'image' ? 'Normal' : 'Descargar'}
                        </button>
                      </div>
                      <button onClick={() => setShowDownloadChoice(false)} className={`py-1 text-[8px] font-black ${theme.text} opacity-40 uppercase tracking-widest`}>
                        Cerrar
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className={`absolute top-4 right-4 p-2 bg-white/40 backdrop-blur-md rounded-full ${theme.text}`}><Sparkles size={16} /></div>
              </div>

              <div className="flex flex-col items-center gap-1 opacity-40 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-outfit font-black ${theme.text} tracking-[0.3em] uppercase text-[10px]`}>TinyWorld</span>
                </div>
                <p className={`text-[9px] font-black ${theme.text} uppercase tracking-widest`}>{new Date(previewItem.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`bg-white rounded-[3rem] p-8 md:p-10 max-w-md w-full shadow-2xl relative border border-white/20`}>
              <button onClick={() => setShowUploadModal(false)} className={`absolute top-8 right-8 p-2 ${theme.text} opacity-20 hover:text-red-500 transition-colors`}><X size={24} /></button>
              <h3 className={`text-xl font-black ${theme.text} uppercase tracking-tighter mb-8 italic`}>Subir a la Galería</h3>
              <div className="space-y-6">
                <div>
                  <label className={`text-[10px] font-black ${theme.text} opacity-30 uppercase tracking-[0.2em] mb-2 block ml-1`}>Fecha del Recuerdo</label>
                  <input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} className={`w-full p-4 ${theme.bgLight} rounded-2xl font-black ${theme.text} text-sm border-2 border-transparent focus:border-current outline-none transition-all`} />
                </div>
                <label className={`w-full h-40 md:h-52 border-4 border-dashed ${theme.borderAccent} rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:${theme.bgLight} transition-all cursor-pointer group shadow-inner`}>
                  <div className={`p-4 ${theme.bgLight} ${theme.text} rounded-full group-hover:scale-110 transition-transform shadow-sm`}>
                    {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                  </div>
                  <span className={`text-[10px] font-black ${theme.text} opacity-40 uppercase tracking-[0.2em]`}>Seleccionar Archivos</span>
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} accept="image/*,video/*,audio/*" />
                </label>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {fileToEdit && (
          <MediaEditor 
            file={fileToEdit} 
            onClose={() => setFileToEdit(null)} 
            onComplete={(processedFile, type) => {
              processAndUpload([processedFile], type);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
