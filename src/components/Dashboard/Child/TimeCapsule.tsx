"use client";

import React, { useState, useEffect } from "react";
import { Lock, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CapsuleItem {
  id: string;
  title: string;
  message: string;
  unlockDate: string;
  author: string;
  createdDate: string;
}

const DEFAULT_CAPSULES: CapsuleItem[] = [
  {
    id: "cap-1",
    title: "Carta para cuando cumplas 18 años",
    message: "Querido hijo, hoy cumples 18 años. Te escribimos esto cuando tenías apenas 3 meses...",
    unlockDate: "2042-07-21",
    author: "Mamá y Papá",
    createdDate: "2026-07-21",
  },
];

interface TimeCapsuleProps {
  theme: any;
  childName?: string;
}

export default function TimeCapsule({ theme, childName = "el Bebé" }: TimeCapsuleProps) {
  const [capsules, setCapsules] = useState<CapsuleItem[]>(DEFAULT_CAPSULES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [unlockYear, setUnlockYear] = useState(18);

  const storageKey = `tinyworld_capsules_${childName.toLowerCase().replace(/\s+/g, '_')}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCapsules(parsed);
        }
      }
    } catch {
      // fallback
    }
  }, [storageKey]);

  const createCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + Number(unlockYear));

    const newCap: CapsuleItem = {
      id: `cap-${Date.now()}`,
      title,
      message,
      unlockDate: futureDate.toISOString().split("T")[0],
      author: "Mamá y Papá",
      createdDate: new Date().toISOString().split("T")[0],
    };

    const updated = [newCap, ...capsules];
    setCapsules(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn("Error guardando capsulas en localStorage:", err);
    }
    setTitle("");
    setMessage("");
    setShowCreateModal(false);
  };

  const isUnlocked = (dateStr: string) => {
    return new Date() >= new Date(dateStr);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 shadow-xl border border-white/60 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`p-3 rounded-2xl ${theme.bg} ${theme.text} shadow-sm`}>
            <Gift size={24} />
          </span>
          <div>
            <h2 className={`text-xl font-black ${theme.text} tracking-tight italic`}>
              Cápsulas del Tiempo Selladas
            </h2>
            <p className="text-xs font-bold text-stone-400">
              Cartas y recuerdos bloqueados con fecha de apertura futura para {childName}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className={`px-5 py-3 ${theme.primaryBg} ${theme.textActive} rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center gap-2`}
        >
          <Lock size={14} /> + Crear Cápsula
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {capsules.map((cap) => {
          const unlocked = isUnlocked(cap.unlockDate);
          return (
            <div
              key={cap.id}
              className={`relative rounded-[2rem] p-6 border transition-all ${
                unlocked
                  ? "bg-emerald-50/80 border-emerald-200 shadow-md"
                  : "bg-stone-900 text-white border-stone-800 shadow-2xl overflow-hidden"
              }`}
            >
              {!unlocked && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                  <Lock size={12} /> Sellada hasta {new Date(cap.unlockDate).getFullYear()}
                </div>
              )}

              <h3 className="text-base font-black italic tracking-tight mb-2 pr-20">{cap.title}</h3>
              <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest mb-4">
                Escrito por {cap.author} • {cap.createdDate}
              </p>

              <div className={`p-4 rounded-xl relative ${unlocked ? "bg-white text-stone-800" : "bg-white/5 backdrop-blur-md"}`}>
                <p className={`text-xs leading-relaxed font-medium ${!unlocked ? "blur-sm select-none" : ""}`}>
                  {cap.message}
                </p>
                {!unlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl backdrop-blur-xs text-center p-4">
                    <Lock size={28} className="text-amber-400 mb-1 animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                      Sello del Tiempo Activo
                    </span>
                    <span className="text-[8px] opacity-70 text-white mt-1">
                      Se desbloqueará el {new Date(cap.unlockDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-black ${theme.text} italic`}>Sellar Nueva Cápsula del Tiempo</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 text-stone-400 hover:text-stone-700">✕</button>
              </div>

              <form onSubmit={createCapsule} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Título de la carta</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Para tu cumpleaños número 18"
                    className="w-full mt-1 px-4 py-3 bg-stone-100 rounded-xl text-xs font-bold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Años a esperar antes de desbloquear</label>
                  <select
                    value={unlockYear}
                    onChange={(e) => setUnlockYear(Number(e.target.value))}
                    className="w-full mt-1 px-4 py-3 bg-stone-100 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value={15}>15 Años</option>
                    <option value={18}>18 Años (Mayoría de edad)</option>
                    <option value={21}>21 Años</option>
                    <option value={25}>25 Años</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Mensaje o carta secreta</label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe aquí tu mensaje especial..."
                    className="w-full mt-1 px-4 py-3 bg-stone-100 rounded-xl text-xs font-bold outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-4 ${theme.primaryBg} ${theme.textActive} rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform`}
                >
                  <Lock size={14} /> Sellar y Guardar Cápsula
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
