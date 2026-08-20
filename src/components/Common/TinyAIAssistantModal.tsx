"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Sparkles, Bot, Send, X, Loader2, Heart, MessageSquare, 
  Trash2, Copy, Check, Settings, Key, Calendar, Baby,
  Lightbulb, AlertCircle, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface TinyAIAssistantModalProps {
  theme?: any;
  childName?: string;
  child?: any;
}

interface Message {
  role: "user" | "ai";
  text: string;
  isAiGenerated?: boolean;
  stageAnalyzed?: string;
}

// Función para calcular con exactitud semanas y días de gestación a partir de FUM
function calculateGestation(fumStr?: string) {
  if (!fumStr) return null;
  const parts = fumStr.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return null;
  const fumDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const diffTime = now.getTime() - fumDate.getTime();
  if (diffTime < 0) return null;
  
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;
  const fpp = new Date(fumDate.getTime() + 280 * 24 * 60 * 60 * 1000);
  const trimester = weeks <= 13 ? 1 : weeks <= 27 ? 2 : 3;

  return {
    weeks: Math.max(1, Math.min(42, weeks)),
    days,
    trimester,
    fpp: fpp.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
    rawDays: diffDays
  };
}

// Función para calcular edad de bebé nacido
function calculateBabyAge(birthDateStr?: string) {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  const now = new Date();
  const diffTime = now.getTime() - birth.getTime();
  if (diffTime < 0) return null;

  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
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

  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  const parts: string[] = [];
  if (years > 0) parts.push(years === 1 ? "1 año" : `${years} años`);
  if (months > 0) parts.push(months === 1 ? "1 mes" : `${months} meses`);
  if (years === 0 && weeks > 0) parts.push(weeks === 1 ? "1 semana" : `${weeks} semanas`);
  if (years === 0 && months === 0 && remDays > 0) parts.push(remDays === 1 ? "1 día" : `${remDays} días`);

  return {
    formattedAge: parts.length > 0 ? parts.join(" y ") : "Recién nacido",
    totalDays,
    months,
    weeks
  };
}

// Parser de estilos markdown inline
function parseInlineStyles(str: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = str;
  let keyIndex = 0;

  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/;

  while (remaining.length > 0) {
    const match = remaining.match(regex);
    if (!match) {
      parts.push(remaining);
      break;
    }

    const matchIndex = match.index || 0;
    if (matchIndex > 0) {
      parts.push(remaining.slice(0, matchIndex));
    }

    const fullMatch = match[0];
    if (fullMatch.startsWith("**")) {
      parts.push(<strong key={keyIndex++} className="font-bold text-stone-900">{match[2]}</strong>);
    } else if (fullMatch.startsWith("*")) {
      parts.push(<em key={keyIndex++} className="italic text-stone-700">{match[3]}</em>);
    } else if (fullMatch.startsWith("`")) {
      parts.push(<code key={keyIndex++} className="px-1.5 py-0.5 bg-stone-200 text-purple-800 rounded text-[11px] font-mono">{match[4]}</code>);
    }

    remaining = remaining.slice(matchIndex + fullMatch.length);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

// Renderizador estructurado de markdown
function renderFormattedMessage(text: string) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;

        if (trimmed.startsWith("### ")) {
          return <h4 key={idx} className="font-black text-sm text-stone-900 mt-2 mb-1">{parseInlineStyles(trimmed.slice(4))}</h4>;
        }
        if (trimmed.startsWith("## ")) {
          return <h3 key={idx} className="font-black text-sm text-purple-900 mt-2 mb-1">{parseInlineStyles(trimmed.slice(3))}</h3>;
        }

        if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1">
              <span className="text-purple-600 font-bold leading-none mt-1">•</span>
              <span className="flex-1">{parseInlineStyles(trimmed.replace(/^([•\-\*]\s+)/, ""))}</span>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1">
              <span className="text-purple-600 font-black text-[11px] leading-none mt-0.5">{numMatch[1]}.</span>
              <span className="flex-1">{parseInlineStyles(numMatch[2])}</span>
            </div>
          );
        }

        return <p key={idx}>{parseInlineStyles(trimmed)}</p>;
      })}
    </div>
  );
}

export default function TinyAIAssistantModal({ theme, childName = "el Bebé", child }: TinyAIAssistantModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [mode, setMode] = useState<"chat" | "letter">("chat");
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calcular la etapa precisa del bebé
  const stageInfo = useMemo(() => {
    const isPregnancy = child?.preview_config?.status !== "born" && (!child?.birth_date || new Date(child.birth_date) > new Date());
    const fum = child?.preview_config?.fum;
    const birthDate = child?.birth_date;

    if (isPregnancy) {
      const gest = calculateGestation(fum);
      if (gest) {
        return {
          isPregnancy: true,
          weeks: gest.weeks,
          days: gest.days,
          trimester: gest.trimester,
          fpp: gest.fpp,
          label: `Semana ${gest.weeks} de gestación (${gest.weeks} sem + ${gest.days} d • Trimestre ${gest.trimester})`,
          badge: `Semana ${gest.weeks} de Gestación`,
          short: `Semana ${gest.weeks}`
        };
      }
      // Demo si no hay FUM
      return {
        isPregnancy: true,
        weeks: 24,
        days: 0,
        trimester: 2,
        fpp: "Por definir en perfil",
        label: "Semana 24 de gestación (Configura FUM en perfil)",
        badge: "Semana 24 (Demo)",
        short: "Semana 24"
      };
    } else {
      const age = calculateBabyAge(birthDate);
      return {
        isPregnancy: false,
        weeks: age?.weeks || 0,
        days: 0,
        babyAge: age?.formattedAge || "Recién nacido",
        totalDays: age?.totalDays || 0,
        label: `Edad: ${age?.formattedAge || "Recién nacido"}`,
        badge: age?.formattedAge || "Recién nacido",
        short: age?.formattedAge || "Nacido"
      };
    }
  }, [child]);

  const targetName = child?.nickname || child?.name || childName;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: `¡Hola! Soy TinyAI 🤖✨ Tu asistente especializado. Estoy conectado con los datos de **${targetName}** (${stageInfo.label}). ¿Qué deseas consultar o redactar hoy?`,
      isAiGenerated: false
    },
  ]);

  useEffect(() => {
    const disabledState = localStorage.getItem("tinyworld_ai_disabled");
    setIsDisabled(disabledState === "true");

    const savedKey = localStorage.getItem("tinyworld_gemini_api_key") || "";
    setCustomKey(savedKey);

    const handleToggle = () => {
      const state = localStorage.getItem("tinyworld_ai_disabled");
      setIsDisabled(state === "true");
    };

    window.addEventListener("tinyworld_ai_toggle", handleToggle);
    return () => window.removeEventListener("tinyworld_ai_toggle", handleToggle);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const toggleAi = (enable: boolean) => {
    setIsDisabled(!enable);
    localStorage.setItem("tinyworld_ai_disabled", enable ? "false" : "true");
    window.dispatchEvent(new CustomEvent("tinyworld_ai_toggle"));
    if (!enable) setIsOpen(false);
  };

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tinyworld_gemini_api_key", customKey.trim());
    setSavedKeySuccess(true);
    setTimeout(() => {
      setSavedKeySuccess(false);
      setShowKeyModal(false);
    }, 1500);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "ai",
        text: `¡Hola! Soy TinyAI 🤖✨ Tu asistente especializado. Estoy conectado con los datos de **${targetName}** (${stageInfo.label}). ¿Qué deseas consultar o redactar hoy?`,
        isAiGenerated: false
      },
    ]);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const sendPrompt = async (promptToSend: string) => {
    if (!promptToSend.trim() || loading) return;

    const userText = promptToSend.trim();
    setInputPrompt("");

    const updatedMessages: Message[] = [...messages, { role: "user", text: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const historyToSend = updatedMessages.slice(-8).map((m) => ({
        role: m.role,
        text: m.text
      }));

      const childContext = {
        childName: targetName,
        gender: child?.gender,
        isPregnancy: stageInfo.isPregnancy,
        pregnancyWeeks: stageInfo.weeks,
        pregnancyDays: stageInfo.days,
        trimester: stageInfo.trimester,
        fpp: stageInfo.fpp,
        babyAge: stageInfo.babyAge,
        stageLabel: stageInfo.label,
        motherName: child?.mother_name,
        fatherName: child?.father_name,
        parentsNames: child?.parents_names
      };

      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          prompt: userText, 
          mode, 
          history: historyToSend,
          childName: targetName,
          childContext,
          clientApiKey: customKey.trim() || undefined
        }),
      });

      const data = await res.json();
      const reply = data.reply || "No se pudo obtener respuesta del modelo de IA.";
      
      setMessages((prev) => [
        ...prev, 
        { 
          role: "ai", 
          text: reply, 
          isAiGenerated: data.isAiGenerated,
          stageAnalyzed: data.stageAnalyzed || stageInfo.short
        }
      ]);

      if (data.keyMissing) {
        setShowKeyModal(true);
      }
    } catch (err: any) {
      console.error("Error al consultar TinyAI:", err);
      setMessages((prev) => [
        ...prev, 
        { 
          role: "ai", 
          text: `⚠️ Error de conexión: ${err?.message || "No se pudo comunicar con el servidor."}. Intenta nuevamente.` 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPrompt(inputPrompt);
  };

  if (isDisabled) return null;

  // Sugerencias contextuales exactas para las semanas o edad
  const dynamicSuggestions = stageInfo.isPregnancy ? [
    `🤰 ¿Cómo es el desarrollo de mi bebé en la ${stageInfo.short}?`,
    `🩺 ¿Qué síntomas o cuidados son clave en la ${stageInfo.short}?`,
    `🥗 ¿Qué nutrición debo priorizar en el ${stageInfo.trimester ? `${stageInfo.trimester}° Trimestre` : "embarazo"}?`,
    `💌 Escribe una carta emotiva para mi bebé en la ${stageInfo.short}`
  ] : [
    `👶 ¿Qué hitos de desarrollo corresponden a ${stageInfo.short}?`,
    `🌙 ¿Cómo regular el sueño a esta edad (${stageInfo.short})?`,
    `🍼 Recomendaciones de alimentación para ${stageInfo.short}`,
    `💌 Redacta una carta de amor para celebrar sus ${stageInfo.short}`
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[2500] p-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-500 text-white rounded-full shadow-[0_10px_35px_rgba(99,102,241,0.5)] hover:scale-110 active:scale-95 transition-all flex items-center gap-2.5 group border-2 border-white/40 cursor-pointer"
        title="TinyAI Assistant con contexto de semanas"
      >
        <Sparkles size={22} className="animate-pulse" />
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-black uppercase tracking-wider leading-none">TinyAI</span>
          <span className="text-[9px] font-bold opacity-80">{stageInfo.short}</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg h-[85vh] max-h-[750px] flex flex-col shadow-2xl overflow-hidden border border-white/80"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-500 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 backdrop-blur rounded-2xl border border-white/20">
                    <Bot size={22} className="animate-bounce" style={{ animationDuration: "3s" }} />
                  </div>
                  <div>
                    <h3 className="text-base font-black italic tracking-tight flex items-center gap-1.5">
                      TinyAI Assistant ✨
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-90">
                      <span>{targetName}</span>
                      <span>•</span>
                      <span className="bg-white/25 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                        {stageInfo.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShowKeyModal(true)} 
                    title="Configuración de Clave IA" 
                    className={`p-2 rounded-full transition-colors ${customKey ? 'bg-emerald-500/30 text-emerald-200' : 'hover:bg-white/20 text-white/80 hover:text-white'} cursor-pointer`}
                  >
                    <Key size={16} />
                  </button>
                  <button 
                    onClick={clearChat} 
                    title="Reiniciar Conversación" 
                    className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-2 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer"
                    title="Cerrar"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Barra de Contexto Semanal */}
              <div className="px-4 py-2 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between text-[11px] text-purple-900 font-bold">
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar size={13} className="text-purple-600 shrink-0" />
                  <span className="truncate">{stageInfo.label}</span>
                </div>
                {stageInfo.fpp && stageInfo.isPregnancy && (
                  <span className="text-[9px] bg-purple-200/70 text-purple-900 px-2 py-0.5 rounded-full shrink-0 font-black">
                    FPP: {stageInfo.fpp}
                  </span>
                )}
              </div>

              {/* Selector de Modo */}
              <div className="flex gap-2 p-2 bg-stone-100 border-b border-stone-200">
                <button
                  onClick={() => setMode("chat")}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === "chat" 
                      ? "bg-white text-purple-700 shadow-sm border border-stone-200/80" 
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  <MessageSquare size={13} /> Consultas Semanales
                </button>
                <button
                  onClick={() => setMode("letter")}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === "letter" 
                      ? "bg-white text-rose-600 shadow-sm border border-stone-200/80" 
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  <Heart size={13} /> Cartas para {targetName}
                </button>
              </div>

              {/* Mensajes */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-stone-50/70">
                {messages.map((m, idx) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[92%] p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm relative group ${
                          isUser
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none"
                            : "bg-white text-stone-800 border border-stone-200/90 rounded-bl-none shadow-stone-100"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        ) : (
                          <div>
                            {renderFormattedMessage(m.text)}

                            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                              <span className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-1 text-purple-700">
                                <Sparkles size={11} /> TinyAI • {m.stageAnalyzed || stageInfo.short}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(m.text, idx)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-purple-50 hover:text-purple-700 rounded-lg font-bold transition-all cursor-pointer text-stone-600"
                                title="Copiar texto"
                              >
                                {copiedIdx === idx ? (
                                  <>
                                    <Check size={12} className="text-emerald-600" />
                                    <span className="text-emerald-600 text-[9px]">¡Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span className="text-[9px]">Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-2.5 text-stone-600 text-xs font-bold">
                      <Loader2 className="animate-spin text-purple-600" size={18} />
                      <span>Analizando {stageInfo.label} con IA...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Sugerencias Rápidas Dinámicas */}
              {messages.length <= 3 && !loading && (
                <div className="px-3 py-2 bg-stone-100/80 border-t border-stone-200 overflow-x-auto flex gap-1.5 custom-scrollbar">
                  {dynamicSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendPrompt(sug.replace(/^[^\s]+\s/, ""))}
                      className="whitespace-nowrap px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-900 border border-purple-200/70 rounded-full text-[10px] font-bold shadow-xs hover:border-purple-300 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Lightbulb size={11} className="text-purple-600 shrink-0" />
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={
                    mode === "letter"
                      ? `Ej. Escribe una carta para ${targetName} en su ${stageInfo.short}...`
                      : `Haz una consulta sobre ${targetName} en la ${stageInfo.short}...`
                  }
                  className="flex-1 px-4 py-3 bg-stone-100 rounded-2xl text-xs font-semibold outline-none focus:bg-stone-50 focus:ring-2 focus:ring-purple-400 transition-all text-stone-800 placeholder-stone-400"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !inputPrompt.trim()}
                  className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Configuración de API Key Directa */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-[3500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 relative"
            >
              <button 
                onClick={() => setShowKeyModal(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                  <Key size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Configurar Gemini API Key</h3>
                  <p className="text-[11px] text-stone-500 font-bold">Activa la IA 100% real en tiempo real</p>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                Pega tu clave gratuita de Google Gemini para que TinyAI analice con precisión las semanas de gestación y responda en vivo sin restricciones.
              </p>

              <form onSubmit={handleSaveCustomKey} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-3 bg-stone-100 rounded-xl text-xs font-mono border border-stone-200 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex justify-between items-center mt-2 text-[10px]">
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 font-bold hover:underline"
                    >
                      🔗 Obtener clave gratuita en Google AI Studio
                    </a>
                  </div>
                </div>

                {savedKeySuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                    <ShieldCheck size={16} />
                    ¡Clave guardada con éxito!
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                  >
                    Guardar Clave
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
