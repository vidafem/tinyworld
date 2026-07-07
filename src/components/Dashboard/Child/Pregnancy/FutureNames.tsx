"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, X, Check, ChevronLeft, 
  Trash2, Pencil, Sparkles,
  Baby, Heart, Info
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BabyName {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  is_crossed: boolean;
}

interface FutureNamesProps {
  childId: string;
  theme: any;
  onBack: () => void;
  isMobile: boolean;
}

export default function FutureNames({ childId, theme, onBack, isMobile }: FutureNamesProps) {
  const [names, setNames] = useState<BabyName[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingName, setEditingName] = useState<BabyName | null>(null);
  
  const [newName, setNewName] = useState("");
  const [selectedGender, setSelectedGender] = useState<'boy' | 'girl'>('boy');
  
  const [editNameValue, setEditNameValue] = useState("");
  const [editGenderValue, setEditGenderValue] = useState<'boy' | 'girl'>('boy');
  
  const [isSaving, setIsSaving] = useState(false);

  async function loadNames() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("baby_names")
        .select("*")
        .eq("child_id", childId)
        .order('created_at', { ascending: true });
      
      if (data) setNames(data);
    } catch (err) {
      console.error("Error loading names:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNames();
  }, [childId]);

  async function handleAddName() {
    if (!newName.trim()) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("baby_names")
        .insert({
          child_id: childId,
          name: newName.trim(),
          gender: selectedGender,
          is_crossed: false
        })
        .select()
        .single();

      if (data) {
        setNames([...names, data]);
        setShowAddModal(false);
        setNewName("");
      }
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateName() {
    if (!editingName || !editNameValue.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("baby_names")
        .update({
          name: editNameValue.trim(),
          gender: editGenderValue
        })
        .eq("id", editingName.id);

      if (!error) {
        setNames(names.map(n => n.id === editingName.id ? { ...n, name: editNameValue.trim(), gender: editGenderValue } : n));
        setShowEditModal(false);
        setEditingName(null);
      }
    } catch (err) {
      alert("Error al actualizar");
    } finally {
      setIsSaving(false);
    }
  }

  async function strikeName(id: string) {
    const { error } = await supabase
      .from("baby_names")
      .update({ is_crossed: true })
      .eq("id", id);
    
    if (!error) {
      setNames(names.map(n => n.id === id ? { ...n, is_crossed: true } : n));
    }
  }

  const startEdit = (item: BabyName) => {
    setEditingName(item);
    setEditNameValue(item.name);
    setEditGenderValue(item.gender);
    setShowEditModal(true);
  };

  const boys = names.filter(n => n.gender === 'boy');
  const girls = names.filter(n => n.gender === 'girl');

  return (
    <div className="flex-1 flex flex-col pb-32 relative">
      {/* CABECERA MÓVIL UNIFICADA (Estilo Baúl adaptado al Tema) */}
      <div className={`fixed top-0 left-0 right-0 z-[150] bg-white/70 backdrop-blur-xl border-b ${theme.borderAccent} px-6 py-4 flex items-center justify-between shadow-sm`}>
        <button 
          onClick={onBack} 
          className={`p-2 bg-white rounded-xl shadow-md ${theme.text} border ${theme.borderAccent} active:scale-90 transition-all`}
        >
          <ChevronLeft size={20} />
        </button>
        
        <h1 className={`text-lg font-black ${theme.text} tracking-tighter italic`}>
          Futuro Nombre
        </h1>

        <button 
          onClick={() => { setSelectedGender('boy'); setShowAddModal(true); }}
          className={`w-10 h-10 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all`}
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Pantalla Dividida (Siempre Lado a Lado como columnas) */}
      <div className="flex-1 flex flex-row h-full pt-[72px]">
        {/* Lado NIÑO (Celeste) */}
        <div className="flex-1 bg-[#F0F9FF]/60 p-3 md:p-12 border-r border-white">
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-6 md:mb-8">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center shadow-inner">
              <Baby size={isMobile ? 16 : 24} />
            </div>
            <h2 className="text-sm md:text-2xl font-black text-blue-600/60 italic tracking-tighter">
              {isMobile ? "Niño" : "Nombres de Niño"}
            </h2>
          </div>

          <div className="space-y-3">
            {boys.map((item) => (
              <NameRow 
                key={item.id} 
                item={item} 
                isMobile={isMobile}
                onStrike={() => strikeName(item.id)} 
                onEdit={() => startEdit(item)}
                colorClass="bg-white hover:bg-blue-50 text-blue-800"
                strikeClass="bg-blue-800/10"
                theme={theme}
              />
            ))}
            {boys.length === 0 && (
              <div className={`py-12 md:py-20 text-center ${theme.text} opacity-20 font-black uppercase tracking-widest italic text-[10px]`}>Sin candidatos</div>
            )}
          </div>
        </div>

        {/* Lado NIÑA (Rosado) */}
        <div className="flex-1 bg-[#FFF5F7]/60 p-3 md:p-12">
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-6 md:mb-8">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center shadow-inner">
              <Heart size={isMobile ? 16 : 24} />
            </div>
            <h2 className="text-sm md:text-2xl font-black text-pink-600/60 italic tracking-tighter">
              {isMobile ? "Niña" : "Nombres de Niña"}
            </h2>
          </div>

          <div className="space-y-3">
            {girls.map((item) => (
              <NameRow 
                key={item.id} 
                item={item} 
                isMobile={isMobile}
                onStrike={() => strikeName(item.id)} 
                onEdit={() => startEdit(item)}
                colorClass="bg-white hover:bg-pink-50 text-pink-800"
                strikeClass="bg-pink-800/10"
                theme={theme}
              />
            ))}
            {girls.length === 0 && (
              <div className={`py-12 md:py-20 text-center ${theme.text} opacity-20 font-black uppercase tracking-widest italic text-[10px]`}>Sin candidatas</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Agregar */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white rounded-[3rem] p-8 md:p-12 max-w-md w-full shadow-2xl border ${theme.borderAccent}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className={`text-2xl font-black ${theme.text} tracking-tighter italic`}>Nuevo Candidato</h3>
                <button onClick={() => setShowAddModal(false)} className={`p-2 ${theme.text} opacity-30 hover:opacity-100 hover:text-red-500 transition-colors`}><X size={24} /></button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className={`text-[10px] font-black ${theme.text} opacity-40 uppercase tracking-widest mb-3 block ml-1`}>Escribe el nombre</label>
                  <input 
                    autoFocus
                    placeholder="Ej: Alexander"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={`w-full p-5 ${theme.bgLight} rounded-2xl outline-none text-xl font-black ${theme.text} border-2 border-transparent focus:border-current transition-all`}
                    style={{ focusBorderColor: theme.hex } as any}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-black ${theme.text} opacity-40 uppercase tracking-widest mb-3 block ml-1`}>¿Niño o Niña?</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setSelectedGender('boy')}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-4 ${selectedGender === 'boy' ? 'bg-blue-500 text-white border-blue-200 shadow-xl scale-105' : 'bg-blue-50 text-blue-400 border-transparent opacity-60'}`}
                    >
                      <Baby size={18} /> Niño
                    </button>
                    <button 
                      onClick={() => setSelectedGender('girl')}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-4 ${selectedGender === 'girl' ? 'bg-pink-500 text-white border-pink-200 shadow-xl scale-105' : 'bg-pink-50 text-pink-400 border-transparent opacity-60'}`}
                    >
                      <Heart size={18} /> Niña
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleAddName}
                  disabled={!newName.trim() || isSaving}
                  className={`w-full py-5 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl disabled:opacity-20 transition-all hover:scale-[1.02]`}
                >
                  {isSaving ? "Guardando..." : "Agregar a la lista"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal para Editar */}
      <AnimatePresence>
        {showEditModal && editingName && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white rounded-[3rem] p-8 md:p-12 max-w-md w-full shadow-2xl border ${theme.borderAccent}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className={`text-2xl font-black ${theme.text} tracking-tighter italic`}>Editar Candidato</h3>
                <button onClick={() => setShowEditModal(false)} className={`p-2 ${theme.text} opacity-30 hover:opacity-100 hover:text-red-500 transition-colors`}><X size={24} /></button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className={`text-[10px] font-black ${theme.text} opacity-40 uppercase tracking-widest mb-3 block ml-1`}>Modificar nombre</label>
                  <input 
                    autoFocus
                    placeholder="Ej: Alexander"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    className={`w-full p-5 ${theme.bgLight} rounded-2xl outline-none text-xl font-black ${theme.text} border-2 border-transparent focus:border-current transition-all`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-black ${theme.text} opacity-40 uppercase tracking-widest mb-3 block ml-1`}>¿Cambiar Género?</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setEditGenderValue('boy')}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-4 ${editGenderValue === 'boy' ? 'bg-blue-500 text-white border-blue-200 shadow-xl scale-105' : 'bg-blue-50 text-blue-400 border-transparent opacity-60'}`}
                    >
                      <Baby size={18} /> Niño
                    </button>
                    <button 
                      onClick={() => setEditGenderValue('girl')}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-4 ${editGenderValue === 'girl' ? 'bg-pink-500 text-white border-pink-200 shadow-xl scale-105' : 'bg-pink-50 text-pink-400 border-transparent opacity-60'}`}
                    >
                      <Heart size={18} /> Niña
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleUpdateName}
                  disabled={!editNameValue.trim() || isSaving}
                  className={`w-full py-5 ${theme.primaryBg} ${theme.textActive} hover:${theme.hoverBg} rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl disabled:opacity-20 transition-all hover:scale-[1.02]`}
                >
                  {isSaving ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NameRow({ item, onStrike, onEdit, isMobile, theme }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center py-2 transition-all ${item.is_crossed ? 'opacity-30' : ''}`}
    >
      <div className="relative flex items-center gap-4 md:gap-8">
        <span className={`text-lg md:text-[45px] font-bold tracking-tight ${theme.text} ${item.is_crossed ? 'line-through decoration-2' : ''}`}>
          {item.name}
        </span>
        
        {!item.is_crossed && (
          <div className="flex items-center gap-2">
            <button 
              onClick={onEdit}
              title="Editar"
              className={`p-1.5 ${theme.text} opacity-40 hover:opacity-100 hover:scale-110 transition-all`}
            >
              <Pencil size={isMobile ? 14 : 22} />
            </button>
            <button 
              onClick={onStrike}
              title="Tachar"
              className="p-1.5 text-red-500/40 hover:text-red-600 hover:scale-110 transition-all"
            >
              <X size={isMobile ? 14 : 22} />
            </button>
          </div>
        )}

        {item.is_crossed && (
          <div className="absolute left-0 right-0 h-0.5 bg-red-500 top-1/2 -translate-y-1/2 opacity-70" />
        )}
      </div>
    </motion.div>
  );
}
