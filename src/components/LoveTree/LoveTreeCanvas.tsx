"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Mail, Send, X, Leaf, Heart, TreeDeciduous } from "lucide-react";
import AppButton from "@/components/Common/AppButton";
import styles from "./LoveTreeCanvas.module.css";

interface LoveTreeCanvasProps {
  child: any;
}

/* ---------------- Seeded RNG (posiciones/colores estables entre recargas) ---------------- */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260921);
const between = (a: number, b: number) => a + rnd() * (b - a);

const LEAF_COLORS = ["#2F8F7A", "#3FA796", "#4FB286", "#6CC24A", "#8FD14F", "#1F6F5C", "#57B894", "#7BC96F"];

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
function lighten(hex: string, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

const CANOPY_CX = 50, CANOPY_CY = 38, CANOPY_RX = 37, CANOPY_RY = 28;
const MIN_GAP = 4.3;   // % de separación mínima centro a centro
const TARGET_COUNT = 96;

function candidateFromDistribution() {
  const roll = rnd();
  if (roll < 0.70) {
    // Uniform in ellipse but pushed slightly outward
    const ang = rnd() * Math.PI * 2;
    const rad = Math.pow(rnd(), 0.4) * 0.95; // pow(x, 0.4) pushes values closer to 1
    return [CANOPY_CX + Math.cos(ang) * CANOPY_RX * rad, CANOPY_CY + Math.sin(ang) * CANOPY_RY * rad];
  }
  if (roll < 0.90) {
    // Uniform spread in a wider area
    const ang = rnd() * Math.PI * 2;
    const rad = Math.sqrt(rnd()) * 0.8;
    return [CANOPY_CX + Math.cos(ang) * CANOPY_RX * rad, CANOPY_CY + Math.sin(ang) * CANOPY_RY * rad];
  }
  const forks = [[50, 48], [40, 47], [60, 46]];
  const f = forks[Math.floor(rnd() * forks.length)];
  const ang = rnd() * Math.PI * 2;
  const rad = rnd() * 0.8;
  return [f[0] + Math.cos(ang) * 9, f[1] + Math.sin(ang) * 7 * rad];
}

function samplePoints() {
  const pts: number[][] = [];
  let tries = 0;
  while (pts.length < TARGET_COUNT && tries < TARGET_COUNT * 90) {
    tries++;
    const [x, y] = candidateFromDistribution();
    let ok = true;
    for (let j = 0; j < pts.length; j++) {
      const dx = x - pts[j][0], dy = y - pts[j][1];
      if (Math.hypot(dx, dy) < MIN_GAP) { ok = false; break; }
    }
    if (ok) pts.push([x, y]);
  }
  return pts;
}

// Generamos los datos estáticos de los nodos
const INITIAL_NODES = samplePoints().map((pt, idx) => {
  const i = idx + 1;
  const x = pt[0], y = pt[1];
  const distFromCenter = Math.hypot((x - CANOPY_CX) / CANOPY_RX, (y - CANOPY_CY) / CANOPY_RY);

  const id = "leaf-" + i;
  const color = LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)];
  // Revertimos tamaño
  const size = between(40, 66) * (1 - Math.min(distFromCenter, 1) * 0.18);
  const rot = between(-30, 30);
  const erot = between(-3, 3);
  const envMain = color;
  const envLight = lighten(color, 0.55);
  const baseZ = Math.round((y + rnd() * 6) * 10);

  return { id, x, y, size, rot, erot, envMain, envLight, color, baseZ };
});


export default function LoveTreeCanvas({ child }: LoveTreeCanvasProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const [activeLeaf, setActiveLeaf] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewMessage, setViewMessage] = useState<any | null>(null);
  const [justPlanted, setJustPlanted] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  
  const zoomState = useRef({ zoom: 1, panX: 0, panY: 0 });
  const ZOOM_MIN = 0.6, ZOOM_MAX = 2.6;

  // Touch and drag refs
  const dragState = useRef({
    dragging: false,
    dragStartX: 0, dragStartY: 0,
    panStartX: 0, panStartY: 0,
    touchMode: null as "pinch" | "leaf-drag" | "pan" | null,
    pinchStartDist: 0,
    pinchStartZoom: 1,
    panTouchStartX: 0, panTouchStartY: 0,
    touchActiveId: null as string | null
  });

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
    setShowWelcome(true);

    // Apple Watch magnifying effect loop
    let rafId: number;
    const updateMagnification = () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const maxDist = Math.max(window.innerWidth, window.innerHeight) / 1.5;

      const nodes = document.querySelectorAll(`.${styles.nodePos}`);
      nodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const nodeCx = rect.left + rect.width / 2;
        const nodeCy = rect.top + rect.height / 2;
        
        const dist = Math.hypot(nodeCx - cx, nodeCy - cy);
        
        let dynamicScale = 1.3 - (dist / maxDist) * 0.8;
        dynamicScale = Math.max(0.4, Math.min(1.3, dynamicScale));
        
        (node as HTMLElement).style.setProperty('--watch-scale', dynamicScale.toFixed(3));
      });
      
      rafId = requestAnimationFrame(updateMagnification);
    };
    
    rafId = requestAnimationFrame(updateMagnification);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const loadMessages = async () => {
    const { data } = await supabase.from("love_messages").select("*").eq("child_id", child.id);
    if (data) setMessages(data);
  };

  const closeWelcome = () => {
    setShowWelcome(false);
  };

  const applyTransform = () => {
    if (viewportRef.current) {
      viewportRef.current.style.setProperty("--zoom", zoomState.current.zoom.toString());
      viewportRef.current.style.setProperty("--px", zoomState.current.panX + "px");
      viewportRef.current.style.setProperty("--py", zoomState.current.panY + "px");
    }
  };

  const setZoom = (newZoom: number, animate: boolean) => {
    zoomState.current.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom));
    if (animate && viewportRef.current) {
      viewportRef.current.classList.add(styles.animating);
      setTimeout(() => viewportRef.current?.classList.remove(styles.animating), 460);
    }
    applyTransform();
  };

  const handleZoomIn = () => setZoom(zoomState.current.zoom + 0.25, true);
  const handleZoomOut = () => setZoom(zoomState.current.zoom - 0.25, true);
  const handleZoomReset = () => {
    zoomState.current = { zoom: 1, panX: 0, panY: 0 };
    setZoom(1, true);
  };

  // Stage Mouse Events
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.12 : 0.12;
    setZoom(zoomState.current.zoom + delta, false);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if ((e.target as HTMLElement).closest(`.${styles.node}`)) return;
    dragState.current.dragging = true;
    stageRef.current?.classList.add(styles.dragging);
    dragState.current.dragStartX = e.clientX;
    dragState.current.dragStartY = e.clientY;
    dragState.current.panStartX = zoomState.current.panX;
    dragState.current.panStartY = zoomState.current.panY;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    zoomState.current.panX = dragState.current.panStartX + (e.clientX - dragState.current.dragStartX);
    zoomState.current.panY = dragState.current.panStartY + (e.clientY - dragState.current.dragStartY);
    applyTransform();
  };

  const onPointerUp = () => {
    dragState.current.dragging = false;
    stageRef.current?.classList.remove(styles.dragging);
  };

  // Touch Events
  const touchDist = (t0: React.Touch, t1: React.Touch) => Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      dragState.current.touchMode = "pinch";
      dragState.current.pinchStartDist = touchDist(e.touches[0], e.touches[1]);
      dragState.current.pinchStartZoom = zoomState.current.zoom;
      
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      dragState.current.panTouchStartX = cx;
      dragState.current.panTouchStartY = cy;
      
      setHoveredNode(null);
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      dragState.current.touchMode = "pan";
      dragState.current.panTouchStartX = t.clientX;
      dragState.current.panTouchStartY = t.clientY;
      dragState.current.panStartX = zoomState.current.panX;
      dragState.current.panStartY = zoomState.current.panY;
      
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const nodeEl = el?.closest(`.${styles.node}`);
      dragState.current.touchActiveId = nodeEl ? (nodeEl as HTMLElement).dataset.id || null : null;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (dragState.current.touchMode === "pinch" && e.touches.length === 2) {
      const d = touchDist(e.touches[0], e.touches[1]);
      const factor = d / (dragState.current.pinchStartDist || d);
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, dragState.current.pinchStartZoom * factor));
      
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      const rect = stageRef.current?.getBoundingClientRect();
      if (rect) {
        const scx = rect.left + rect.width / 2;
        const scy = rect.top + rect.height / 2;
        
        const dx = cx - scx;
        const dy = cy - scy;
        
        const zoomRatio = newZoom / zoomState.current.zoom;
        zoomState.current.panX = zoomState.current.panX - dx * (zoomRatio - 1) + (cx - dragState.current.panTouchStartX);
        zoomState.current.panY = zoomState.current.panY - dy * (zoomRatio - 1) + (cy - dragState.current.panTouchStartY);
        
        dragState.current.panTouchStartX = cx;
        dragState.current.panTouchStartY = cy;
      }
      
      zoomState.current.zoom = newZoom;
      applyTransform();
    } else if (dragState.current.touchMode === "pan" && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - dragState.current.panTouchStartX;
      const dy = t.clientY - dragState.current.panTouchStartY;
      
      zoomState.current.panX = dragState.current.panStartX + dx;
      zoomState.current.panY = dragState.current.panStartY + dy;
      applyTransform();

      if (Math.hypot(dx, dy) > 10) {
        dragState.current.touchActiveId = null;
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (dragState.current.touchMode === "pan" && dragState.current.touchActiveId && e.touches.length === 0) {
      handleLeafClick(dragState.current.touchActiveId);
    }
    dragState.current.touchMode = null;
    dragState.current.touchActiveId = null;
    setHoveredNode(null);
  };

  const handleLeafClick = (leafId: string) => {
    const existingMessage = messages.find(m => m.leaf_id === leafId);
    if (existingMessage) {
      setViewMessage(existingMessage);
    } else {
      setActiveLeaf(leafId);
      setAuthorName("");
      setMessage("");
    }
  };

  const saveMessage = async () => {
    if (!authorName.trim() || !message.trim() || !activeLeaf) return;

    setIsSaving(true);
    try {
      const newMsg = {
        child_id: child.id,
        leaf_id: activeLeaf,
        author_name: authorName,
        message: message
      };

      const { error } = await supabase.from("love_messages").insert([newMsg]);
      if (error) throw error;
      
      setJustPlanted(activeLeaf);
      setTimeout(() => setJustPlanted(null), 2000);

      await loadMessages();
      setActiveLeaf(null);
    } catch (err) {
      alert("Error al guardar. Tal vez alguien más ocupó esta hoja.");
      loadMessages();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#eef4e7] to-[#f8f2e2]">
      
      <div 
        ref={stageRef}
        className={styles.stage}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div ref={viewportRef} className={styles.viewport}>
          <div className={styles.groundShadow} />
          <div className={styles.canopyGlow} />
          <svg className={styles.trunkSvg} viewBox="0 0 200 320" preserveAspectRatio="xMidYMax meet">
            <defs>
              <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5c3b26"/>
                <stop offset="50%" stopColor="#8a5c3a"/>
                <stop offset="100%" stopColor="#5c3b26"/>
              </linearGradient>
            </defs>
            <g fill="none" stroke="url(#trunkGrad)" strokeLinecap="round" strokeLinejoin="round">
              <path d="M100,322 C99,270 98,222 100,182" strokeWidth="34"/>
              <path d="M100,182 C92,160 76,140 60,122" strokeWidth="22"/>
              <path d="M100,182 C108,158 126,138 144,118" strokeWidth="22"/>
              <path d="M100,182 C101,148 102,112 103,78" strokeWidth="17"/>
              <path d="M60,122 C46,104 32,90 24,76" strokeWidth="12"/>
              <path d="M60,122 C68,102 76,86 84,68" strokeWidth="11"/>
              <path d="M144,118 C158,98 168,84 176,68" strokeWidth="11"/>
              <path d="M144,118 C134,98 126,80 118,58" strokeWidth="11"/>
            </g>
          </svg>

          <div className={styles.canopy}>
            {INITIAL_NODES.map((node) => {
              const isOccupied = messages.find(m => m.leaf_id === node.id);
              const isHovered = hoveredNode === node.id;
              const isJustPlanted = justPlanted === node.id;

              return (
                <div 
                  key={node.id}
                  className={styles.nodePos}
                  style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: isOccupied ? 5000 : node.baseZ }}
                >
                  <div 
                    data-id={node.id}
                    className={`${styles.node} ${isOccupied ? styles.flipped : ''} ${isOccupied ? styles.isLetter : ''} ${isJustPlanted ? styles.justPlanted : ''}`}
                    style={{ 
                      width: node.size, height: node.size * 1.05, 
                      '--rot': `${node.rot}deg`, 
                      '--erot': `${node.erot}deg`,
                      '--hover': isHovered ? 1.32 : 1 
                    } as any}
                    onClick={() => handleLeafClick(node.id)}
                    onPointerEnter={(e) => { if (e.pointerType !== "touch") setHoveredNode(node.id) }}
                    onPointerLeave={(e) => { if (e.pointerType !== "touch") setHoveredNode(null) }}
                    tabIndex={0}
                    role="button"
                  >
                    <div className={styles.nodeInner}>
                      <div className={`${styles.face} ${styles.leafFace}`}>
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <path d="M50 6 C78 20 92 46 78 76 C68 94 50 96 50 96 C50 96 32 94 22 76 C8 46 22 20 50 6 Z" fill={node.color}/>
                          <path d="M50 10 L50 90" stroke="rgba(0,0,0,.18)" strokeWidth="2" fill="none"/>
                        </svg>
                      </div>
                      <div className={`${styles.face} ${styles.envelopeFace}`}>
                        <div className={styles.envelope} style={{ '--env-main': node.envMain, '--env-light': node.envLight } as any}>
                          <div className={styles.envelopeBody} />
                          <div className={styles.envelopeFlap} />
                          <div className={styles.envelopeSeal} />
                          {isOccupied && (
                            <span 
                              className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest w-[80%] text-center truncate text-white drop-shadow-sm z-10"
                              style={{ color: node.envMain }}
                            >
                              {isOccupied.author_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.zoomControls}>
        <button onClick={handleZoomIn} aria-label="Acercar">+</button>
        <button onClick={handleZoomOut} aria-label="Alejar">–</button>
        <button onClick={handleZoomReset} aria-label="Restablecer">⟳</button>
      </div>

      {/* MODAL BIENVENIDA */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-md text-center shadow-2xl border-4 border-[#2f8f7a]/30"
            >
              <div className="w-24 h-24 bg-[#eef4e7] text-[#2f8f7a] rounded-full flex items-center justify-center mx-auto mb-6">
                <TreeDeciduous size={40} />
              </div>
              <h2 className="text-2xl font-black text-stone-800 mb-4 font-outfit">
                El Arbol de Mensajes
              </h2>
              <p className="text-stone-600 font-bold mb-8 text-sm">
                ¡Navega por el arbol haz zoom y selecciona alguna hoja donde quieras dejar tu mensaje, lo guardaremos para siempre!
              </p>
              <AppButton variant="primary" className="w-full py-4 text-sm bg-[#2f8f7a] hover:bg-[#267a68] border-none text-white" onClick={closeWelcome}>
                ¡Comenzar a Explorar!
              </AppButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ESCRIBIR MENSAJE */}
      <AnimatePresence>
        {activeLeaf && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#fffdf7] rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-[#3a3221] flex items-center gap-2 font-outfit">
                  <Leaf className="text-[#2f8f7a]" /> Nueva Hoja
                </h2>
                <button onClick={() => setActiveLeaf(null)} className="p-2 text-stone-400 hover:text-[#3a3221] bg-stone-100 rounded-full transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">¿Quién escribe?</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Abuela, Tío Juan, Padrino..."
                    className="w-full mt-1 bg-[#fbf9f2] border border-[#ddd3ba] rounded-2xl p-4 font-bold text-stone-700 outline-none focus:border-[#2f8f7a] focus:ring-4 focus:ring-[#2f8f7a]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Tu mensaje de amor</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe algo hermoso aquí..."
                    className="w-full mt-1 bg-[#fbf9f2] border border-[#ddd3ba] rounded-2xl p-4 font-bold text-stone-700 outline-none focus:border-[#2f8f7a] focus:ring-4 focus:ring-[#2f8f7a]/10 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="mt-8">
                <AppButton
                  variant="primary"
                  className="w-full bg-[#2f8f7a] hover:bg-[#267a68] border-none text-white shadow-lg"
                  icon={<Send size={18} />}
                  onClick={saveMessage}
                  loading={isSaving}
                  disabled={!authorName.trim() || !message.trim()}
                >
                  Guardar Mensaje en el Árbol
                </AppButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL LEER MENSAJE */}
      <AnimatePresence>
        {viewMessage && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setViewMessage(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotate: 5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FFFDF8] rounded-[1.5rem] p-8 max-w-sm w-full shadow-2xl relative border-2 border-[#ddd3ba]"
            >
              {/* Sello de cera simulado */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#c9862a] rounded-full shadow-lg border-2 border-[#e2a63d] flex items-center justify-center text-white rotate-12">
                <Heart size={20} fill="currentColor" />
              </div>
              
              <div className="text-center mb-6">
                <Mail size={32} className="mx-auto text-amber-500 mb-2 opacity-50" />
                <h3 className="font-outfit font-black text-2xl text-stone-800">{viewMessage.author_name}</h3>
              </div>

              <div className="relative">
                <p className="font-quicksand font-bold text-lg text-stone-700 italic leading-relaxed text-center">
                  "{viewMessage.message}"
                </p>
              </div>

              <button 
                onClick={() => setViewMessage(null)}
                className="mt-8 w-full p-4 bg-stone-100 hover:bg-stone-200 text-[#a15a3a] font-black text-xs uppercase tracking-widest rounded-xl transition-colors"
              >
                Cerrar Carta
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
