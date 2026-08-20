"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Loader2, ChevronLeft, ChevronRight, CheckCircle2, Baby, 
  QrCode, Copy, Share2, Eye, X, BookOpen, Heart, 
  CalendarDays, Images, Sparkles, Settings, Menu,
  MapPin, User, Users, Calendar, ArrowLeft, ArrowRight, Clock, ChevronDown,
  Mic, Music, Download, Folder, FolderHeart, Play, Video, Bookmark,
  Ruler, Scale, Home, ZoomIn, ZoomOut
} from "lucide-react";
import { themePalettes } from "@/lib/themes";
import dynamic from "next/dynamic";

const getProxiedUrl = (u: string | null | undefined) => {
  if (!u) return '';
  if (u.includes('.r2.dev') || u.includes('.r2.cloudflarestorage.com') || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL && u.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_URL))) {
    return `/api/download?url=${encodeURIComponent(u)}`;
  }
  return u;
};

const BabyAvatar = dynamic(() => import("../Dashboard/Child/BabyAvatar"), { ssr: false });
const PregnancyCalendar = dynamic(() => import("../Dashboard/Child/Pregnancy/PregnancyCalendar"), {
  loading: () => (
    <div className="fixed inset-0 z-[2000] bg-[#FFFDF8] flex items-center justify-center">
      <Loader2 className="animate-spin opacity-20" size={48} />
    </div>
  ),
  ssr: false,
});
const PregnancyDigitalAlbum = dynamic(() => import("../Dashboard/Child/Pregnancy/PregnancyDigitalAlbum"), {
  loading: () => (
    <div className="fixed inset-0 z-[2000] bg-[#FFFDF8] flex items-center justify-center">
      <Loader2 className="animate-spin opacity-20" size={48} />
    </div>
  ),
  ssr: false,
});

import BabyPhotoCollage from "./BabyPhotoCollage";
import HowIsBabyCard from "./HowIsBabyCard";

interface PreviewDashboardProps {
  childId: string;
  initialChild: any;
  onClose: () => void;
}

export default function PreviewDashboard({ childId, initialChild, onClose }: PreviewDashboardProps) {
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [child, setChild] = useState<any>(initialChild);
  const [activeTab, setActiveTab] = useState<"inicio" | "galeria" | "calendarios" | "album" | "configuracion">("inicio");
  const [isParent, setIsParent] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // Data States
  const [generalMemories, setGeneralMemories] = useState<any[]>([]);
  const [pregnancyMemories, setPregnancyMemories] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [albumPages, setAlbumPages] = useState<any[]>([]);
  const [allAlbumPages, setAllAlbumPages] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [stages, setStages] = useState<any[]>([]);
  const [activeStage, setActiveStage] = useState<{ id: string | null; title: string }>({ id: null, title: "Embarazo" });
  const [selectedPreviewBook, setSelectedPreviewBook] = useState<{ id: string | null; title: string } | null>(null);

  // UI States
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [folderItems, setFolderItems] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [allPregnancyMemories, setAllPregnancyMemories] = useState<any[]>([]);
  const [galleryView, setGalleryView] = useState<'folders' | 'months' | 'items'>('folders');
  const [galleryFolder, setGalleryFolder] = useState<{ id: string; name: string; filterMonthKey?: string; isCustom?: boolean } | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<'image' | 'video' | 'audio'>('image');
  const [previewMediaItem, setPreviewMediaItem] = useState<any | null>(null);
  const [zoom, setZoom] = useState(1);
  const toggleZoom = () => {
    setZoom(prev => prev === 1 ? 2.5 : 1);
  };
  useEffect(() => {
    setZoom(1);
  }, [previewMediaItem]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPreviewMemory, setSelectedPreviewMemory] = useState<any | null>(null);

  // Form State (Mirror of Baby Profile)
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    birth_date: "",
    birth_time: "",
    weight: "",
    height: "",
    gender: "",
    father_name: "",
    mother_name: "",
    birth_hospital: "",
    theme_color: "neutral",
    access_code: "",
    preview_config: {
      show_pregnancy: true,
      show_gallery: true,
      show_calendars: true,
      show_album: true,
      status: "pregnancy",
      fum: ""
    }
  });

  const getFolderMedia = (folderId: string) => {
    return folderItems
      .filter(item => item.folder_id === folderId)
      .map(item => item.media_url)
      .filter(Boolean);
  };

  const calculateGestation = (fumStr: string) => {
    if (!fumStr) return null;
    const fum = new Date(fumStr + "T12:00:00");
    const now = new Date();
    const diffTime = now.getTime() - fum.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { weeks: 0, days: 0, fpp: new Date(fum.getTime() + 280 * 24 * 60 * 60 * 1000) };
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    const fpp = new Date(fum.getTime() + 280 * 24 * 60 * 60 * 1000);
    return { weeks, days, fpp };
  };

  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr + "T12:00:00");
    const now = new Date();
    const diffTime = now.getTime() - birth.getTime();
    if (diffTime < 0) return "¡Por nacer!";
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      const parts = [];
      parts.push(years === 1 ? "1 año" : `${years} años`);
      if (months > 0) parts.push(months === 1 ? "1 mes" : `${months} meses`);
      return parts.join(" y ");
    }
    
    if (months > 0) {
      const parts = [];
      parts.push(months === 1 ? "1 mes" : `${months} meses`);
      const weeks = Math.floor(days / 7);
      const remDays = days % 7;
      if (weeks > 0) parts.push(weeks === 1 ? "1 semana" : `${weeks} semanas`);
      if (weeks === 0 && remDays > 0) parts.push(remDays === 1 ? "1 día" : `${remDays} días`);
      return parts.join(" y ");
    }
    
    const weeks = Math.floor(diffDays / 7);
    const remDays = diffDays % 7;
    const parts = [];
    if (weeks > 0) parts.push(weeks === 1 ? "1 semana" : `${weeks} semanas`);
    if (remDays > 0) parts.push(remDays === 1 ? "1 día" : `${remDays} días`);
    if (parts.length === 0) return "Recién nacido";
    return parts.join(" y ");
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setActiveImageIndex(index);
  };

  const downloadMedia = async (url: string, title: string) => {
    try {
      const urlWithoutQuery = url.split("?")[0];
      const match = urlWithoutQuery.match(/\.([a-zA-Z0-9]+)$/);
      const isVideo = previewMediaItem?.type === 'video' || (match && ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(match[1].toLowerCase()));
      const isAudio = previewMediaItem?.type === 'audio' || (match && ['mp3', 'wav', 'm4a', 'ogg'].includes(match[1].toLowerCase()));
      const ext = match ? match[1].toLowerCase() : (isVideo ? 'mp4' : isAudio ? 'mp3' : 'jpeg');

      const cleanTitle = (title || (isVideo ? 'Video' : isAudio ? 'Audio' : 'Foto')).replace(/[\r\n\s]+/g, '_');
      const filename = `TinyWorld-${cleanTitle}-${new Date().getTime()}.${ext}`;
      const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, '_blank');
    }
  };

  const showNextPreviewItem = () => {
    if (!previewMediaItem) return;
    const items = getGlobalMediaItems().filter(it => it.type === activeMediaTab);
    const idx = items.findIndex(it => it.id === previewMediaItem.id);
    if (idx !== -1 && idx < items.length - 1) {
      setPreviewMediaItem(items[idx + 1]);
    }
  };

  const showPrevPreviewItem = () => {
    if (!previewMediaItem) return;
    const items = getGlobalMediaItems().filter(it => it.type === activeMediaTab);
    const idx = items.findIndex(it => it.id === previewMediaItem.id);
    if (idx > 0) {
      setPreviewMediaItem(items[idx - 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewMediaItem) return;
      if (e.key === "ArrowRight") {
        showNextPreviewItem();
      } else if (e.key === "ArrowLeft") {
        showPrevPreviewItem();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewMediaItem, activeMediaTab, folders, folderItems, generalMemories, allPregnancyMemories]);

  const getGlobalMediaItems = () => {
    const allMedia: any[] = [];
    
    // System folders configuration
    const isAllEnabled = child.preview_config?.folders?.['all'] !== false;
    const isByDateEnabled = child.preview_config?.folders?.['by_date'] !== false;
    const isGlobalGalleryEnabled = isAllEnabled || isByDateEnabled;

    // Get active custom folder IDs
    const activeCustomFolderIds = folders
      .filter(f => child.preview_config?.folders?.[f.id] !== false)
      .map(f => f.id);

    const allowedUrls = new Set<string>();
    const allowedMemoryIds = new Set<string>();

    folderItems.forEach(item => {
      if (activeCustomFolderIds.includes(item.folder_id)) {
        if (item.media_url) {
          allowedUrls.add(item.media_url);
          allowedUrls.add(getProxiedUrl(item.media_url));
        }
        if (item.memory_id) {
          allowedMemoryIds.add(item.memory_id);
        }
      }
    });

    allPregnancyMemories.forEach(mem => {
      if (mem.media_urls) {
        mem.media_urls.forEach((url: string) => {
          if (url && url.trim() !== "") {
            // For visitors, allow if global gallery is enabled OR if associated with an active custom folder
            if (!isParent && !isGlobalGalleryEnabled) {
              const isAllowed = allowedUrls.has(url) || allowedUrls.has(getProxiedUrl(url)) || (mem.id && allowedMemoryIds.has(mem.id));
              if (!isAllowed) return;
            }

            let realType = mem.media_type || 'image';
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.m4a') || lowerUrl.endsWith('.ogg') || lowerUrl.includes('/audio/') || lowerUrl.includes('audio')) {
              realType = 'audio';
            } else if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.avi') || lowerUrl.includes('/video/') || lowerUrl.includes('video')) {
              realType = 'video';
            }

            allMedia.push({
              id: `${mem.id}-${url}`,
              url,
              type: realType,
              date: mem.memory_date,
              title: mem.title || "Recuerdo de Embarazo",
              source: "pregnancy",
              memoryId: mem.id
            });
          }
        });
      }
    });

    generalMemories.forEach(mem => {
      if (mem.media_urls) {
        mem.media_urls.forEach((url: string) => {
          if (url && url.trim() !== "") {
            // For visitors, allow if global gallery is enabled OR if associated with an active custom folder
            if (!isParent && !isGlobalGalleryEnabled) {
              const isAllowed = allowedUrls.has(url) || allowedUrls.has(getProxiedUrl(url)) || (mem.id && allowedMemoryIds.has(mem.id));
              if (!isAllowed) return;
            }

            let realType = mem.media_type || 'image';
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.m4a') || lowerUrl.endsWith('.ogg') || lowerUrl.includes('/audio/') || lowerUrl.includes('audio')) {
              realType = 'audio';
            } else if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.avi') || lowerUrl.includes('/video/') || lowerUrl.includes('video')) {
              realType = 'video';
            }

            allMedia.push({
              id: `${mem.id}-${url}`,
              url,
              type: realType,
              date: mem.memory_date,
              title: mem.title || "Recuerdo del Bebé",
              source: "general",
              memoryId: mem.id
            });
          }
        });
      }
    });

    // Ordenar por fecha descendente
    allMedia.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return allMedia;
  };

  const getMonthKey = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Unknown";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthLabel = (monthKey: string) => {
    if (monthKey === "Unknown") return "Fecha Desconocida";
    const [year, month] = monthKey.split("-");
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getMonthCover = (monthKey: string, globalItems: any[]) => {
    const monthItems = globalItems.filter(it => getMonthKey(it.date) === monthKey);
    const imgItem = monthItems.find(it => it.type === 'image');
    return imgItem ? imgItem.url : null;
  };

  const getCustomFolderItems = (folderId: string, globalItems: any[]) => {
    const allowedItems = folderItems.filter(item => item.folder_id === folderId);
    const allowedUrls = new Set(allowedItems.map(item => item.media_url).filter(Boolean));
    const allowedMemoryIds = new Set(allowedItems.map(item => item.memory_id).filter(Boolean));

    return globalItems.filter(item => {
      return allowedUrls.has(item.url) || (item.memoryId && allowedMemoryIds.has(item.memoryId));
    });
  };

  const getCustomFolderCover = (folderId: string, globalItems: any[]) => {
    const folderMedia = getCustomFolderItems(folderId, globalItems);
    const imgItem = folderMedia.find(it => it.type === 'image');
    return imgItem ? imgItem.url : null;
  };

  const toggleFolderVisibility = async (folderId: string) => {
    const currentFolders = child.preview_config?.folders || {};
    const isCurrentlyEnabled = currentFolders[folderId] !== false;
    const updatedFolders = {
      ...currentFolders,
      [folderId]: !isCurrentlyEnabled
    };
    const updatedConfig = {
      ...child.preview_config,
      folders: updatedFolders
    };

    // Optimistic UI update
    const updatedChild = {
      ...child,
      preview_config: updatedConfig
    };
    setChild(updatedChild);
    setFormData(prev => ({ ...prev, preview_config: updatedConfig }));

    // Save in Supabase
    const { error } = await supabase
      .from("children")
      .update({ preview_config: updatedConfig })
      .eq("id", childId);

    if (error) {
      console.error("Error saving folder visibility:", error);
      // Revert if error
      setChild(child);
      setFormData(prev => ({ ...prev, preview_config: child.preview_config }));
      setToastMessage("Error al guardar visibilidad");
      setTimeout(() => setToastMessage(""), 3000);
    } else {
      setToastMessage("¡Visibilidad de carpeta actualizada!");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  // Check parent session
  useEffect(() => {
    async function checkParent() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === child.parent_id) {
        setIsParent(true);
      }
    }
    checkParent();
  }, [child.parent_id]);

  // Load Child Data
  const loadChildData = async (sectionId: string | null = activeStage.id) => {
    setLoadingData(true);
    try {
      let stagesData: any[] = [];
      let foldersData: any[] = [];
      let itemsData: any[] = [];
      let genMemData: any[] = [];
      let allPregMemData: any[] = [];
      let calData: any[] = [];
      let pagesData: any[] = [];

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/children/${childId}`, session ? {
          headers: { Authorization: `Bearer ${session.access_token}` }
        } : undefined);
        if (res.ok) {
          const payload = await res.json();
          if (payload.isOwner) setIsParent(true);
          stagesData = payload.stages || [];
          foldersData = payload.folders || [];
          itemsData = payload.folderItems || [];
          genMemData = payload.generalMemories || [];
          allPregMemData = payload.pregnancyMemories || [];
          calData = payload.calendars || [];
          pagesData = payload.albumPages || [];
          if (payload.child) {
            setChild(payload.child);
          }
        } else {
          throw new Error("API call failed");
        }
      } catch (apiErr) {
        console.warn("Bypassing API, falling back to direct supabase queries:", apiErr);
        // Fallback direct supabase
        const { data: genMem } = await supabase
          .from("general_memories")
          .select("*")
          .eq("child_id", childId)
          .order("memory_date", { ascending: false });
        genMemData = genMem || [];

        const { data: allPregMem } = await supabase
          .from("pregnancy_memories")
          .select("*")
          .eq("child_id", childId)
          .order("memory_date", { ascending: false });
        allPregMemData = allPregMem || [];

        const { data: cal } = await supabase.from("pregnancy_calendars").select("*").eq("child_id", childId);
        calData = cal || [];

        const { data: pages } = await supabase.from("pregnancy_album_pages").select("*").eq("child_id", childId).order("page_number", { ascending: true });
        pagesData = pages || [];

        const { data: directStages } = await supabase
          .from("life_sections")
          .select("*")
          .eq("child_id", childId)
          .order("created_at", { ascending: true });
        stagesData = directStages || [];

        const { data: directFolders } = await supabase
          .from("pregnancy_folders")
          .select("id, name")
          .eq("child_id", childId);
        foldersData = directFolders || [];

        if (directFolders && directFolders.length > 0) {
          const folderIds = directFolders.map(f => f.id);
          const { data: directItems } = await supabase
            .from("pregnancy_folder_items")
            .select("folder_id, memory_id, media_url")
            .in("folder_id", folderIds);
          itemsData = directItems || [];
        }
      }

      setGeneralMemories(genMemData);
      setAllPregnancyMemories(allPregMemData);
      
      const filteredPregMem = sectionId
        ? allPregMemData.filter((m: any) => m.section_id === sectionId)
        : allPregMemData.filter((m: any) => !m.section_id);
      setPregnancyMemories(filteredPregMem);

      const filteredCal = sectionId
        ? calData.filter((c: any) => c.section_id === sectionId)
        : calData.filter((c: any) => !c.section_id);
      setCalendars(filteredCal);

      const filteredPages = sectionId
        ? pagesData.filter((p: any) => p.section_id === sectionId)
        : pagesData.filter((p: any) => !p.section_id);
      setAlbumPages(filteredPages);
      setAllAlbumPages(pagesData);

      setStages([{ id: null, title: "Embarazo" }, ...(stagesData || [])]);
      setFolders(foldersData || []);
      setFolderItems(itemsData || []);

      // Consolidate gallery images
      const images: string[] = [];
      if (child.preview_config?.show_pregnancy !== false || isParent) {
        filteredPregMem.forEach((m: any) => {
          if (m.media_urls && Array.isArray(m.media_urls)) {
            images.push(...m.media_urls);
          }
        });
      }
      if (child.preview_config?.show_gallery !== false || isParent) {
        genMemData.forEach((m: any) => {
          if (m.media_urls && Array.isArray(m.media_urls)) {
            images.push(...m.media_urls);
          }
        });
      }
      setAllImages(images);

    } catch (err) {
      console.error("Error loading preview data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadChildData(activeStage.id);
  }, [childId, activeStage.id]);

  useEffect(() => {
    if (child) {
      setFormData({
        name: child.name || "",
        nickname: child.nickname || "",
        birth_date: child.birth_date || "",
        birth_time: child.birth_time || "",
        weight: child.weight || "",
        height: child.height || "",
        gender: child.gender || "",
        father_name: child.father_name || "",
        mother_name: child.mother_name || "",
        birth_hospital: child.birth_hospital || "",
        theme_color: child.theme_color || "neutral",
        access_code: child.access_code || "",
        preview_config: {
          show_pregnancy: true,
          show_gallery: true,
          show_calendars: true,
          show_album: true,
          status: "pregnancy",
          fum: "",
          ...(child.preview_config || {})
        }
      });
    }
  }, [child]);

  // Sidebar Mobile Timer Auto-close
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isMobileSidebarOpen) {
      timer = setTimeout(() => {
        setIsMobileSidebarOpen(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isMobileSidebarOpen]);

  const resetSidebarTimer = () => {
    // Touching sidebar resets the auto-close timer
    setIsMobileSidebarOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTogglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      preview_config: {
        ...prev.preview_config,
        [key]: !((prev.preview_config as any)[key])
      }
    }));
  };

  const generateAccessCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "TW-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, access_code: code }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Evitar error 400 con date/time vacío
    const dataToSave = { ...formData };
    if (!dataToSave.birth_date) dataToSave.birth_date = null as any;
    if (!dataToSave.birth_time) dataToSave.birth_time = null as any;

    const { error } = await supabase
      .from("children")
      .update(dataToSave)
      .eq("id", childId);
      
    setSaving(false);
    if (!error) {
      setToastMessage("¡Configuraciones espejo guardadas!");
      setChild({ ...child, ...formData });
      setTimeout(() => setToastMessage(""), 3000);
    } else {
      setToastMessage("Error al guardar");
      console.error(error);
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const theme = themePalettes[child.theme_color] || themePalettes.neutral;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/preview/code/${formData.access_code}` : "";

  const cleanStat = (val: any) => {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    const sLower = s.toLowerCase();
    if (
      s === "" || 
      sLower === "null" || 
      sLower === "undefined" || 
      sLower === "próximamente" || 
      sLower === "proximamente"
    ) return null;
    return s;
  };

  const isCustomStage = activeStage.id !== null;
  const currentStageObj = isCustomStage ? stages.find(s => s.id === activeStage.id) : null;
  const displayPhoto = isCustomStage ? (currentStageObj?.baby_photo || null) : (child.cover_image || child.photo_url || null);
  const displayWeight = isCustomStage ? (currentStageObj?.baby_weight || null) : null;
  const displayHeight = isCustomStage ? (currentStageObj?.baby_height || null) : null;

  const cleanBirthDate = isCustomStage ? null : (child.birth_date || "Próximamente");
  const cleanBirthTime = isCustomStage ? null : (child.birth_time || "Próximamente");
  const cleanWeight = isCustomStage ? (displayWeight || "Próximamente") : (child.weight || "Próximamente");
  const cleanHeight = isCustomStage ? (displayHeight || "Próximamente") : (child.height || "Próximamente");
  const cleanHospital = isCustomStage ? null : (child.birth_hospital || "Próximamente");
  const cleanMother = isCustomStage ? null : (child.mother_name || "Próximamente");
  const cleanFather = isCustomStage ? null : (child.father_name || "Próximamente");

  const hasAnyDetails = true;

  // Extract all valid image URLs from current active stage memories with privacy filtering
  const stageImages: string[] = [];

  const isAllEnabledStage = child.preview_config?.folders?.['all'] !== false;
  const isByDateEnabledStage = child.preview_config?.folders?.['by_date'] !== false;
  const isGlobalGalleryEnabledStage = isAllEnabledStage || isByDateEnabledStage;

  // Get active custom folder IDs
  const activeCustomFolderIds = folders
    .filter(f => child.preview_config?.folders?.[f.id] !== false)
    .map(f => f.id);

  const allowedUrls = new Set<string>();
  const allowedMemoryIds = new Set<string>();

  folderItems.forEach(item => {
    if (activeCustomFolderIds.includes(item.folder_id)) {
      if (item.media_url) {
        allowedUrls.add(item.media_url);
        allowedUrls.add(getProxiedUrl(item.media_url));
      }
      if (item.memory_id) {
        allowedMemoryIds.add(item.memory_id);
      }
    }
  });

  pregnancyMemories.forEach(mem => {
    if (mem.media_urls && Array.isArray(mem.media_urls)) {
      mem.media_urls.forEach((url: string) => {
        if (url && url.trim() !== "") {
          // For visitors, allow if global gallery is enabled OR if associated with an active custom folder
          if (!isParent && !isGlobalGalleryEnabledStage) {
            const isAllowed = allowedUrls.has(url) || allowedUrls.has(getProxiedUrl(url)) || (mem.id && allowedMemoryIds.has(mem.id));
            if (!isAllowed) return; // skip this URL
          }

          const lower = url.toLowerCase();
          const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.m4v') || lower.includes('video/');
          const isAudio = lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.aac') || lower.includes('audio/');
          if (!isVideo && !isAudio) {
            stageImages.push(url);
          }
        }
      });
    }
  });

  if (activeTab === "album" && selectedPreviewBook) {
    return (
      <PregnancyDigitalAlbum
        childId={childId}
        child={child}
        sectionId={selectedPreviewBook.id}
        theme={theme}
        isMobile={isMobile}
        readOnly={true}
        onBack={() => setSelectedPreviewBook(null)}
      />
    );
  }

  return (
    <div className={`w-screen h-screen overflow-hidden ${theme.bg} bg-texture transition-colors duration-500 flex flex-col relative`}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] bg-white ${theme.text} px-6 py-3 rounded-full shadow-2xl font-outfit font-bold flex items-center gap-2 border ${theme.borderAccent}`}
          >
            <CheckCircle2 size={18} className={`${theme.text} animate-pulse`} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal inside Preview */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQRModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative border ${theme.borderAccent} text-center z-10`}
            >
              <button 
                onClick={() => setShowQRModal(false)}
                className={`absolute top-6 right-6 p-2 ${theme.bgLight} rounded-full ${theme.text} transition-colors`}
              >
                <X size={20} />
              </button>

              <div className="mb-6 mt-2">
                <div className={`w-14 h-14 rounded-full ${theme.bg} mx-auto flex items-center justify-center shadow-inner`}>
                  <QrCode size={26} className={theme.text} />
                </div>
              </div>

              <h3 className={`font-outfit font-black text-2xl ${theme.text} mb-1`}>
                Código QR de {child.name}
              </h3>
              <p className={`text-xs ${theme.text}/50 uppercase tracking-widest font-bold mb-6`}>
                Escanea para ver el diario
              </p>

              <div className={`bg-white border-2 border-dashed ${theme.borderAccent} rounded-3xl p-4 inline-block mb-6 shadow-inner`}>
                {formData.access_code ? (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto rounded-xl object-contain"
                  />
                ) : (
                  <div className={`w-48 h-48 flex items-center justify-center ${theme.text}/40 text-sm font-bold`}>
                    Genera un código primero
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setToastMessage("¡Enlace copiado!");
                  setTimeout(() => setToastMessage(""), 3000);
                }}
                className={`w-full py-4 ${theme.primaryBg} ${theme.textActive} rounded-2xl font-bold ${theme.hoverBg} transition-all text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2`}
              >
                <Copy size={16} /> Copiar Enlace
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox para imágenes */}
      <AnimatePresence>
        {activeImageIndex !== null && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveImageIndex(null)}
              className="absolute inset-0"
            />
            
            <button 
              onClick={() => setActiveImageIndex(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 text-white/60 hover:text-white transition-colors p-2.5 bg-black/45 hover:bg-black/60 rounded-full z-[2100] cursor-pointer shadow-lg hover:scale-110"
            >
              <X size={20} />
            </button>
 
            {activeImageIndex > 0 && (
              <button 
                onClick={() => setActiveImageIndex(activeImageIndex - 1)}
                className="absolute left-6 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all z-10"
              >
                <ArrowLeft size={28} />
              </button>
            )}
 
            {activeImageIndex < lightboxImages.length - 1 && (
              <button 
                onClick={() => setActiveImageIndex(activeImageIndex + 1)}
                className="absolute right-6 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all z-10"
              >
                <ArrowRight size={28} />
              </button>
            )}
 
            <motion.div 
              key={activeImageIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl h-[70vh] flex items-center justify-center"
            >
              <img 
                src={lightboxImages[activeImageIndex]} 
                alt="Memory Slide" 
                className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl border border-white/10"
              />
            </motion.div>
            
            <span className="absolute bottom-8 text-white/50 text-xs font-bold uppercase tracking-[0.3em]">
              Foto {activeImageIndex + 1} de {lightboxImages.length}
            </span>
          </div>
        )}
      </AnimatePresence>

      {/* 1. BARRA SUPERIOR (HEADER) */}
      <header className={`h-16 px-4 md:px-8 bg-white/70 backdrop-blur-xl border-b ${theme.borderAccent} flex items-center justify-between shadow-sm shrink-0 z-[90]`}>
        <div className="flex items-center gap-3">
          {/* Menu Hambuger para celular */}
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className={`md:hidden p-2 ${theme.bgLight} hover:${theme.bgLight}/80 rounded-xl ${theme.text} transition-colors`}
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-8 h-8 object-contain" />
            <h1 className={`font-outfit font-black text-base md:text-xl ${theme.text} tracking-tight leading-none`}>
              TinyWorld
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-full ${theme.bg} border border-white/60 shadow-sm flex items-center gap-2`}>
            <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm`}>
              <Baby size={12} className={theme.text} />
            </div>
            <span className={`font-outfit font-black text-xs ${theme.text}/70 uppercase tracking-wider hidden sm:inline`}>
              El diario de
            </span>
            <span className={`font-outfit font-black text-xs ${theme.text} uppercase tracking-wider`}>
              {child.nickname || child.name}
            </span>
            {(() => {
              const config = child.preview_config || {};
              const isPregnancy = config.status !== "born";
              let shortLabel = "";
              if (isPregnancy && config.fum) {
                const gest = calculateGestation(config.fum);
                if (gest) {
                  shortLabel = `${gest.weeks} sem`;
                }
              } else if (!isPregnancy && child.birth_date) {
                const birth = new Date(child.birth_date + "T12:00:00");
                const now = new Date();
                const diffTime = now.getTime() - birth.getTime();
                if (diffTime >= 0) {
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  const weeks = Math.floor(diffDays / 7);
                  const months = Math.floor(diffDays / 30.4375);
                  if (months > 0) {
                    shortLabel = `${months} ${months === 1 ? 'mes' : 'meses'}`;
                  } else {
                    shortLabel = `${weeks} ${weeks === 1 ? 'sem' : 'sem'}`;
                  }
                }
              }
              if (!shortLabel) return null;
              return (
                <>
                  <span className={`text-xs ${theme.text} opacity-30`}>|</span>
                  <span className={`font-outfit font-black text-xs ${theme.text} opacity-80 uppercase tracking-wider`}>
                    {shortLabel}
                  </span>
                </>
              );
            })()}
          </div>

          <button 
            onClick={onClose}
            className={`p-2.5 ${theme.primaryBg} ${theme.textActive} ${theme.hoverBg} rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md`}
          >
            <BookOpen size={16} /> <span className="hidden sm:inline">Cerrar Libro</span>
          </button>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        
        {/* 2. BARRA LATERAL (SIDEBAR) ESCRITORIO */}
        <aside className={`hidden md:flex w-72 bg-white/50 backdrop-blur-md border-r ${theme.borderAccent} flex-col p-6 h-full z-40 justify-between overflow-y-auto shrink-0`}>
          <div className="space-y-2">
            <span className={`text-[10px] ${theme.text}/40 font-black uppercase tracking-[0.2em] block mb-4 ml-3`}>Explorar Diario</span>
            
            <button 
              onClick={() => setActiveTab("inicio")} 
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group font-outfit text-xs font-black uppercase tracking-widest ${activeTab === "inicio" ? `${theme.bg} ${theme.text} shadow-md` : `${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}`}
            >
              <div className={`p-2 rounded-xl transition-all ${activeTab === "inicio" ? `bg-white ${theme.text}` : `${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}`}><Heart size={16}/></div>
              <span>Inicio</span>
            </button>

            {(child.preview_config?.show_gallery !== false || isParent) && (
              <button 
                onClick={() => setActiveTab("galeria")} 
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group font-outfit text-xs font-black uppercase tracking-widest ${activeTab === "galeria" ? `${theme.bg} ${theme.text} shadow-md` : `${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}`}
              >
                <div className={`p-2 rounded-xl transition-all ${activeTab === "galeria" ? `bg-white ${theme.text}` : `${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}`}><Images size={16}/></div>
                <span>Galería</span>
              </button>
            )}

            {(child.preview_config?.show_calendars !== false || isParent) && (
              <button 
                onClick={() => setActiveTab("calendarios")} 
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group font-outfit text-xs font-black uppercase tracking-widest ${activeTab === "calendarios" ? `${theme.bg} ${theme.text} shadow-md` : `${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}`}
              >
                <div className={`p-2 rounded-xl transition-all ${activeTab === "calendarios" ? `bg-white ${theme.text}` : `${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}`}><CalendarDays size={16}/></div>
                <span>Calendarios</span>
              </button>
            )}

            {(child.preview_config?.show_album !== false || isParent) && (
              <button 
                onClick={() => setActiveTab("album")} 
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group font-outfit text-xs font-black uppercase tracking-widest ${(activeTab as string) === "album" ? `${theme.bg} ${theme.text} shadow-md` : `${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}`}
              >
                <div className={`p-2 rounded-xl transition-all ${(activeTab as string) === "album" ? `bg-white ${theme.text}` : `${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}`}><BookOpen size={16}/></div>
                <span>Álbum</span>
              </button>
            )}
          </div>

          <div className={`space-y-2 border-t ${theme.borderAccent} pt-6`}>
            {isParent && (
              <>
                <span className={`text-[10px] ${theme.text}/40 font-black uppercase tracking-[0.2em] block mb-2 ml-3`}>Padres</span>
                <button 
                  onClick={() => setActiveTab("configuracion")} 
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group font-outfit text-xs font-black uppercase tracking-widest ${activeTab === "configuracion" ? `${theme.bg} ${theme.text} shadow-md` : `${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}`}
                >
                  <div className={`p-2 rounded-xl transition-all ${activeTab === "configuracion" ? `bg-white ${theme.text}` : `${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}`}><Settings size={16}/></div>
                  <span>Configuración</span>
                </button>

                <button 
                  onClick={() => router.push(`/dashboard/child/${childId}`)} 
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group font-outfit text-xs font-black uppercase tracking-widest text-left ${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}
                >
                  <div className={`p-2 rounded-xl transition-all ${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}><ArrowLeft size={16}/></div>
                  <span>Dashboard</span>
                </button>
              </>
            )}
          </div>
        </aside>

        {/* 3. BARRA LATERAL MÓVIL (SIDEBAR SLIDEOUT) */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-[100] md:hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute inset-0 bg-black/35 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                ref={sidebarRef}
                onTouchStart={resetSidebarTimer}
                onClick={resetSidebarTimer}
                className={`absolute top-0 bottom-0 left-0 w-4/5 max-w-[280px] bg-white/98 backdrop-blur-md border-r ${theme.borderAccent} p-6 shadow-2xl flex flex-col justify-between`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <span className={`text-[10px] ${theme.text}/40 font-black uppercase tracking-[0.2em]`}>Explorar Diario</span>
                    <button 
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`p-1 hover:${theme.bgLight} rounded-full ${theme.text}`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => { setActiveTab("inicio"); setIsMobileSidebarOpen(false); }} 
                      className={`w-full p-4 rounded-2xl flex items-center gap-4 font-outfit text-xs font-black uppercase tracking-widest transition-all group ${activeTab === "inicio" ? `${theme.bg} ${theme.text} shadow-md` : `${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}`}
                    >
                      <div className={`p-2 rounded-xl transition-all ${activeTab === "inicio" ? `bg-white ${theme.text}` : `${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}`}><Heart size={16}/></div>
                      <span>Inicio</span>
                    </button>

                    {(child.preview_config?.show_gallery !== false || isParent) && (
                      <button 
                        onClick={() => { setActiveTab("galeria"); setIsMobileSidebarOpen(false); }} 
                        className={`w-full p-4 rounded-2xl flex items-center gap-4 font-outfit text-xs font-black uppercase tracking-widest transition-all group ${activeTab === "galeria" ? `${theme.bg} ${theme.text} shadow-md` : `${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}`}
                      >
                        <div className={`p-2 rounded-xl transition-all ${activeTab === "galeria" ? `bg-white ${theme.text}` : `${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}`}><Images size={16}/></div>
                        <span>Galería</span>
                      </button>
                    )}

                    {(child.preview_config?.show_calendars !== false || isParent) && (
                      <button 
                        onClick={() => { setActiveTab("calendarios"); setIsMobileSidebarOpen(false); }} 
                        className={`w-full p-4 rounded-2xl flex items-center gap-4 font-outfit text-xs font-black uppercase tracking-widest transition-all group ${activeTab === "calendarios" ? `${theme.bg} ${theme.text} shadow-md` : `${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}`}
                      >
                        <div className={`p-2 rounded-xl transition-all ${activeTab === "calendarios" ? `bg-white ${theme.text}` : `${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}`}><CalendarDays size={16}/></div>
                        <span>Calendarios</span>
                      </button>
                    )}

                    {(child.preview_config?.show_album !== false || isParent) && (
                      <button 
                        onClick={() => { setActiveTab("album"); setIsMobileSidebarOpen(false); }} 
                        className={`w-full p-4 rounded-2xl flex items-center gap-4 font-outfit text-xs font-black uppercase tracking-widest transition-all group ${(activeTab as string) === "album" ? `${theme.bg} ${theme.text} shadow-md` : `${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}`}
                      >
                        <div className={`p-2 rounded-xl transition-all ${(activeTab as string) === "album" ? `bg-white ${theme.text}` : `${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}`}><BookOpen size={16}/></div>
                        <span>Álbum</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className={`space-y-2 border-t ${theme.borderAccent} pt-6`}>
                  {isParent && (
                    <>
                      <span className={`text-[10px] ${theme.text}/40 font-black uppercase tracking-[0.2em] block mb-2`}>Administrar</span>
                      <button 
                        onClick={() => { setActiveTab("configuracion"); setIsMobileSidebarOpen(false); }} 
                        className={`w-full p-4 rounded-2xl flex items-center gap-4 font-outfit text-xs font-black uppercase tracking-widest transition-all group ${activeTab === "configuracion" ? `${theme.bg} ${theme.text} shadow-md` : `${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}`}
                      >
                        <div className={`p-2 rounded-xl transition-all ${activeTab === "configuracion" ? `bg-white ${theme.text}` : `${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}`}><Settings size={16}/></div>
                        <span>Configuración</span>
                      </button>

                      <button 
                        onClick={() => router.push(`/dashboard/child/${childId}`)} 
                        className={`w-full p-4 rounded-2xl flex items-center gap-4 font-outfit text-xs font-black uppercase tracking-widest transition-all group ${theme.text}/70 hover:${theme.bgLight} hover:${theme.text}`}
                      >
                        <div className={`p-2 rounded-xl transition-all ${theme.bgLight} group-hover:${theme.primaryBg} group-hover:${theme.textActive}`}><ArrowLeft size={16}/></div>
                        <span>Dashboard</span>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 4. CONTENIDO PRINCIPAL DE LA PESTAÑA */}
        <main className="flex-1 h-full p-3 md:p-5 pt-1 md:pt-1.5 overflow-y-auto min-h-0 max-w-full flex flex-col gap-3">
          
          {/* Minimalist Stage Navigation Selector */}
          {(activeTab === "inicio" || activeTab === "configuracion") && stages.length > 1 && (
            <div className="max-w-5xl w-full mx-auto flex items-center justify-center gap-2.5 shrink-0 px-4 mt-2.5 mb-4 relative z-30">
              
              {/* Home Indicator 🏠 */}
              <div className="relative group">
                <button
                  onClick={() => {
                    setActiveStage({ id: null, title: "Embarazo" });
                    loadChildData(null);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    activeStage.id === null
                      ? `scale-110 opacity-100 bg-sky-50 text-sky-600 shadow-sm border border-sky-100`
                      : "opacity-45 hover:opacity-100 text-sky-400 hover:text-sky-600 hover:bg-sky-50"
                  }`}
                >
                  <Home size={14} fill={activeStage.id === null ? "currentColor" : "none"} />
                </button>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900/90 backdrop-blur-sm text-white text-[9.5px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
                  Embarazo
                </span>
              </div>

              {/* Vertical Divider */}
              <div className="h-4 w-[1px] bg-gray-300/40 mx-1" />

              {/* Custom Stages Dots */}
              <div className="flex items-center gap-2">
                {stages.filter(s => s.id !== null).map((stage) => {
                  const isActive = activeStage.id === stage.id;
                  return (
                    <div key={stage.id} className="relative group">
                      <button
                        onClick={() => {
                          setActiveStage({ id: stage.id, title: stage.title });
                          loadChildData(stage.id);
                        }}
                        className={`transition-all duration-300 ${
                          isActive
                            ? `w-5.5 h-2 rounded-full`
                            : `w-2 h-2 rounded-full hover:scale-125`
                        }`}
                        style={{ 
                          backgroundColor: isActive ? theme.hex : '#9CA3AF', 
                          opacity: isActive ? 1 : 0.35 
                        }}
                      />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900/90 backdrop-blur-sm text-white text-[9.5px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
                        {stage.title}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
            {loadingData ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-center p-12"
              >
                <Loader2 className={`animate-spin ${theme.text}/40 mb-3`} size={40} />
                <span className={`text-xs ${theme.text}/50 uppercase tracking-widest font-black`}>Cargando recuerdos...</span>
              </motion.div>
            ) : (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.99 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full max-w-5xl mx-auto space-y-3 md:space-y-4"
              >
                
                {/* TAB INICIO: PERFIL CON REJILLA RESPONSIVA ADAPTADA */}
                {activeTab === "inicio" && (
                  <div className="space-y-4">
                    {/* Ficha Principal en Celular (Ultracompacta) */}
                    <div className="block md:hidden">
                      <div className={`bg-white/95 backdrop-blur-md rounded-[1.5rem] ${hasAnyDetails ? 'p-2.5' : 'p-1.5 max-w-[200px]'} border ${theme.borderAccent} shadow-sm grid grid-cols-[auto_1fr] gap-3 items-center mx-auto relative overflow-hidden`}>
                        <div className="shrink-0 flex flex-col items-center justify-center p-0.5">
                          <div className="relative group">
                            <BabyAvatar
                              gender={child.gender}
                              coverImage={displayPhoto}
                              name={child.name}
                              size={hasAnyDetails ? "md" : "sm"}
                              className={`${theme.bg} shadow-md`}
                              iconClassName={theme.text}
                              style={{ borderColor: theme.hex }}
                            />
                          </div>
                        </div>
                        
                        <div className="text-left flex-1 min-w-0 space-y-0.5">
                          <div>
                            <h2 className={`${hasAnyDetails ? 'text-base' : 'text-xs'} font-outfit font-black ${theme.text} tracking-tight leading-none truncate`}>
                              {child.name}
                            </h2>
                            {child.nickname && (
                              <p className={`text-[6.5px] ${theme.text}/60 font-black uppercase tracking-widest truncate mt-0.5`}>
                                "{child.nickname}"
                              </p>
                            )}
                            {(() => {
                              const config = child.preview_config || {};
                              const isPregnancy = config.status !== "born";
                              let label = "";
                              if (isPregnancy && config.fum) {
                                const gest = calculateGestation(config.fum);
                                if (gest) {
                                  label = `${gest.weeks} sem. de Gestación`;
                                }
                              } else if (!isPregnancy && child.birth_date) {
                                const ageStr = calculateAge(child.birth_date);
                                if (ageStr) {
                                  label = ageStr;
                                }
                              }
                              if (!label) return null;
                              return (
                                <div className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full ${theme.bg} border ${theme.borderAccent}/60 text-left`}>
                                  <Baby size={8} className={theme.text} />
                                  <span className={`font-outfit font-black text-[6.5px] uppercase tracking-wider ${theme.text}`}>
                                    {label}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                          {hasAnyDetails && (
                            <div className={`grid grid-cols-2 gap-1.5 pt-1.5 border-t border-dashed ${theme.borderAccent}`}>
                              {cleanBirthDate && (
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/80 border ${theme.borderAccent} min-w-0 shadow-sm`}>
                                  <Calendar size={9} className={`${theme.text} shrink-0 opacity-70`} />
                                  <span className={`truncate ${theme.text} font-black text-[7.5px]`}>
                                    {cleanBirthDate}
                                  </span>
                                </div>
                              )}
                              
                              {cleanBirthTime && (
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/80 border ${theme.borderAccent} min-w-0 shadow-sm`}>
                                  <Clock size={9} className={`${theme.text} shrink-0 opacity-70`} />
                                  <span className={`truncate ${theme.text} font-black text-[7.5px]`}>
                                    {cleanBirthTime}
                                  </span>
                                </div>
                              )}
                              
                              {cleanWeight && (
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/80 border ${theme.borderAccent} min-w-0 shadow-sm`}>
                                  <Scale size={9} className={`${theme.text} shrink-0 opacity-70`} />
                                  <span className={`truncate ${theme.text} font-black text-[7.5px]`}>
                                    {cleanWeight}
                                  </span>
                                </div>
                              )}
                              
                              {cleanHeight && (
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/80 border ${theme.borderAccent} min-w-0 shadow-sm`}>
                                  <Ruler size={9} className={`${theme.text} shrink-0 opacity-70`} />
                                  <span className={`truncate ${theme.text} font-black text-[7.5px]`}>
                                    {cleanHeight}
                                  </span>
                                </div>
                              )}
                              
                              {cleanHospital && (
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/80 border ${theme.borderAccent} col-span-2 min-w-0 shadow-sm`}>
                                  <MapPin size={9} className={`${theme.text} shrink-0 opacity-70`} />
                                  <span className={`truncate ${theme.text} font-black text-[7.5px]`}>
                                    {cleanHospital}
                                  </span>
                                </div>
                              )}

                              {(cleanMother || cleanFather) && (
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/80 border ${theme.borderAccent} col-span-2 min-w-0 shadow-sm`}>
                                  <Users size={9} className={`${theme.text} shrink-0 opacity-70`} />
                                  <span className={`truncate ${theme.text} font-black text-[7px] leading-none`}>
                                    {cleanMother && `Mamá: ${cleanMother}`} {cleanMother && cleanFather && '•'} {cleanFather && `Papá: ${cleanFather}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ficha Principal en Escritorio (Adaptada al Tema - Formato Normal y Legible) */}
                    <div className={`hidden md:flex ${hasAnyDetails ? 'max-w-4xl p-6 rounded-[2rem] gap-8' : 'max-w-[320px] p-4 rounded-full gap-6 pl-6 pr-8'} mx-auto bg-white/90 backdrop-blur-md border border-white/80 shadow-md flex-row items-center relative overflow-hidden`}>
                      
                      {/* Left Avatar */}
                      <div className="shrink-0">
                        <BabyAvatar
                          gender={child.gender}
                          coverImage={displayPhoto}
                          name={child.name}
                          size={hasAnyDetails ? "xl" : "lg"}
                          className={`${theme.bg} shadow-md border-2`}
                          iconClassName={theme.text}
                          style={{ borderColor: theme.hex }}
                        />
                      </div>

                      {/* Right Details Grid */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex flex-col items-start w-full mb-4">
                          <h2 className="text-3xl md:text-4xl font-outfit font-black tracking-tight leading-none mb-1.5 w-full" style={{ color: theme.hex }}>
                            {child.name}
                          </h2>
                          {child.nickname && (
                            <p className="text-xs md:text-sm font-black uppercase tracking-widest opacity-60" style={{ color: theme.hex }}>
                              "{child.nickname}"
                            </p>
                          )}
                          {(() => {
                            const config = child.preview_config || {};
                            const isPregnancy = config.status !== "born";
                            let label = "";
                            if (isPregnancy && config.fum) {
                              const gest = calculateGestation(config.fum);
                              if (gest) {
                                label = `${gest.weeks} Semanas de Gestación`;
                              }
                            } else if (!isPregnancy && child.birth_date) {
                              const ageStr = calculateAge(child.birth_date);
                              if (ageStr) {
                                label = `Edad: ${ageStr}`;
                              }
                            }
                            if (!label) return null;
                            return (
                              <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full ${theme.bg} border ${theme.borderAccent} text-left`}>
                                <Baby size={12} className={theme.text} />
                                <span className={`font-outfit font-black text-[9px] md:text-[10px] uppercase tracking-wider ${theme.text}`}>
                                  {label}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {hasAnyDetails && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cleanBirthDate && (
                              <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border border-gray-100/80 flex items-center gap-4.5 ${theme.cardHover} transition-all shadow-sm hover:shadow-md`}>
                                <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} shrink-0 shadow-inner`}><Calendar size={18} /></div>
                                <div className="text-left leading-tight flex-1 min-w-0">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Fecha</span>
                                  <span className={`font-outfit text-sm md:text-base font-black ${theme.text} truncate block`}>{cleanBirthDate}</span>
                                </div>
                              </div>
                            )}

                            {cleanBirthTime && (
                              <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border border-gray-100/80 flex items-center gap-4.5 ${theme.cardHover} transition-all shadow-sm hover:shadow-md`}>
                                <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} shrink-0 shadow-inner`}><Clock size={18} /></div>
                                <div className="text-left leading-tight flex-1 min-w-0">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Hora</span>
                                  <span className={`font-outfit text-sm md:text-base font-black ${theme.text} truncate block`}>{cleanBirthTime}</span>
                                </div>
                              </div>
                            )}

                            {cleanWeight && (
                              <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border border-gray-100/80 flex items-center gap-4.5 ${theme.cardHover} transition-all shadow-sm hover:shadow-md`}>
                                <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} shrink-0 shadow-inner`}><Scale size={18} /></div>
                                <div className="text-left leading-tight flex-1 min-w-0">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Peso</span>
                                  <span className={`font-outfit text-sm md:text-base font-black ${theme.text} truncate block`}>{cleanWeight}</span>
                                </div>
                              </div>
                            )}

                            {cleanHeight && (
                              <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border border-gray-100/80 flex items-center gap-4.5 ${theme.cardHover} transition-all shadow-sm hover:shadow-md`}>
                                <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} shrink-0 shadow-inner`}><Ruler size={18} /></div>
                                <div className="text-left leading-tight flex-1 min-w-0">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Estatura</span>
                                  <span className={`font-outfit text-sm md:text-base font-black ${theme.text} truncate block`}>{cleanHeight}</span>
                                </div>
                              </div>
                            )}

                            {cleanHospital && (
                              <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border border-gray-100/80 flex items-center gap-4.5 ${theme.cardHover} transition-all shadow-sm hover:shadow-md`}>
                                <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} shrink-0 shadow-inner`}><MapPin size={18} /></div>
                                <div className="text-left leading-tight flex-1 min-w-0">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Hospital</span>
                                  <span className={`font-outfit text-sm md:text-base font-black ${theme.text} truncate block`}>{cleanHospital}</span>
                                </div>
                              </div>
                            )}

                            {(cleanMother || cleanFather) && (
                              <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border border-gray-100/80 flex items-center gap-4.5 ${theme.cardHover} transition-all shadow-sm hover:shadow-md`}>
                                <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} shrink-0 shadow-inner`}><Users size={18} /></div>
                                <div className="text-left leading-tight flex-1 min-w-0">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Padres</span>
                                  <span className={`font-outfit text-xs md:text-sm font-black ${theme.text} block leading-snug truncate`}>
                                    {cleanMother && <span className="block truncate">M: {cleanMother}</span>}
                                    {cleanFather && <span className="block truncate">P: {cleanFather}</span>}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>


                    {/* Tarjeta "¿Cómo está el bebé?" (Solo para la etapa de Embarazo) */}
                    {activeStage.id === null && (
                      <HowIsBabyCard fum={child.preview_config?.fum} theme={theme} />
                    )}

                    {/* Presentación de Fotos de la Etapa (Collage) */}
                    <div className="pt-4 md:pt-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100/50 pb-1.5">
                        <div>
                          <h3 className={`font-outfit font-black text-sm md:text-base ${theme.text}`}>
                            Recuerdos de la Etapa
                          </h3>
                          <p className={`text-[8px] md:text-[8.5px] ${theme.text}/50 font-black uppercase tracking-wider mt-0.5`}>
                            {activeStage.title} • {stageImages.length} {stageImages.length === 1 ? 'imagen' : 'imágenes'}
                          </p>
                        </div>
                      </div>

                      <BabyPhotoCollage 
                        images={stageImages}
                        theme={theme}
                        onImageClick={openLightbox}
                      />
                    </div>
                  </div>
                )}

              {/* TAB GALERÍA: CARPETAS PERSONALIZADAS Y MEDIA GRID */}
              {activeTab === "galeria" && (
                (() => {
                  const globalItems = getGlobalMediaItems();

                  const monthsList = Array.from(new Set(globalItems.map(it => getMonthKey(it.date))))
                    .filter(key => key !== "Unknown")
                    .sort((a, b) => b.localeCompare(a));

                  const getDisplayItems = () => {
                    if (!galleryFolder) return [];
                    if (galleryFolder.id === 'all') return globalItems;
                    if (galleryFolder.filterMonthKey) {
                      return globalItems.filter(it => getMonthKey(it.date) === galleryFolder.filterMonthKey);
                    }
                    if (galleryFolder.isCustom) {
                      return getCustomFolderItems(galleryFolder.id, globalItems);
                    }
                    return [];
                  };

                  const currentFolderItemsList = getDisplayItems();
                  const filteredItems = currentFolderItemsList.filter(it => it.type === activeMediaTab);

                  const tabCounts = {
                    image: currentFolderItemsList.filter(it => it.type === 'image').length,
                    video: currentFolderItemsList.filter(it => it.type === 'video').length,
                    audio: currentFolderItemsList.filter(it => it.type === 'audio').length,
                  };

                  return (
                    <div className="space-y-6">
                      {/* Gallery Subheader */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Images size={22} className={theme.text} />
                          <h3 className={`font-outfit font-black text-2xl ${theme.text}`}>
                            {galleryFolder ? galleryFolder.name : "Galería Global"}
                          </h3>
                        </div>
                        {galleryView !== 'folders' && (
                          <button
                            onClick={() => {
                              if (galleryView === 'items') {
                                if (galleryFolder?.filterMonthKey) {
                                  setGalleryView('months');
                                  setGalleryFolder({ id: 'by_date', name: 'Por Fecha' });
                                } else {
                                  setGalleryView('folders');
                                  setGalleryFolder(null);
                                }
                              } else if (galleryView === 'months') {
                                setGalleryView('folders');
                                setGalleryFolder(null);
                              }
                            }}
                            className={`px-4 py-2 bg-white ${theme.text} rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${theme.borderAccent} hover:${theme.bgLight}`}
                          >
                            <ArrowLeft size={14} /> Regresar
                          </button>
                        )}

                        {/* Floating Category Tabs (Only inside Items view) */}
                        {galleryView === 'items' && (
                          <div className="flex items-center gap-1 bg-white/40 p-1 rounded-xl border border-white/40 shadow-sm">
                            <button 
                              onClick={() => setActiveMediaTab('image')} 
                              className={`p-2 rounded-lg transition-all flex items-center gap-1 ${activeMediaTab === 'image' ? `${theme.bg} ${theme.text} shadow-sm` : `${theme.text} opacity-30`}`}
                            >
                              <Images size={16} />
                              <span className="text-[9px] font-black">{tabCounts.image}</span>
                            </button>
                            <button 
                              onClick={() => setActiveMediaTab('video')} 
                              className={`p-2 rounded-lg transition-all flex items-center gap-1 ${activeMediaTab === 'video' ? `${theme.bg} ${theme.text} shadow-sm` : `${theme.text} opacity-30`}`}
                            >
                              <Video size={16} />
                              <span className="text-[9px] font-black">{tabCounts.video}</span>
                            </button>
                            <button 
                              onClick={() => setActiveMediaTab('audio')} 
                              className={`p-2 rounded-lg transition-all flex items-center gap-1 ${activeMediaTab === 'audio' ? `${theme.bg} ${theme.text} shadow-sm` : `${theme.text} opacity-30`}`}
                            >
                              <Mic size={16} />
                              <span className="text-[9px] font-black">{tabCounts.audio}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <AnimatePresence mode="wait">
                        
                        {/* VIEW: FOLDERS (Root) */}
                        {galleryView === 'folders' && (
                          <motion.div
                            key="folders"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-8"
                          >
                            {/* SYSTEM DIRECTORIES */}
                            {(() => {
                              const isAllEnabled = child.preview_config?.folders?.['all'] !== false;
                              const isByDateEnabled = child.preview_config?.folders?.['by_date'] !== false;

                              // If guest, show cards only if they are enabled
                              const showAllCard = isParent || isAllEnabled;
                              const showByDateCard = isParent || isByDateEnabled;

                              const visibleCustomFolders = folders.filter(f => isParent || child.preview_config?.folders?.[f.id] !== false);

                              if (!showAllCard && !showByDateCard && visibleCustomFolders.length === 0) {
                                return (
                                  <div className={`bg-white/50 border ${theme.borderAccent} rounded-3xl p-12 text-center text-sm ${theme.text}/50 italic`}>
                                    No hay carpetas compartidas disponibles por el momento.
                                  </div>
                                );
                              }

                              const totalFoldersCount = (showAllCard ? 1 : 0) + (showByDateCard ? 1 : 0) + visibleCustomFolders.length;

                              return (
                                <div className="space-y-6">
                                  <div className={`flex items-center justify-between border-b ${theme.borderAccent} pb-2 mb-4`}>
                                    <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-[0.25em] ${theme.text} opacity-50`}>
                                      Álbumes y Carpetas
                                    </h4>
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${theme.text} opacity-40`}>
                                      {totalFoldersCount} {totalFoldersCount === 1 ? 'carpeta' : 'carpetas'}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                                    {/* TODO CARD */}
                                    {showAllCard && (
                                      <motion.div
                                        whileHover={{ y: -4 }}
                                        onClick={() => {
                                          setGalleryFolder({ id: 'all', name: 'Todo el Media' });
                                          setGalleryView('items');
                                        }}
                                        className="group bg-white/80 backdrop-blur-md rounded-[2rem] p-3 border border-white shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                                      >
                                        {/* Folder Cover Preview */}
                                        <div className={`w-full aspect-[4/3] rounded-2xl overflow-hidden relative ${theme.bgLight} border ${theme.borderAccent} shadow-inner`}>
                                          {(() => {
                                            const allCover = globalItems.find(it => it.type === 'image')?.url;
                                            return allCover ? (
                                              <img src={allCover} alt="Todo el Media" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center">
                                                <Sparkles size={28} className="animate-pulse" style={{ color: theme.hex }} />
                                              </div>
                                            );
                                          })()}
                                        </div>

                                        <div className="mt-3 flex justify-between items-center">
                                          <div className="text-left min-w-0 flex-1 pr-2">
                                            <h4 className={`font-outfit font-black text-xs md:text-sm ${theme.text} truncate`}>
                                              Todo el Media
                                            </h4>
                                            <span className={`text-[9px] md:text-[10px] ${theme.text}/45 font-bold uppercase tracking-wider block mt-0.5`}>
                                              {globalItems.length} {globalItems.length === 1 ? 'elemento' : 'elementos'}
                                            </span>
                                          </div>

                                          {isParent && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFolderVisibility('all');
                                              }}
                                              className="w-9 h-5 rounded-full p-0.5 transition-colors duration-300 shrink-0 shadow-inner cursor-pointer"
                                              style={{ backgroundColor: isAllEnabled ? theme.hex : '#E5E7EB' }}
                                            >
                                              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isAllEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}

                                    {/* POR FECHA CARD */}
                                    {showByDateCard && (
                                      <motion.div
                                        whileHover={{ y: -4 }}
                                        onClick={() => {
                                          setGalleryFolder({ id: 'by_date', name: 'Por Fecha' });
                                          setGalleryView('months');
                                        }}
                                        className="group bg-white/80 backdrop-blur-md rounded-[2rem] p-3 border border-white shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                                      >
                                        {/* Folder Cover Preview */}
                                        <div className={`w-full aspect-[4/3] rounded-2xl overflow-hidden relative ${theme.bgLight} border ${theme.borderAccent} shadow-inner`}>
                                          {(() => {
                                            const dateCover = monthsList.length > 0 ? getMonthCover(monthsList[0], globalItems) : null;
                                            return dateCover ? (
                                              <img src={dateCover} alt="Por Fecha" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center">
                                                <Calendar size={28} className={`${theme.text}/20`} />
                                              </div>
                                            );
                                          })()}
                                        </div>

                                        <div className="mt-3 flex justify-between items-center">
                                          <div className="text-left min-w-0 flex-1 pr-2">
                                            <h4 className={`font-outfit font-black text-xs md:text-sm ${theme.text} truncate`}>
                                              Por Fecha
                                            </h4>
                                            <span className={`text-[9px] md:text-[10px] ${theme.text}/45 font-bold uppercase tracking-wider block mt-0.5`}>
                                              {monthsList.length} {monthsList.length === 1 ? 'mes' : 'meses'}
                                            </span>
                                          </div>

                                          {isParent && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFolderVisibility('by_date');
                                              }}
                                              className="w-9 h-5 rounded-full p-0.5 transition-colors duration-300 shrink-0 shadow-inner cursor-pointer"
                                              style={{ backgroundColor: isByDateEnabled ? theme.hex : '#E5E7EB' }}
                                            >
                                              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isByDateEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}

                                    {/* CUSTOM ALBUMS */}
                                    {folders
                                      .filter(folder => isParent || child.preview_config?.folders?.[folder.id] !== false)
                                      .map(folder => {
                                        const cover = getCustomFolderCover(folder.id, globalItems);
                                        const fItems = getCustomFolderItems(folder.id, globalItems);
                                        const isEnabled = child.preview_config?.folders?.[folder.id] !== false;

                                        return (
                                          <motion.div
                                            key={folder.id}
                                            whileHover={{ y: -4 }}
                                            onClick={() => {
                                              setGalleryFolder({ id: folder.id, name: folder.name, isCustom: true });
                                              setGalleryView('items');
                                            }}
                                            className="group bg-white/80 backdrop-blur-md rounded-[2rem] p-3 border border-white shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                                          >
                                            {/* Folder Cover Preview */}
                                            <div className={`w-full aspect-[4/3] rounded-2xl overflow-hidden relative ${theme.bgLight} border ${theme.borderAccent} shadow-inner`}>
                                              {cover ? (
                                                <img src={cover} alt={folder.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <FolderHeart size={28} className={`${theme.text}/20`} />
                                                </div>
                                              )}
                                            </div>

                                            <div className="mt-3 flex justify-between items-center">
                                              <div className="text-left min-w-0 flex-1 pr-2">
                                                <h4 className={`font-outfit font-black text-xs md:text-sm ${theme.text} truncate`}>
                                                  {folder.name}
                                                </h4>
                                                <span className={`text-[9px] md:text-[10px] ${theme.text}/45 font-bold uppercase tracking-wider block mt-0.5`}>
                                                  {fItems.length} {fItems.length === 1 ? 'elemento' : 'elementos'}
                                                </span>
                                              </div>

                                              {isParent && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFolderVisibility(folder.id);
                                                  }}
                                                  className="w-9 h-5 rounded-full p-0.5 transition-colors duration-300 shrink-0 shadow-inner cursor-pointer"
                                                  style={{ backgroundColor: isEnabled ? theme.hex : '#E5E7EB' }}
                                                >
                                                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </button>
                                              )}
                                            </div>
                                          </motion.div>
                                        );
                                      })}
                                  </div>
                                </div>
                              );
                            })()}
                          </motion.div>
                        )}

                        {/* VIEW: MONTHS */}
                        {galleryView === 'months' && (
                          <motion.div
                            key="months"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-6"
                          >
                            <div className="flex items-center gap-2 border-b border-white/50 pb-3">
                              <Calendar size={18} className={theme.text} />
                              <h4 className={`font-outfit font-black text-sm md:text-base ${theme.text} uppercase tracking-wider`}>
                                Álbumes por Fecha
                              </h4>
                            </div>

                            {monthsList.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <Calendar size={48} />
                                <p className={`mt-4 font-black uppercase tracking-widest text-xs text-center ${theme.text}`}>
                                  No hay recuerdos fechados
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                                {monthsList.map(monthKey => {
                                  const cover = getMonthCover(monthKey, globalItems);
                                  const monthItems = globalItems.filter(it => getMonthKey(it.date) === monthKey);

                                  return (
                                    <motion.div
                                      key={monthKey}
                                      whileHover={{ y: -4 }}
                                      onClick={() => {
                                        setGalleryFolder({ id: monthKey, name: getMonthLabel(monthKey), filterMonthKey: monthKey });
                                        setGalleryView('items');
                                      }}
                                      className="group bg-white/80 backdrop-blur-md rounded-[2rem] p-3.5 border border-white shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                                    >
                                      <div className={`w-full aspect-[4/3] rounded-2xl overflow-hidden relative ${theme.bgLight} border ${theme.borderAccent} shadow-inner`}>
                                        {cover ? (
                                          <img src={cover} alt={monthKey} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Clock size={28} className={`${theme.text}/20`} />
                                          </div>
                                        )}
                                      </div>

                                      <div className="mt-3 text-left">
                                        <h4 className={`font-outfit font-black text-xs md:text-sm ${theme.text}`}>
                                          {getMonthLabel(monthKey)}
                                        </h4>
                                        <span className={`text-[9px] md:text-[10px] ${theme.text}/50 font-bold uppercase tracking-wider block mt-1`}>
                                          {monthItems.length} {monthItems.length === 1 ? 'elemento' : 'elementos'}
                                        </span>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* VIEW: ITEMS GRID */}
                        {galleryView === 'items' && (
                          <motion.div
                            key="items"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.25 }}
                          >
                            {filteredItems.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-24 opacity-25">
                                {activeMediaTab === 'image' ? <Images size={64} /> : activeMediaTab === 'video' ? <Video size={64} /> : <Mic size={64} />}
                                <p className={`mt-4 font-black uppercase tracking-[0.2em] text-sm text-center ${theme.text}`}>
                                  No hay {activeMediaTab === 'image' ? 'imágenes' : activeMediaTab === 'video' ? 'videos' : 'audios'}
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-4">
                                {filteredItems.map((item) => (
                                  <motion.div
                                    key={item.id}
                                    whileHover={{ y: -3 }}
                                    onClick={() => setPreviewMediaItem(item)}
                                    className="group relative aspect-square bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-white/85 transition-all cursor-pointer"
                                  >
                                    {item.type === 'image' ? (
                                      <img src={item.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : item.type === 'video' ? (
                                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-955 relative">
                                        <Video className="text-white/45 mb-1" size={28} />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-md group-hover:scale-105 transition-transform">
                                            <Play size={16} fill="currentColor" className="ml-0.5" />
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center bg-white/40">
                                        <div className={`w-14 h-14 ${theme.bg} rounded-full flex items-center justify-center ${theme.text} mb-2 group-hover:scale-105 transition-transform shadow-inner`}>
                                          <Music size={24} />
                                        </div>
                                        <span className={`text-[8.5px] font-black ${theme.text} opacity-40 uppercase tracking-widest px-2.5 text-center truncate w-full`}>
                                          {item.title}
                                        </span>
                                      </div>
                                    )}
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                      <p className="text-[8px] font-black text-white uppercase tracking-widest">
                                        {new Date(item.date).toLocaleDateString('es-ES')}
                                      </p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}

                      </AnimatePresence>
                    </div>
                  );
                })()
              )}


              {/* TAB CALENDARIOS: MINIATURAS + COMPONENTE FULL SCREEN */}
              {activeTab === "calendarios" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={20} className={theme.text} />
                    <h3 className={`font-outfit font-black text-2xl ${theme.text}`}>Calendarios de Crecimiento</h3>
                  </div>

                  {calendars.length === 0 ? (
                    <div className={`bg-white/50 border ${theme.borderAccent} rounded-3xl p-12 text-center ${theme.text}/50 italic`}>
                      El calendario de hitos aún no ha sido configurado.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                      {calendars.map((cal) => (
                        <motion.div
                          key={cal.id}
                          whileHover={{ y: -6 }}
                          onClick={() => setSelectedCalendarId(cal.id)}
                          className={`bg-white rounded-[2rem] p-4 md:p-6 border ${theme.borderAccent} shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
                        >
                          <div className={`w-full h-32 md:h-40 rounded-2xl overflow-hidden relative ${theme.bgLight} border ${theme.borderAccent} shadow-inner`}>
                            {cal.layout_config?.thumbnail_url ? (
                              <img src={cal.layout_config.thumbnail_url} alt={cal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full">
                                <PregnancyCalendar
                                  variant="thumbnail"
                                  calendarId={cal.id}
                                  childId={childId}
                                  sectionId={activeStage.id}
                                  theme={theme}
                                  readOnly={true}
                                  onBack={() => {}}
                                />
                              </div>
                            )}
                          </div>

                          <div className="mt-4 flex justify-between items-center">
                            <div>
                              <h4 className={`font-outfit font-black text-sm ${theme.text} uppercase tracking-wider`}>{cal.title}</h4>
                              <p className={`text-[9px] md:text-[10px] ${theme.text}/50 font-bold uppercase tracking-widest mt-1`}>Ver Calendario Completo</p>
                            </div>
                            <CalendarDays size={18} className={theme.text} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB ALBUM: ESTANTE DE LIBROS PREMIUM 3D */}
              {activeTab === "album" && (() => {
                const showPregnancyBook = child.preview_config?.show_pregnancy_book !== false;
                const booksToDisplay = stages.map(stage => {
                  const isDefault = stage.id === null;
                  const pageCount = allAlbumPages.filter(p => p.section_id === stage.id).length;
                  const coverImage = isDefault 
                    ? (child.cover_image || child.photo_url || null) 
                    : (stage.baby_photo || null);
                  return {
                    id: stage.id,
                    title: isDefault ? "Diario de Embarazo" : stage.title,
                    subtitle: isDefault ? "La dulce espera" : "Etapa de Vida",
                    pageCount,
                    showInBooks: isDefault ? showPregnancyBook : stage.show_in_books !== false,
                    coverImage
                  };
                }).filter(book => book.showInBooks);

                const shelfSize = isMobile ? 2 : 3;
                const shelves: any[][] = [];
                for (let i = 0; i < booksToDisplay.length; i += shelfSize) {
                  shelves.push(booksToDisplay.slice(i, i + shelfSize));
                }

                return (
                  <div className="space-y-8 pb-12 select-none">
                    <div className="flex items-center gap-2">
                      <BookOpen size={20} className={theme.text} />
                      <h3 className={`font-outfit font-black text-2xl ${theme.text}`}>Biblioteca de Recuerdos</h3>
                    </div>

                    {booksToDisplay.length === 0 ? (
                      <div className={`bg-white/50 border ${theme.borderAccent} rounded-3xl p-12 text-center ${theme.text}/50 italic`}>
                        Aún no hay álbumes digitales visibles.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-12 md:gap-16 select-none max-w-4xl mx-auto w-full px-2">
                        {shelves.map((shelfBooks, shelfIdx) => (
                          <div key={shelfIdx} className="relative flex flex-col items-center">
                            
                            {/* Shelf books row */}
                            <div className="flex justify-around items-end w-full px-4 md:px-12 relative z-10 gap-4 md:gap-12 min-h-[220px] md:min-h-[300px]">
                              {shelfBooks.map((book) => {
                                const bookColor = theme.hex || "#9A8F80";
                                
                                return (
                                  <div key={book.id || "pregnancy"} className="flex flex-col items-center gap-4">
                                    <motion.div
                                      initial={{ opacity: 0, y: 30 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: shelfIdx * 0.1 }}
                                      whileHover={{ 
                                        y: -10, 
                                        rotateY: -6,
                                        scale: 1.03,
                                        transition: { duration: 0.2 }
                                      }}
                                      onClick={() => setSelectedPreviewBook({ id: book.id, title: book.title })}
                                      className="relative cursor-pointer w-28 h-40 md:w-36 md:h-52 rounded-r-xl shadow-2xl flex flex-col justify-between overflow-hidden group perspective"
                                      style={{
                                        background: book.coverImage
                                          ? `url('${getProxiedUrl(book.coverImage)}') center/cover no-repeat`
                                          : `linear-gradient(135deg, ${bookColor}dd 0%, ${bookColor} 100%)`,
                                        boxShadow: "5px 15px 35px rgba(0,0,0,0.25), -2px 0 5px rgba(255,255,255,0.15) inset"
                                      }}
                                    >
                                      {/* Leather texture overlay */}
                                      {book.coverImage && (
                                        <div className="absolute inset-0 bg-black/35 pointer-events-none z-0" />
                                      )}
                                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/0 to-black/30 pointer-events-none mix-blend-multiply" />
                                      <div className="absolute inset-0 bg-white/[0.03] opacity-40 mix-blend-overlay pointer-events-none" />
                                      
                                      {/* Book spine line shadow to make it 3D */}
                                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/30 via-white/10 to-transparent border-r border-black/10" />
                                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-black/20" />

                                      {/* Gold foil header/borders */}
                                      <div className="pt-4 px-3 text-center z-10">
                                        <div className="w-6 h-6 rounded-full border border-yellow-200/40 mx-auto flex items-center justify-center mb-1">
                                          <Bookmark size={12} className="text-yellow-200/70" />
                                        </div>
                                        <h3 className="font-serif font-bold text-[10px] md:text-xs text-yellow-100 tracking-tight leading-snug drop-shadow-md">
                                          {book.title}
                                        </h3>
                                        <p className="text-[7px] md:text-[8px] text-white/50 font-bold uppercase tracking-wider mt-0.5 font-outfit">
                                          {book.subtitle}
                                        </p>
                                      </div>

                                      {/* Cover embossed footer */}
                                      <div className="pb-3 px-3 text-center z-10">
                                        <div className="inline-block px-1.5 py-0.5 rounded bg-black/15 border border-white/10 text-[7px] md:text-[8px] text-yellow-100/90 font-outfit uppercase tracking-widest font-black">
                                          {book.pageCount} {book.pageCount === 1 ? "PÁGINA" : "PÁGINAS"}
                                        </div>
                                        <p className="text-[6.5px] text-white/30 uppercase tracking-widest mt-1.5 font-bold font-outfit truncate max-w-full">
                                          {child.name}
                                        </p>
                                      </div>

                                      {/* Page edge simulation on the right edge */}
                                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/25 rounded-r" />

                                      {/* Hover effect glow */}
                                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
                                    </motion.div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Thick Premium Wooden Shelf */}
                            <div 
                              className="w-full h-3 md:h-4 rounded-lg shadow-xl relative border-b border-amber-950/40"
                              style={{
                                background: "linear-gradient(to right, #78350f, #92400e, #78350f)",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                              }}
                            >
                              {/* Under shelf shadow line */}
                              <div className="absolute -bottom-6 left-0 right-0 h-6 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAB CONFIGURACIÓN (PADRES SOLAMENTE) */}
              {activeTab === "configuracion" && isParent && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white rounded-3xl p-6 md:p-8 border ${theme.borderAccent} shadow-sm space-y-8`}
                >
                  <div className={`flex items-center gap-3 border-b ${theme.borderAccent} pb-4`}>
                    <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
                      <Settings size={22} />
                    </div>
                    <div>
                      <h3 className={`font-outfit font-black text-xl ${theme.text}`}>Configuración Espejo</h3>
                      <p className={`text-xs ${theme.text}/50 font-bold uppercase tracking-wider`}>Replica de datos y visibilidad para visitantes en tiempo real</p>
                    </div>
                  </div>

                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                      <div className="col-span-2 md:col-span-1">
                        <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text}/60`}>Nombre Real</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border ${theme.borderAccent} rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} style={{ ['--tw-ring-color' as any]: theme.hex }} />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text}/60`}>Apodo</label>
                        <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border ${theme.borderAccent} rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} style={{ ['--tw-ring-color' as any]: theme.hex }} />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text}/60`}>Estado del Bebé</label>
                        <select 
                          name="status" 
                          value={formData.preview_config?.status || "pregnancy"} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              preview_config: {
                                ...prev.preview_config,
                                status: val
                              }
                            }));
                          }} 
                          className={`w-full px-4 py-2.5 bg-white border ${theme.borderAccent} rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm appearance-none ${theme.text}`}
                          style={{ ['--tw-ring-color' as any]: theme.hex }}
                        >
                          <option value="pregnancy">En Gestación (Embarazo)</option>
                          <option value="born">Ya Nacido</option>
                        </select>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text}/60`}>FUM (Última Regla)</label>
                        <input 
                          type="date" 
                          name="fum" 
                          value={formData.preview_config?.fum || ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              preview_config: {
                                ...prev.preview_config,
                                fum: val
                              }
                            }));
                          }} 
                          className={`w-full px-4 py-2.5 bg-white border ${theme.borderAccent} rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} 
                          style={{ ['--tw-ring-color' as any]: theme.hex }}
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text}/60`}>Género</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border ${theme.borderAccent} rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} style={{ ['--tw-ring-color' as any]: theme.hex }}>
                          <option value="">Seleccionar...</option>
                          <option value="boy">Niño</option>
                          <option value="girl">Niña</option>
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-1">
                        <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text}/60`}>Fecha Nac.</label>
                        <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border ${theme.borderAccent} rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} style={{ ['--tw-ring-color' as any]: theme.hex }} />
                      </div>

                      <div className="col-span-1">
                        <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text}/60`}>Peso</label>
                        <input type="text" name="weight" value={formData.weight} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border ${theme.borderAccent} rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} style={{ ['--tw-ring-color' as any]: theme.hex }} />
                      </div>

                      <div className="col-span-1">
                        <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text}/60`}>Estatura</label>
                        <input type="text" name="height" value={formData.height} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border ${theme.borderAccent} rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} style={{ ['--tw-ring-color' as any]: theme.hex }} />
                      </div>

                      <div className="col-span-2">
                        <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.text}/60`}>Lugar/Hospital</label>
                        <input type="text" name="birth_hospital" value={formData.birth_hospital} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border ${theme.borderAccent} rounded-xl outline-none focus:ring-2 focus:ring-opacity-20 text-sm font-outfit shadow-sm ${theme.text}`} style={{ ['--tw-ring-color' as any]: theme.hex }} />
                      </div>
                    </div>

                    {/* Color del Tema */}
                    <div className={`border-t ${theme.borderAccent} pt-4`}>
                      <label className={`block text-[9px] font-bold uppercase tracking-wider mb-2 ${theme.text}/60`}>Tema de Color</label>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(themePalettes).map(([key, pal]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, theme_color: key }))}
                            className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-[3px] transition-transform ${formData.theme_color === key ? `border-white ring-2 ${pal.text.replace('text-', 'ring-')}/30 scale-110` : 'border-transparent hover:scale-110'} ${pal.bg}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Compartibilidad y Código */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 border-t ${theme.borderAccent} pt-6`}>
                      <div className={`p-4 rounded-2xl flex flex-col justify-between ${theme.bgLight}`}>
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${theme.text} block mb-1`}>Código de Acceso Único</span>
                          <span className={`text-[11px] ${theme.text}/60 block mb-3`}>Úsalo para compartir y entrar sin contraseña.</span>
                        </div>
                        <div className="flex gap-2">
                          <input type="text" readOnly value={formData.access_code} className={`flex-1 px-4 py-2 bg-white border ${theme.borderAccent} rounded-xl outline-none text-sm text-center font-black tracking-widest ${theme.text} uppercase`} />
                          <button type="button" onClick={generateAccessCode} className={`px-4 py-2 bg-white border ${theme.borderAccent} rounded-xl text-xs font-black uppercase ${theme.text} hover:${theme.bgLight} transition-colors`}>Generar</button>
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl flex flex-col justify-between ${theme.bgLight}`}>
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${theme.text} block mb-1`}>Enlace y Código QR</span>
                          <span className={`text-[11px] ${theme.text}/60 block mb-3`}>Enlace directo a esta Preview de invitado.</span>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            setToastMessage("¡Enlace copiado!");
                            setTimeout(() => setToastMessage(""), 3000);
                          }} className={`flex-1 py-2.5 bg-white border ${theme.borderAccent} rounded-xl text-xs font-black uppercase ${theme.text} hover:${theme.bgLight} flex items-center justify-center gap-1`}><Copy size={14}/> Copiar Link</button>
                          <button type="button" onClick={() => {
                            if (!formData.access_code) {
                              setToastMessage("Genera un código primero");
                              setTimeout(() => setToastMessage(""), 3000);
                              return;
                            }
                            setShowQRModal(true);
                          }} className={`px-4 py-2.5 bg-white border ${theme.borderAccent} rounded-xl text-xs font-black uppercase ${theme.text} hover:${theme.bgLight} flex items-center justify-center`}><QrCode size={16}/></button>
                        </div>
                      </div>
                    </div>

                    {/* Visibilidad Switches */}
                    <div className={`${theme.bgLight} p-5 rounded-2xl`}>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${theme.text} block mb-3`}>Permisos de Visualización Pública</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className={`flex items-center justify-between p-3 bg-white rounded-xl border ${theme.borderAccent}`}>
                          <span className={`text-xs font-bold uppercase tracking-wider ${theme.text}`}>Embarazo</span>
                          <button type="button" onClick={() => handleTogglePermission("show_pregnancy")} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-300" style={{ backgroundColor: formData.preview_config?.show_pregnancy ? theme.hex : '#E5E7EB' }}><div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_pregnancy ? 'translate-x-4' : 'translate-x-0'}`} /></button>
                        </div>

                        <div className={`flex items-center justify-between p-3 bg-white rounded-xl border ${theme.borderAccent}`}>
                          <span className={`text-xs font-bold uppercase tracking-wider ${theme.text}`}>Galería</span>
                          <button type="button" onClick={() => handleTogglePermission("show_gallery")} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-300" style={{ backgroundColor: formData.preview_config?.show_gallery ? theme.hex : '#E5E7EB' }}><div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_gallery ? 'translate-x-4' : 'translate-x-0'}`} /></button>
                        </div>

                        <div className={`flex items-center justify-between p-3 bg-white rounded-xl border ${theme.borderAccent}`}>
                          <span className={`text-xs font-bold uppercase tracking-wider ${theme.text}`}>Calendarios</span>
                          <button type="button" onClick={() => handleTogglePermission("show_calendars")} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-300" style={{ backgroundColor: formData.preview_config?.show_calendars ? theme.hex : '#E5E7EB' }}><div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_calendars ? 'translate-x-4' : 'translate-x-0'}`} /></button>
                        </div>

                        <div className={`flex items-center justify-between p-3 bg-white rounded-xl border ${theme.borderAccent}`}>
                          <span className={`text-xs font-bold uppercase tracking-wider ${theme.text}`}>Libro</span>
                          <button type="button" onClick={() => handleTogglePermission("show_album")} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-300" style={{ backgroundColor: formData.preview_config?.show_album ? theme.hex : '#E5E7EB' }}><div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.preview_config?.show_album ? 'translate-x-4' : 'translate-x-0'}`} /></button>
                        </div>
                      </div>
                    </div>

                    <div className={`flex justify-end border-t ${theme.borderAccent} pt-4`}>
                      <button 
                        type="submit" 
                        disabled={saving}
                        className={`w-full md:w-64 py-3 ${theme.primaryBg} ${theme.textActive} ${theme.hoverBg} rounded-full font-bold shadow-md active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer`}
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <>Guardar Todo</>}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </motion.div>
          )}
          </AnimatePresence>

              {/* Unified Media Preview Overlay Modal */}
      <AnimatePresence>
        {previewMediaItem && (
          <div 
            className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-black/98"
            onClick={() => setPreviewMediaItem(null)}
          >
            {/* Cabecera superior: Título, fecha y botón Cerrar al lado */}
            <div 
              className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between px-6 z-[2100]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col text-left max-w-[70%]">
                <h3 className="text-white text-base md:text-xl font-bold tracking-tight line-clamp-1 italic">
                  {previewMediaItem.title || "Recuerdo"}
                </h3>
                <span className="text-white/50 text-[10px] md:text-xs font-black uppercase tracking-wider mt-0.5">
                  {new Date(previewMediaItem.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Botón de Zoom */}
                <button
                  onClick={toggleZoom}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer hover:scale-110 active:scale-95"
                  title={zoom > 1 ? "Alejar" : "Acercar"}
                >
                  {zoom > 1 ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                </button>

                {/* Botón Cerrar */}
                <button
                  onClick={() => setPreviewMediaItem(null)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer hover:scale-110 active:scale-95"
                  title="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contenedor del video/imagen con soporte de scroll cuando hay zoom */}
            <div 
              className="w-full h-full flex items-center justify-center overflow-auto p-4 md:p-12"
              onClick={() => setPreviewMediaItem(null)}
            >
              <div 
                className="relative flex items-center justify-center max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                {previewMediaItem.type === 'image' ? (
                  <>
                    <img 
                      src={previewMediaItem.url} 
                      className="max-w-full max-h-[82vh] rounded-lg object-contain shadow-2xl transition-transform duration-300 select-none" 
                      style={{ transform: `scale(${zoom})`, transformOrigin: "center center", cursor: zoom > 1 ? "zoom-out" : "zoom-in" }}
                      alt="Vista previa"
                      onDoubleClick={toggleZoom}
                    />
                    {zoom === 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadMedia(previewMediaItem.url, previewMediaItem.title); }}
                        className="absolute bottom-4 right-4 w-12 h-12 bg-black/60 hover:bg-black/85 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/20 flex items-center justify-center z-45 cursor-pointer backdrop-blur-sm shadow-black/40"
                        title="Descargar"
                      >
                        <Download size={20} strokeWidth={2.5} />
                      </button>
                    )}
                  </>
                ) : previewMediaItem.type === 'video' ? (
                  <>
                    <video 
                      src={previewMediaItem.url} 
                      className="max-w-full max-h-[82vh] rounded-lg shadow-2xl transition-transform duration-300" 
                      style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                      controls 
                      autoPlay 
                    />
                    {zoom === 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadMedia(previewMediaItem.url, previewMediaItem.title); }}
                        className="absolute bottom-4 right-4 w-12 h-12 bg-black/60 hover:bg-black/85 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/20 flex items-center justify-center z-45 cursor-pointer backdrop-blur-sm shadow-black/40"
                        title="Descargar"
                      >
                        <Download size={20} strokeWidth={2.5} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-[320px] md:w-[480px] p-8 bg-white/10 backdrop-blur-md flex flex-col items-center justify-center border border-white/20 rounded-[2.5rem] shadow-2xl relative">
                    <div className={`w-20 h-20 ${theme.bg} ${theme.text} rounded-full flex items-center justify-center mb-6 shadow-xl`}>
                      <Music size={40} />
                    </div>
                    <audio src={previewMediaItem.url} controls className="w-full" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadMedia(previewMediaItem.url, previewMediaItem.title); }}
                      className="absolute top-4 right-4 w-12 h-12 bg-black/60 hover:bg-black/85 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/25 flex items-center justify-center z-20 cursor-pointer backdrop-blur-sm shadow-black/40"
                      title="Descargar"
                    >
                      <Download size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Flechas de navegación flotantes a los lados de la pantalla */}
            {(() => {
              const items = getGlobalMediaItems().filter(it => it.type === activeMediaTab);
              const idx = items.findIndex(it => it.id === previewMediaItem.id);
              return idx > 0 ? (
                <button
                  onClick={(e) => { e.stopPropagation(); showPrevPreviewItem(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3.5 bg-black/50 hover:bg-black/75 rounded-full text-white transition-colors cursor-pointer z-50 hover:scale-110"
                  title="Anterior"
                >
                  <ChevronLeft size={26} strokeWidth={2.5} />
                </button>
              ) : null;
            })()}

            {(() => {
              const items = getGlobalMediaItems().filter(it => it.type === activeMediaTab);
              const idx = items.findIndex(it => it.id === previewMediaItem.id);
              return idx !== -1 && idx < items.length - 1 ? (
                <button
                  onClick={(e) => { e.stopPropagation(); showNextPreviewItem(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 bg-black/50 hover:bg-black/75 rounded-full text-white transition-colors cursor-pointer z-50 hover:scale-110"
                  title="Siguiente"
                >
                  <ChevronRight size={26} strokeWidth={2.5} />
                </button>
              ) : null;
            })()}
          </div>
        )}
      </AnimatePresence>

          </div>
        </main>

      </div>

      {/* Calendar Full Screen Overlay Modal */}
      <AnimatePresence>
        {selectedCalendarId && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className={`fixed inset-0 z-[2000] ${theme.bg} flex flex-col overflow-hidden`}
          >
            <PregnancyCalendar
              childId={childId}
              calendarId={selectedCalendarId}
              sectionId={activeStage.id}
              theme={theme}
              readOnly={true}
              onBack={() => setSelectedCalendarId(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Detalle de Recuerdo en Preview */}
      <AnimatePresence>
        {selectedPreviewMemory && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPreviewMemory(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl p-6 md:p-8 shadow-2xl relative border border-gray-100 z-10 flex flex-col max-h-[85vh] overflow-hidden text-left"
            >
              <button 
                onClick={() => setSelectedPreviewMemory(null)}
                className={`absolute top-6 right-6 p-2 hover:bg-gray-50 rounded-full transition-colors z-20`}
              >
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>

              {/* Title & Metadata */}
              <div className="mb-4 pr-10">
                <div className="flex items-center gap-2 mb-1.5">
                  {selectedPreviewMemory.month_number && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${theme.hex}1a`, color: theme.hex }}>
                      Mes {selectedPreviewMemory.month_number}
                    </span>
                  )}
                  {selectedPreviewMemory.memory_date && (
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      {new Date(selectedPreviewMemory.memory_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <h3 className={`font-outfit font-black text-2xl md:text-3xl ${theme.text} leading-tight`}>
                  {selectedPreviewMemory.title}
                </h3>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6 min-h-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Media Gallery / Grid inside Modal */}
                {selectedPreviewMemory.media_urls && selectedPreviewMemory.media_urls.filter(Boolean).length > 0 && (
                  <div className={`grid gap-4 ${
                    selectedPreviewMemory.media_urls.filter(Boolean).length === 1 
                      ? 'grid-cols-1' 
                      : 'grid-cols-2'
                  }`}>
                    {selectedPreviewMemory.media_urls.filter(Boolean).map((url: string, index: number) => {
                      const lower = url.toLowerCase();
                      const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.m4v') || lower.includes('video/');
                      const isAudio = lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.aac') || lower.includes('audio/');

                      return (
                        <div key={index} className="relative group rounded-3xl overflow-hidden shadow-sm border border-gray-100 aspect-video md:aspect-[4/3] bg-gray-50">
                          {isVideo ? (
                            <video 
                              src={getProxiedUrl(url) + "#t=0.5"} 
                              controls 
                              className="w-full h-full object-cover" 
                              muted 
                              playsInline 
                              preload="metadata"
                              crossOrigin="anonymous"
                            />
                          ) : isAudio ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-sage/5 gap-3">
                              <div className={`w-14 h-14 rounded-full ${theme.bg} ${theme.text} flex items-center justify-center shadow-inner`}>
                                <Mic size={24} />
                              </div>
                              <audio src={getProxiedUrl(url)} controls className="w-full" />
                            </div>
                          ) : (
                            <>
                              <img 
                                src={getProxiedUrl(url)} 
                                alt={selectedPreviewMemory.title} 
                                className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500" 
                                onClick={() => openLightbox(selectedPreviewMemory.media_urls.filter(Boolean), index)}
                              />
                              <button
                                onClick={() => downloadMedia(url, `${selectedPreviewMemory.title}-${index}`)}
                                className="absolute bottom-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 shadow-md opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all"
                                title="Descargar Imagen"
                              >
                                <Download size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Description */}
                {selectedPreviewMemory.description && (
                  <div className="bg-gray-50/70 p-5 rounded-[2rem] border border-gray-100">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-2">Detalles / Anécdota</span>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line font-outfit">
                      {selectedPreviewMemory.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ultra-fine horizontal scrollbar styles for Memories Slider */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-slider-scrollbar::-webkit-scrollbar {
          height: 3px !important;
        }
        .custom-slider-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02) !important;
          border-radius: 10px !important;
        }
        .custom-slider-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme.hex}50 !important;
          border-radius: 10px !important;
        }
        .custom-slider-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme.hex}80 !important;
        }
        .custom-slider-scrollbar {
          scrollbar-width: thin !important;
          scrollbar-color: ${theme.hex}50 transparent !important;
        }
      `}} />

    </div>
  );
}
