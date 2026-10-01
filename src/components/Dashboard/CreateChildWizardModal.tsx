"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Baby, Sparkles, ChevronRight, ChevronLeft, 
  Calendar, Heart, Settings, Check, X, Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import { playSoftPop, playActionSnap } from "@/lib/pageSound";
import confetti from "canvas-confetti";

type ThemeColor = keyof typeof themePalettes;

interface CreateChildWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newChildId?: string) => void;
}

export default function CreateChildWizardModal({
  isOpen,
  onClose,
  onSuccess
}: CreateChildWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"boy" | "girl" | "surprise">("surprise");
  const [status, setStatus] = useState<"pregnancy" | "born">("pregnancy");
  const [fum, setFum] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [themeColor, setThemeColor] = useState<ThemeColor>("neutral");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedTheme = themePalettes[themeColor] || themePalettes.neutral;

  // Cálculo en vivo de semanas gestacionales
  const getGestationPreview = (fumStr: string) => {
    if (!fumStr) return null;
    const fumDateObj = new Date(fumStr + "T12:00:00");
    const now = new Date();
    const diffTime = now.getTime() - fumDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    const fpp = new Date(fumDateObj.getTime() + 280 * 24 * 60 * 60 * 1000);
    return {
      weeks,
      days,
      fppFormatted: fpp.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    };
  };

  // Cálculo en vivo de edad si ya nació
  const getAgePreview = (birthStr: string) => {
    if (!birthStr) return null;
    const birth = new Date(birthStr + "T12:00:00");
    const now = new Date();
    const diffTime = now.getTime() - birth.getTime();
    if (diffTime < 0) return "Fecha futura (verifica la fecha)";
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
      const parts = [years === 1 ? "1 año" : `${years} años`];
      if (months > 0) parts.push(months === 1 ? "1 mes" : `${months} meses`);
      return parts.join(" y ");
    }
    if (months > 0) {
      const parts = [months === 1 ? "1 mes" : `${months} meses`];
      const weeks = Math.floor(days / 7);
      if (weeks > 0) parts.push(weeks === 1 ? "1 semana" : `${weeks} semanas`);
      return parts.join(" y ");
    }
    const weeks = Math.floor(diffDays / 7);
    if (weeks > 0) return `${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
    if (diffDays > 0) return `${diffDays} ${diffDays === 1 ? "día" : "días"}`;
    return "Recién nacido";
  };

  const handleNext = () => {
    setErrorMsg("");
    playSoftPop();
    if (step === 1) {
      if (!name.trim()) {
        setErrorMsg("Por favor escribe el nombre o apodo de tu bebé.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (status === "pregnancy" && !fum) {
        setErrorMsg("Por favor ingresa la fecha de tu última regla.");
        return;
      }
      if (status === "born" && !birthDate) {
        setErrorMsg("Por favor ingresa la fecha de nacimiento de tu bebé.");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      // Al pasar al paso 5, lanzar un toque de confetti
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: [selectedTheme.hex, "#F59E0B", "#10B981"]
        });
      } catch (e) {}
      setStep(5);
    }
  };

  const handlePrev = () => {
    setErrorMsg("");
    playSoftPop();
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSaving(true);
    setErrorMsg("");
    playActionSnap();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay una sesión activa. Inicia sesión nuevamente.");
      }

      const isBorn = status === "born";

      const insertData = {
        parent_id: session.user.id,
        name: name.trim(),
        nickname: name.trim(),
        gender: gender,
        birth_date: isBorn ? birthDate : null,
        theme_color: themeColor,
        preview_config: {
          status: isBorn ? "born" : "pregnancy",
          fum: isBorn ? "" : fum,
          show_pregnancy: true,
          show_gallery: true,
          show_calendars: true,
          show_album: true
        }
      };

      const { data, error } = await supabase
        .from("children")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Éxito: confetti final
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.5 },
          colors: [selectedTheme.hex, "#E11D48", "#3B82F6", "#F59E0B"]
        });
      } catch (e) {}

      onSuccess(data?.id);
      onClose();
    } catch (err: any) {
      console.error("Error creating child:", err);
      setErrorMsg(err.message || "Error al crear el perfil del bebé.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const gestationInfo = fum ? getGestationPreview(fum) : null;
  const ageInfo = birthDate ? getAgePreview(birthDate) : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-2xl border border-white/80 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header con Barra de Progreso de 5 Pasos */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-2xl ${selectedTheme.bg} ${selectedTheme.text}`}>
                <Baby size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                  Paso {step} de 5
                </span>
                <h2 className="text-sm font-black font-outfit text-stone-800 dark:text-stone-100">
                  {step === 1 && "Bienvenido a TinyWorld"}
                  {step === 2 && "Género del Bebé"}
                  {step === 3 && "¿En qué momento están?"}
                  {step === 4 && "Color de la App"}
                  {step === 5 && "¡Todo listo para empezar!"}
                </h2>
              </div>
            </div>
            <button
              onClick={() => { playSoftPop(); onClose(); }}
              className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Dots / Píldoras de pasos */}
          <div className="grid grid-cols-5 gap-1.5 w-full pt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? selectedTheme.primaryBg : "bg-stone-200 dark:bg-stone-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contenido del Paso */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* PASO 1: NOMBRE O APODO */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1.5 mb-2">
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="text-xl font-black font-outfit text-stone-800 dark:text-stone-100">
                    ¿Cómo vas a llamar a tu bebé?
                  </h3>
                  <p className="text-xs text-stone-400 font-bold font-quicksand">
                    Puedes poner su nombre o un apodo cariñoso si aún no están seguros.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Mateo, Sofía, Mi Garbancito..."
                    className="w-full px-5 py-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-outfit font-black text-lg focus:outline-none focus:border-stone-800 transition-all text-center placeholder:text-stone-300 placeholder:font-normal"
                    onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}
                  />
                  <p className="text-[11px] text-stone-400 text-center italic">
                    Podrás editar o cambiar el nombre siempre que lo desees.
                  </p>
                </div>
              </motion.div>
            )}

            {/* PASO 2: GÉNERO */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1 mb-2">
                  <h3 className="text-xl font-black font-outfit text-stone-800 dark:text-stone-100">
                    ¿Ya saben si es niño o niña?
                  </h3>
                  <p className="text-xs text-stone-400 font-bold font-quicksand">
                    Ayuda a personalizar los detalles y tarjetas mágicas.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => { playSoftPop(); setGender("boy"); }}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 transition-all text-left ${
                      gender === "boy"
                        ? "border-sky-400 bg-sky-50 dark:bg-sky-950/40 shadow-sm scale-[1.01]"
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-300"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-xl shrink-0">
                      👦
                    </div>
                    <div className="flex-1">
                      <div className="font-outfit font-black text-sm text-stone-800 dark:text-stone-100">
                        Es un Niño
                      </div>
                      <div className="text-[11px] text-stone-400 font-quicksand font-bold">
                        Un pequeño príncipe en camino
                      </div>
                    </div>
                    {gender === "boy" && <Check className="text-sky-500" size={20} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => { playSoftPop(); setGender("girl"); }}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 transition-all text-left ${
                      gender === "girl"
                        ? "border-pink-400 bg-pink-50 dark:bg-pink-950/40 shadow-sm scale-[1.01]"
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-300"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-xl shrink-0">
                      👧
                    </div>
                    <div className="flex-1">
                      <div className="font-outfit font-black text-sm text-stone-800 dark:text-stone-100">
                        Es una Niña
                      </div>
                      <div className="text-[11px] text-stone-400 font-quicksand font-bold">
                        Una pequeña princesa en camino
                      </div>
                    </div>
                    {gender === "girl" && <Check className="text-pink-500" size={20} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => { playSoftPop(); setGender("surprise"); }}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 transition-all text-left ${
                      gender === "surprise"
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 shadow-sm scale-[1.01]"
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-300"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">
                      🐣
                    </div>
                    <div className="flex-1">
                      <div className="font-outfit font-black text-sm text-stone-800 dark:text-stone-100">
                        Aún es Sorpresa
                      </div>
                      <div className="text-[11px] text-stone-400 font-quicksand font-bold">
                        ¡Queremos sorprendernos más adelante!
                      </div>
                    </div>
                    {gender === "surprise" && <Check className="text-amber-500" size={20} />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* PASO 3: ETAPA ACTUAL (EMBARAZO CON FUR vs NACIMIENTO) */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1 mb-2">
                  <h3 className="text-xl font-black font-outfit text-stone-800 dark:text-stone-100">
                    ¿En qué momento se encuentran?
                  </h3>
                  <p className="text-xs text-stone-400 font-bold font-quicksand">
                    Selecciona para calcular sus semanas o su edad exacta.
                  </p>
                </div>

                {/* Selector Bifurcación */}
                <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => { playSoftPop(); setStatus("pregnancy"); }}
                    className={`py-3 rounded-xl font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      status === "pregnancy"
                        ? "bg-white dark:bg-stone-900 shadow-md text-stone-800 dark:text-stone-100"
                        : "text-stone-400 hover:text-stone-600"
                    }`}
                  >
                    <span>🤰 Viene en camino</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { playSoftPop(); setStatus("born"); }}
                    className={`py-3 rounded-xl font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      status === "born"
                        ? "bg-white dark:bg-stone-900 shadow-md text-stone-800 dark:text-stone-100"
                        : "text-stone-400 hover:text-stone-600"
                    }`}
                  >
                    <span>👶 Ya nació</span>
                  </button>
                </div>

                {/* Subformulario según status */}
                {status === "pregnancy" ? (
                  <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                        Fecha de Última Regla (FUR / FUM)
                      </label>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mb-2 leading-relaxed">
                        Es el primer día de tu última menstruación antes de saber del embarazo. Esencial para calcular semanas y fecha de parto.
                      </p>
                      <input
                        type="date"
                        required
                        value={fum}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setFum(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 rounded-xl font-outfit font-bold text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    {gestationInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-white/90 dark:bg-stone-900/90 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-black text-amber-800 dark:text-amber-200">
                            ✨ {gestationInfo.weeks} Semanas y {gestationInfo.days} Días
                          </div>
                          <div className="text-[10px] text-stone-400 font-bold">
                            FPP Aprox: {gestationInfo.fppFormatted}
                          </div>
                        </div>
                        <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-black uppercase text-[9px]">
                          Calculado
                        </span>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-sky-900 dark:text-sky-300 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <p className="text-[11px] text-sky-700/80 dark:text-sky-400/80 mb-2 leading-relaxed">
                        El día mágico en que tu pequeño llegó a este mundo.
                      </p>
                      <input
                        type="date"
                        required
                        value={birthDate}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-sky-300 dark:border-sky-700 rounded-xl font-outfit font-bold text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>

                    {ageInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-white/90 dark:bg-stone-900/90 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center justify-between"
                      >
                        <div className="text-xs font-black text-sky-800 dark:text-sky-200">
                          🎉 Tu bebé tiene: {ageInfo}
                        </div>
                        <span className="text-xs px-2.5 py-1 bg-sky-100 text-sky-700 rounded-full font-black uppercase text-[9px]">
                          Edad Actual
                        </span>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* PASO 4: COLOR DEL MUNDO */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1 mb-2">
                  <h3 className="text-xl font-black font-outfit text-stone-800 dark:text-stone-100">
                    Elige el color para su mundo
                  </h3>
                  <p className="text-xs text-stone-400 font-bold font-quicksand">
                    Personaliza toda la app con la paleta de color que más te inspire.
                  </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {(Object.keys(themePalettes) as ThemeColor[]).map((colKey) => {
                    const pal = themePalettes[colKey];
                    const isSel = themeColor === colKey;
                    return (
                      <button
                        key={colKey}
                        type="button"
                        onClick={() => { playSoftPop(); setThemeColor(colKey); }}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                          isSel
                            ? "border-stone-800 dark:border-white shadow-md scale-105"
                            : "border-stone-200 dark:border-stone-800 hover:border-stone-300 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full shadow-inner flex items-center justify-center text-white"
                          style={{ backgroundColor: pal.hex }}
                        >
                          {isSel && <Check size={18} strokeWidth={3} />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
                          {colKey}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Previsualización del Nombre con el color */}
                <div className={`p-3 rounded-2xl ${selectedTheme.bg} text-center border ${selectedTheme.borderAccent}`}>
                  <span className={`text-[11px] font-black uppercase tracking-wider ${selectedTheme.text}`}>
                    Vista Previa: El Mundo de {name || "tu Bebé"}
                  </span>
                </div>
              </motion.div>
            )}

            {/* PASO 5: BIENVENIDA Y AVISO DEL ENGRANAJE */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5 text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
                  <Sparkles size={32} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black font-outfit text-stone-800 dark:text-stone-100">
                    ¡El mundo de {name} está listo!
                  </h3>
                  <p className="text-xs text-stone-400 font-bold font-quicksand">
                    Ya puedes empezar a registrar momentos inolvidables.
                  </p>
                </div>

                {/* Tarjeta del Consejo de Engranaje (Requisito clave del usuario) */}
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-300/80 dark:border-amber-700/60 text-left flex items-start gap-3.5 shadow-sm">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 shrink-0">
                    <Settings size={22} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 mb-1">
                      Consejo Importante
                    </h4>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-quicksand font-bold">
                      Siempre podrás cambiar o actualizar estos datos (nombre, semanas de embarazo, fecha de nacimiento, fotos y colores) tocando el botón con el ícono de <span className="underline font-black">engranaje (⚙️)</span> en la esquina superior del panel.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 font-quicksand">
                  Pulsa el botón de abajo para inaugurar su espacio.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold text-center border border-red-200">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer con Botones de Navegación */}
        <div className="p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSaving}
              className="px-4 py-3 rounded-2xl bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-outfit font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft size={16} />
              Atrás
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className={`px-6 py-3.5 rounded-2xl ${selectedTheme.primaryBg} text-white font-outfit font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2`}
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSaving}
              className={`px-8 py-3.5 rounded-2xl ${selectedTheme.primaryBg} text-white font-outfit font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creando Mundo...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>¡Comenzar la Magia!</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
