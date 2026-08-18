"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Scale, Ruler } from "lucide-react";

interface Measurement {
  month: number;
  weightKg: number;
  heightCm: number;
  date: string;
}

const DEFAULT_MEASUREMENTS: Measurement[] = [
  { month: 0, weightKg: 3.4, heightCm: 50, date: "Nacimiento" },
  { month: 1, weightKg: 4.6, heightCm: 54, date: "Mes 1" },
  { month: 2, weightKg: 5.7, heightCm: 58, date: "Mes 2" },
  { month: 3, weightKg: 6.5, heightCm: 61, date: "Mes 3" },
  { month: 6, weightKg: 7.8, heightCm: 67, date: "Mes 6" },
];

interface WhoGrowthChartProps {
  theme: any;
  childName?: string;
}

export default function WhoGrowthChart({ theme, childName = "el Bebé" }: WhoGrowthChartProps) {
  const [activeTab, setActiveTab] = useState<"weight" | "height">("weight");
  const [measurements, setMeasurements] = useState<Measurement[]>(DEFAULT_MEASUREMENTS);

  const [newMonth, setNewMonth] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newHeight, setNewHeight] = useState("");

  const storageKey = `tinyworld_growth_${childName.toLowerCase().replace(/\s+/g, '_')}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMeasurements(parsed);
        }
      }
    } catch {
      // fallback to defaults
    }
  }, [storageKey]);

  const addMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonth || !newWeight) return;
    const m = Number(newMonth);
    const w = Number(newWeight);
    const h = Number(newHeight) || 50;

    const updated = [...measurements.filter((it) => it.month !== m), { month: m, weightKg: w, heightCm: h, date: `Mes ${m}` }].sort((a, b) => a.month - b.month);
    setMeasurements(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn("Error guardando mediciones en localStorage:", err);
    }
    setNewMonth("");
    setNewWeight("");
    setNewHeight("");
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 shadow-xl border border-white/60 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl ${theme.bg} ${theme.text}`}>
              <TrendingUp size={20} />
            </span>
            <h2 className={`text-xl font-black ${theme.text} tracking-tight italic`}>
              Curvas de Crecimiento OMS ({childName})
            </h2>
          </div>
          <p className="text-xs font-bold text-stone-400 mt-1">
            Estándares oficiales de percentiles de la Organización Mundial de la Salud
          </p>
        </div>

        <div className="flex gap-2 p-1 bg-stone-100 rounded-2xl">
          <button
            onClick={() => setActiveTab("weight")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "weight" ? `${theme.primaryBg} ${theme.textActive} shadow` : "text-stone-500"
            }`}
          >
            <Scale size={12} className="inline mr-1" /> Peso (kg)
          </button>
          <button
            onClick={() => setActiveTab("height")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "height" ? `${theme.primaryBg} ${theme.textActive} shadow` : "text-stone-500"
            }`}
          >
            <Ruler size={12} className="inline mr-1" /> Talla (cm)
          </button>
        </div>
      </div>

      <div className="relative w-full h-64 bg-stone-900 rounded-[2rem] p-4 overflow-hidden shadow-inner flex items-center justify-center">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 300 150">
          {activeTab === "weight" ? (
            <>
              {/* Curvas de Peso OMS (Percentil 97, 50, 3) */}
              <path
                d="M 10 130 Q 150 70 290 30"
                fill="none"
                stroke="rgba(239, 68, 68, 0.4)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 10 135 Q 150 90 290 55"
                fill="none"
                stroke="rgba(34, 197, 94, 0.8)"
                strokeWidth="3"
              />
              <path
                d="M 10 140 Q 150 110 290 85"
                fill="none"
                stroke="rgba(239, 68, 68, 0.4)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {measurements.map((m, idx) => {
                const x = 10 + (m.month / 24) * 280;
                const y = Math.max(10, Math.min(140, 140 - (m.weightKg / 16) * 120));
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
                    <text x={x} y={y - 10} fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {m.weightKg}kg
                    </text>
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {/* Curvas de Talla OMS (Percentil 97, 50, 3) */}
              <path
                d="M 10 120 Q 150 65 290 25"
                fill="none"
                stroke="rgba(239, 68, 68, 0.4)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 10 128 Q 150 78 290 38"
                fill="none"
                stroke="rgba(34, 197, 94, 0.8)"
                strokeWidth="3"
              />
              <path
                d="M 10 136 Q 150 90 290 52"
                fill="none"
                stroke="rgba(239, 68, 68, 0.4)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {measurements.map((m, idx) => {
                const x = 10 + (m.month / 24) * 280;
                const y = Math.max(10, Math.min(140, 140 - ((m.heightCm - 45) / 50) * 120));
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="5" fill="#EC4899" stroke="#FFFFFF" strokeWidth="2" />
                    <text x={x} y={y - 10} fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {m.heightCm}cm
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
        <div className="absolute top-3 left-4 text-[9px] font-black uppercase tracking-widest text-emerald-400">
          Verde: Percentil 50 OMS ({activeTab === "weight" ? "Peso" : "Talla"})
        </div>
      </div>

      <form onSubmit={addMeasurement} className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
        <input
          type="number"
          placeholder="Mes (0-24)"
          value={newMonth}
          onChange={(e) => setNewMonth(e.target.value)}
          className="px-3 py-2 bg-stone-100 rounded-xl text-xs font-bold outline-none w-28"
          min="0"
          max="24"
          required
        />
        <input
          type="number"
          step="0.1"
          placeholder="Peso (kg)"
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          className="px-3 py-2 bg-stone-100 rounded-xl text-xs font-bold outline-none w-28"
          required
        />
        <input
          type="number"
          step="0.5"
          placeholder="Talla (cm)"
          value={newHeight}
          onChange={(e) => setNewHeight(e.target.value)}
          className="px-3 py-2 bg-stone-100 rounded-xl text-xs font-bold outline-none w-28"
        />
        <button
          type="submit"
          className={`px-4 py-2 ${theme.primaryBg} ${theme.textActive} rounded-xl font-black text-xs uppercase tracking-widest shadow hover:scale-105 transition-all`}
        >
          + Registrar Registro
        </button>
      </form>
    </div>
  );
}
