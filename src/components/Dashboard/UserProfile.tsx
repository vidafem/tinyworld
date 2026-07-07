"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Settings, Shield, Image as ImageIcon, 
  Sticker as StickerIcon, Plus, Trash2, 
  ChevronLeft, Loader2, Camera, Lock,
  Check, X, UploadCloud, Palette
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserProfileProps {
  onBack: () => void;
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [myAssets, setMyAssets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'stickers' | 'backgrounds'>('info');
  const [uploading, setUploading] = useState(false);
  
  // Perfil Info
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchMyAssets();
  }, []);

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    if (profile) {
      setDisplayName(profile.display_name || session.user.email?.split('@')[0] || "");
    }
    setLoading(false);
  }

  async function fetchMyAssets() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", session.user.id)
      .order('created_at', { ascending: false });
    
    setMyAssets(data || []);
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    const updates = {
      id: user.id,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(updates);
    
    if (newPassword) {
      const { error: passError } = await supabase.auth.updateUser({ password: newPassword });
      if (passError) alert("Error al actualizar contraseña");
      else setNewPassword("");
    }

    setUpdating(false);
    if (!error) alert("Perfil actualizado correctamente");
  };

  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>, type: 'sticker' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `user_assets/${user.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;

      const { error: insertError } = await supabase.from('assets').insert([{
        type: type,
        url: publicUrl,
        user_id: user.id,
        name: file.name
      }]);

      if (insertError) throw insertError;

      fetchMyAssets();
    } catch (err: any) {
      console.error(err);
      alert(`Error al subir: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (id: string, url: string) => {
    if (!confirm("¿Eliminar este elemento de tu librería?")) return;
    
    const path = url.split('/assets/').pop();
    if (path) {
      await supabase.storage.from('assets').remove([path]);
    }
    
    await supabase.from('assets').delete().eq('id', id);
    fetchMyAssets();
  };

  const filteredAssets = myAssets.filter(a => {
    if (activeTab === 'stickers') return a.type === 'sticker';
    if (activeTab === 'backgrounds') return a.type === 'background';
    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-sage" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-texture p-6 md:p-12 flex flex-col items-center">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <button onClick={onBack} className="p-4 bg-white rounded-2xl shadow-sm text-taupe hover:text-gold transition-colors flex items-center gap-2 font-bold uppercase text-xs tracking-widest border border-taupe/5">
            <ChevronLeft size={20} /> Volver
          </button>
          <div className="text-right">
            <h1 className="text-3xl md:text-4xl font-outfit font-black text-taupe tracking-tighter">Mi Perfil Creativo</h1>
            <p className="text-sm text-taupe/60 italic">Gestiona tus tesoros privados</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 space-y-3">
            <button 
              onClick={() => setActiveTab('info')}
              className={`w-full p-6 rounded-3xl flex items-center gap-4 transition-all border-2 ${activeTab === 'info' ? 'bg-taupe text-white border-taupe shadow-xl' : 'bg-white text-taupe border-transparent hover:bg-taupe/5 shadow-sm'}`}
            >
              <User size={22} />
              <span className="font-black uppercase tracking-widest text-[10px]">Mis Datos</span>
            </button>
            <button 
              onClick={() => setActiveTab('stickers')}
              className={`w-full p-6 rounded-3xl flex items-center gap-4 transition-all border-2 ${activeTab === 'stickers' ? 'bg-gold text-white border-gold shadow-xl' : 'bg-white text-taupe border-transparent hover:bg-gold/5 shadow-sm'}`}
            >
              <StickerIcon size={22} />
              <span className="font-black uppercase tracking-widest text-[10px]">Mis Stickers</span>
            </button>
            <button 
              onClick={() => setActiveTab('backgrounds')}
              className={`w-full p-6 rounded-3xl flex items-center gap-4 transition-all border-2 ${activeTab === 'backgrounds' ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white text-taupe border-transparent hover:bg-blue-50 shadow-sm'}`}
            >
              <ImageIcon size={22} />
              <span className="font-black uppercase tracking-widest text-[10px]">Mis Fondos</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 shadow-2xl border-4 border-white min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeTab === 'info' ? (
                <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <h2 className="text-3xl font-outfit font-black text-taupe mb-8 tracking-tight">Información de Cuenta</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-xl">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-taupe/40 uppercase tracking-[0.2em]">Nombre Público</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/30" size={20} />
                        <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-taupe/5 rounded-2xl outline-none focus:ring-4 ring-gold/10 font-bold text-taupe" placeholder="Tu nombre..." />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-taupe/40 uppercase tracking-[0.2em]">Email</label>
                      <input disabled value={user?.email || ""} className="w-full px-6 py-4 bg-taupe/5 rounded-2xl text-taupe/30 cursor-not-allowed font-medium" />
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t-2 border-taupe/5">
                      <label className="text-[10px] font-black text-taupe/40 uppercase tracking-[0.2em] flex items-center gap-2"><Lock size={12}/> Nueva Contraseña</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-6 py-4 bg-taupe/5 rounded-2xl outline-none focus:ring-4 ring-gold/10 text-taupe" placeholder="Mínimo 6 caracteres..." />
                    </div>

                    <button disabled={updating} type="submit" className="w-full py-5 bg-taupe text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                      {updating ? <Loader2 className="animate-spin" /> : <><Check size={18}/> Actualizar Perfil</>}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                      <h2 className="text-3xl font-outfit font-black text-taupe tracking-tight">
                        {activeTab === 'stickers' ? 'Mis Stickers Privados' : 'Mis Fondos Exclusivos'}
                      </h2>
                      <p className="text-sm text-taupe/40">
                        {activeTab === 'stickers' ? 'Sube elementos decorativos para tus diseños.' : 'Sube imágenes para el fondo de tus calendarios.'}
                      </p>
                    </div>
                    
                    <label className={`cursor-pointer flex items-center gap-3 px-8 py-5 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all ${activeTab === 'stickers' ? 'bg-gold' : 'bg-blue-600'}`}>
                      <Plus size={20} /> Subir {activeTab === 'stickers' ? 'Sticker' : 'Fondo'}
                      <input type="file" hidden accept="image/*" onChange={e => handleUploadAsset(e, activeTab === 'stickers' ? 'sticker' : 'background')} />
                    </label>
                  </div>

                  {uploading && (
                    <div className="mb-8 p-8 bg-white border-4 border-dashed border-gold/20 rounded-[3rem] flex items-center justify-center gap-4">
                      <Loader2 className="animate-spin text-gold" size={32} />
                      <span className="text-sm font-black text-gold uppercase tracking-widest">Añadiendo a tu librería...</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {filteredAssets.length === 0 && !uploading && (
                      <div className="col-span-full py-32 flex flex-col items-center opacity-10">
                        <UploadCloud size={100} className="mb-4" />
                        <p className="text-2xl font-black uppercase tracking-widest text-center">No hay archivos aquí todavía</p>
                      </div>
                    )}
                    {filteredAssets.map(asset => (
                      <motion.div 
                        layout
                        key={asset.id} 
                        className="group relative aspect-square bg-white rounded-[2.5rem] shadow-sm border-4 border-white hover:shadow-xl transition-all p-6 overflow-hidden"
                      >
                        <img src={asset.url} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        <button 
                          onClick={() => handleDeleteAsset(asset.id, asset.url)}
                          className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"
                        >
                          <Trash2 size={32} className="mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Eliminar</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
