"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Bot, Send, X, Loader2, Heart, MessageSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TinyAIAssistantModalProps {
  theme: any;
  childName?: string;
}

export default function TinyAIAssistantModal({ theme, childName = "el Bebé" }: TinyAIAssistantModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [mode, setMode] = useState<"chat" | "letter">("chat");
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: `¡Hola! Soy TinyAI 🤖✨ Tu asistente especializado en embarazo, maternidad y pediatría. ¿En qué puedo ayudarte hoy o qué carta deseas redactar para ${childName}?`,
    },
  ]);

  useEffect(() => {
    const checkState = () => {
      const disabledState = localStorage.getItem("tinyworld_ai_disabled");
      setIsDisabled(disabledState === "true");
    };
    checkState();
    window.addEventListener("storage", checkState);
    window.addEventListener("tinyworld_ai_toggle", checkState);
    return () => {
      window.removeEventListener("storage", checkState);
      window.removeEventListener("tinyworld_ai_toggle", checkState);
    };
  }, []);

  const toggleAi = (enable: boolean) => {
    setIsDisabled(!enable);
    localStorage.setItem("tinyworld_ai_disabled", enable ? "false" : "true");
    window.dispatchEvent(new CustomEvent("tinyworld_ai_toggle"));
    if (!enable) setIsOpen(false);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "ai",
        text: `¡Hola! Soy TinyAI 🤖✨ Tu asistente especializado en embarazo, maternidad y pediatría. ¿En qué puedo ayudarte hoy o qué carta deseas redactar para ${childName}?`,
      },
    ]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userText = inputPrompt;
    setInputPrompt("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText, mode }),
      });

      const data = await res.json();
      const reply = data.reply || "Lo siento, no pude procesar tu consulta en este momento.";
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } catch (err) {
      console.error("Error al consultar TinyAI:", err);
      setMessages((prev) => [...prev, { role: "ai", text: "Hubo una falla al conectar con TinyAI." }]);
    } finally {
      setLoading(false);
    }
  };

  if (isDisabled) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[2500] p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-[0_10px_30px_rgba(99,102,241,0.5)] hover:scale-110 active:scale-95 transition-all flex items-center gap-2 group border border-white/20 cursor-pointer"
        title="Asistente de IA TinyAI"
      >
        <Sparkles size={22} className="animate-pulse" />
        <span className="hidden md:inline text-xs font-black uppercase tracking-widest">TinyAI Assistant</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-white/80"
            >
              <div className="p-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-500 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur rounded-2xl">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black italic tracking-tight">TinyAI Assistant 🤖✨</h3>
                    <p className="text-[9px] uppercase tracking-widest opacity-80 font-bold">100% Gratuito • Embarazo & Pediatría</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full border border-white/30">
                    <span className="text-[8px] font-black uppercase tracking-wider text-white">IA {isDisabled ? "OFF" : "ON"}</span>
                    <button
                      type="button"
                      onClick={() => toggleAi(false)}
                      className="w-7 h-4 bg-emerald-400 rounded-full p-0.5 relative cursor-pointer"
                      title="Desactivar Asistente de IA"
                    >
                      <div className="w-3 h-3 bg-white rounded-full shadow translate-x-3 transition-transform" />
                    </button>
                  </div>
                  <button onClick={clearChat} title="Limpiar Chat de IA" className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 p-2 bg-stone-100 border-b border-stone-200">
                <button
                  onClick={() => setMode("chat")}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === "chat" ? "bg-white text-purple-700 shadow" : "text-stone-500"
                  }`}
                >
                  <MessageSquare size={13} /> Chat de Consultas
                </button>
                <button
                  onClick={() => setMode("letter")}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === "letter" ? "bg-white text-rose-600 shadow" : "text-stone-500"
                  }`}
                >
                  <Heart size={13} /> Redactor de Cartas
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-stone-50">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-purple-600 text-white rounded-br-none"
                          : "bg-white text-stone-800 border border-stone-200 rounded-bl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-2 text-stone-500 text-xs font-bold">
                      <Loader2 className="animate-spin text-purple-600" size={16} />
                      TinyAI está pensando...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={mode === "letter" ? "Ej. Escribe una carta emotiva para mi bebé en la semana 30..." : "Haz cualquier pregunta sobre tu embarazo o bebé..."}
                  className="flex-1 px-4 py-3 bg-stone-100 rounded-2xl text-xs font-bold outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !inputPrompt.trim()}
                  className="p-3 bg-purple-600 text-white rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
