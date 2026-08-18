"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Trash2, 
  KeyRound, 
  Upload,
  Check,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutTemplate
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import TemplateEditor from "../Desktop/TemplateEditor";

type Tab = "usuarios" | "assets" | "user_assets" | "templates";

export default function MobileAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>("usuarios");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col overflow-hidden relative">
      
      {/* OVERLAY */}
      {isSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* DRAWER SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-white border-r border-taupe/10 flex flex-col transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-outfit font-bold text-taupe">Admin<span className="text-sage">Panel</span></h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-taupe/40 p-2"><X size={24} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-2">
          <button onClick={() => { setActiveTab("usuarios"); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "usuarios" ? "bg-sage/10 text-sage font-bold" : "text-taupe/60 hover:bg-taupe/5"}`}>
            <Users size={20} /> Gestión de Usuarios
          </button>
          <button onClick={() => { setActiveTab("assets"); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "assets" ? "bg-gold/10 text-gold font-bold" : "text-taupe/60 hover:bg-taupe/5"}`}>
            <ImageIcon size={20} /> Assets Globales
          </button>
          <button onClick={() => { setActiveTab("user_assets"); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "user_assets" ? "bg-sage/10 text-sage font-bold" : "text-taupe/60 hover:bg-taupe/5"}`}>
            <ImageIcon size={20} /> Assets Usuarios
          </button>
          <button onClick={() => { setActiveTab("templates"); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "templates" ? "bg-purple-500/10 text-purple-600 font-bold" : "text-taupe/60 hover:bg-taupe/5"}`}>
            <LayoutTemplate size={20} /> Creador Plantillas
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-taupe/60 hover:bg-taupe/5">
            <Settings size={20} /> Configuración
          </button>
        </nav>
        <div className="p-4 border-t border-taupe/10">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 bg-red-50 rounded-xl font-bold">
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-taupe/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-taupe/60 bg-white rounded-lg shadow-sm border border-taupe/10"><Menu size={20} /></button>
          <h1 className="text-lg font-outfit font-bold text-taupe capitalize">{activeTab === "usuarios" ? "Usuarios" : activeTab === "assets" ? "Assets Globales" : activeTab === "templates" ? "Plantillas" : "Assets Usuarios"}</h1>
        </div>
      </header>

      {/* CONTENT */}
      <div className="p-4 flex-1 overflow-y-auto">
        {activeTab === "usuarios" ? <UsersTab /> : activeTab === "assets" ? <AssetsTab /> : activeTab === "templates" ? <TemplateEditor onBack={() => setActiveTab("usuarios")} /> : <UserAssetsTab />}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", role: "parent" });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${await getSessionToken()}` }
    });
    if (res.ok) {
      const { users } = await res.json();
      setUsers(users || []);
    }
  }

  async function getSessionToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [passwordModal, setPasswordModal] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getSessionToken()}` },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setShowNewUserModal(false);
        setNewUser({ email: "", password: "", full_name: "", role: "parent" });
        fetchUsers();
        showToast("success", "Usuario creado correctamente.");
      } else {
        const error = await res.json();
        showToast("error", `Error: ${error.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModal || newPassword.length < 6) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getSessionToken()}` },
        body: JSON.stringify({ userId: passwordModal, newPassword })
      });
      if (res.ok) {
        showToast("success", "Contraseña actualizada.");
        setPasswordModal(null);
        setNewPassword("");
      } else {
        showToast("error", "Error al actualizar la contraseña.");
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Error de conexión.");
    }
  };

  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<{ step: number; text: string } | null>(null);

  const confirmDelete = async () => {
    if (!deletingUser) return;
    
    setDeleteProgress({ step: 10, text: "Preparando..." });
    await new Promise(r => setTimeout(r, 800));
    setDeleteProgress({ step: 40, text: "Borrando fotos en Cloudflare R2..." });
    await new Promise(r => setTimeout(r, 1200));
    setDeleteProgress({ step: 70, text: "Eliminando diarios y DB..." });
    await new Promise(r => setTimeout(r, 1000));
    setDeleteProgress({ step: 90, text: "Revocando accesos..." });
    
    try {
      const res = await fetch(`/api/admin/users?id=${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await getSessionToken()}` }
      });
      if (res.ok) {
        setDeleteProgress({ step: 100, text: "¡Eliminado con éxito!" });
        await new Promise(r => setTimeout(r, 600));
        setUsers(users.filter(u => u.id !== deletingUser.id));
        showToast("success", "Usuario eliminado.");
      } else {
        showToast("error", "Error al eliminar usuario.");
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Error de conexión.");
    } finally {
      setDeletingUser(null);
      setDeleteProgress(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-20">
      
      {/* Search and Add User Button */}
      <div className="flex gap-2">
        <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-taupe/5 flex items-center gap-2">
          <Search size={18} className="text-taupe/30" />
          <input type="text" placeholder="Buscar usuario..." className="bg-transparent border-none outline-none w-full text-taupe text-sm" />
        </div>
        <button onClick={() => setShowNewUserModal(true)} className="bg-sage text-white px-4 rounded-xl font-medium flex items-center justify-center shadow-md">
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="text-center p-8 text-taupe/50 text-sm">No hay usuarios registrados</div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-taupe/5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-taupe">{user.full_name || 'Usuario Sin Nombre'}</p>
                  <p className="text-xs text-taupe/50 mt-1">ID: {user.id.slice(0, 8)}...</p>
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-gold/10 text-gold' : 'bg-sage/10 text-sage'}`}>
                  {user.role}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-taupe/5">
                <button onClick={() => setPasswordModal(user.id)} className="flex-1 py-2 bg-taupe/5 text-taupe rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:bg-gold/10 hover:text-gold transition-colors">
                  <KeyRound size={16} /> Contraseña
                </button>
                <button onClick={() => setDeletingUser(user)} className="py-2 px-4 bg-red-50 text-red-500 rounded-xl flex items-center justify-center text-sm font-bold hover:bg-red-100 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 mt-6">
        <Trash2 className="text-red-500 shrink-0" size={20} />
        <div>
          <h4 className="text-red-800 font-bold text-sm">Zona de Peligro</h4>
          <p className="text-red-600 text-[10px] mt-1 leading-relaxed">Borrar usuario elimina todo de forma permanente.</p>
        </div>
      </div>

      {showNewUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-outfit font-bold text-taupe mb-4">Crear Usuario</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-taupe/50 ml-1">Nombre</label>
                <input required type="text" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} className="w-full mt-1 p-3 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-sage/30 text-taupe text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-taupe/50 ml-1">Email</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full mt-1 p-3 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-sage/30 text-taupe text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-taupe/50 ml-1">Contraseña</label>
                <input required minLength={6} type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full mt-1 p-3 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-sage/30 text-taupe text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-taupe/50 ml-1">Rol</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full mt-1 p-3 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-sage/30 text-taupe text-sm">
                  <option value="parent">Familia</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowNewUserModal(false)} className="flex-1 p-3 text-taupe/60 hover:bg-taupe/5 rounded-xl font-bold transition-colors text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 p-3 bg-sage text-white rounded-xl font-bold shadow-md hover:bg-sage/90 transition-all text-sm disabled:opacity-50">{loading ? "Creando..." : "Crear"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl overflow-hidden relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-outfit font-bold text-taupe mb-2">Eliminar Cuenta</h3>
              <p className="text-taupe/70 text-xs mb-6">
                Borrando definitivamente a <strong className="text-taupe">{deletingUser.full_name || 'este usuario'}</strong>. Acción irreversible.
              </p>

              {deleteProgress ? (
                <div className="w-full space-y-3 mt-4">
                  <div className="flex justify-between text-[10px] font-bold text-taupe/50">
                    <span>{deleteProgress.text}</span>
                    <span>{deleteProgress.step}%</span>
                  </div>
                  <div className="w-full h-2 bg-taupe/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-red-500 rounded-full" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${deleteProgress.step}%` }} 
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 w-full mt-2">
                  <button onClick={confirmDelete} className="w-full p-3 bg-red-500 text-white rounded-xl font-bold shadow-md hover:bg-red-600 transition-all flex items-center justify-center gap-2 text-sm">
                    <Trash2 size={16} /> Destruir Todo
                  </button>
                  <button onClick={() => setDeletingUser(null)} className="w-full p-3 text-taupe/60 hover:bg-taupe/5 rounded-xl font-bold transition-colors text-sm">
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-outfit font-bold text-taupe mb-2">Cambiar Contraseña</h3>
            <p className="text-xs text-taupe/50 mb-6">Mínimo 6 caracteres.</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <input required minLength={6} type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-gold/30 text-taupe text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setPasswordModal(null)} className="flex-1 p-3 text-taupe/60 hover:bg-taupe/5 rounded-xl font-bold transition-colors text-sm">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-gold text-white rounded-xl font-bold shadow-md hover:bg-gold/90 transition-all text-sm">Guardar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-20 left-4 right-4 p-4 rounded-xl shadow-lg font-bold text-white flex items-center justify-center gap-2 z-[60] text-sm ${toast.type === 'success' ? 'bg-sage' : 'bg-red-500'}`}
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  );
}

function AssetsTab() {
  const [assetType, setAssetType] = useState("sticker"); // 'sticker', 'background', 'tape'
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [assetType]);

  async function fetchAssets() {
    const res = await fetch(`/api/admin/assets?type=${assetType}`);
    if (res.ok) {
      const { assets } = await res.json();
      setAssets(assets || []);
    }
  }

  async function getSessionToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    setUploadProgress({ current: 0, total: files.length, fileName: "" });
    
    const token = await getSessionToken();
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length, fileName: file.name });
      
      const formData = new FormData();
      formData.append('files', file);
      formData.append('type', assetType);
      
      try {
        const res = await fetch('/api/admin/assets', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (res.ok) successCount++;
      } catch (err) {
        console.error(`Error:`, err);
      }
    }

    setUploadProgress(null);
    fetchAssets();
    if (successCount > 0) {
      showToast("success", `Se subieron ${successCount} archivos.`);
    }
    e.target.value = '';
  };

  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    try {
      const res = await fetch(`/api/admin/assets?id=${assetToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await getSessionToken()}` }
      });
      if (res.ok) {
        fetchAssets();
        showToast("success", "Asset eliminado.");
      } else {
        showToast("error", "Error al eliminar el asset.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error de conexión.");
    } finally {
      setAssetToDelete(null);
    }
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number; text: string } | null>(null);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setDeleteProgress({ current: 0, total: selectedIds.length, text: "Borrando selección..." });
    const token = await getSessionToken();
    let successCount = 0;

    for (let i = 0; i < selectedIds.length; i++) {
      const id = selectedIds[i];
      setDeleteProgress({ current: i + 1, total: selectedIds.length, text: `Borrando ${i + 1}/${selectedIds.length}` });
      
      try {
        const res = await fetch(`/api/admin/assets?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) successCount++;
      } catch (err) {
        console.error(`Error:`, err);
      }
    }

    setDeleteProgress(null);
    setSelectedIds([]);
    fetchAssets();
    showToast("success", `Eliminados ${successCount} assets.`);
  };

  const assetTypes = [
    { id: "sticker", label: "Stickers" },
    { id: "background", label: "Fondos" },
    { id: "tape", label: "Cintas" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-taupe/5 w-full">
          {assetTypes.map((type) => (
            <button 
              key={type.id} 
              onClick={() => {
                setAssetType(type.id);
                setSelectedIds([]);
              }} 
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${assetType === type.id ? "bg-gold text-white" : "text-taupe/50"}`}
            >
              {type.label}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          {selectedIds.length > 0 ? (
            <button 
              onClick={handleBulkDelete}
              className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg animate-in fade-in zoom-in duration-200"
            >
              <Trash2 size={18} /> Borrar {selectedIds.length}
            </button>
          ) : (
            <label className="flex-1 bg-white border border-taupe/10 text-taupe py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 transition-transform">
              <Upload size={18} /> 
              {loading ? "Subiendo..." : `Subir Múltiples`}
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={loading}
              />
            </label>
          )}
          
          {assets.length > 0 && (
            <button 
              onClick={() => setSelectedIds(selectedIds.length === assets.length ? [] : assets.map(a => a.id))}
              className="p-3 bg-white border border-taupe/10 rounded-xl text-taupe/50"
            >
              <Check size={20} className={selectedIds.length === assets.length ? "text-gold" : ""} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 min-h-[300px] border border-taupe/5 shadow-sm">
        {assets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <ImageIcon size={40} className="text-taupe/20 mb-4" />
            <h3 className="text-taupe font-bold text-base">No hay {assetTypes.find(t => t.id === assetType)?.label.toLowerCase()}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {assets.map((asset) => (
              <motion.div 
                key={asset.id} 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                onClick={() => toggleSelection(asset.id)}
                className={`relative aspect-square rounded-xl overflow-hidden border transition-all flex items-center justify-center ${selectedIds.includes(asset.id) ? 'border-gold ring-2 ring-gold/20 bg-gold/5' : 'bg-taupe/5 border-taupe/10'}`}
              >
                <img 
                  src={asset.url} 
                  alt={asset.type} 
                  className={`max-w-full max-h-full object-contain p-1 ${asset.type === 'background' ? 'object-cover w-full h-full p-0' : ''}`}
                />
                
                {/* Checkbox */}
                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full border flex items-center justify-center ${selectedIds.includes(asset.id) ? 'bg-gold border-gold text-white' : 'bg-white/50 border-taupe/20'}`}>
                  {selectedIds.includes(asset.id) && <Check size={12} strokeWidth={4} />}
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssetToDelete(asset.id);
                  }} 
                  className="absolute top-1 right-1 p-1.5 bg-red-500/90 text-white rounded-lg shadow-md"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {assetToDelete && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-outfit font-bold text-taupe mb-2">Borrar Global</h3>
            <p className="text-xs text-taupe/60 mb-6">Esta imagen se eliminará para todos los usuarios. ¿Continuar?</p>
            <div className="flex gap-2">
              <button onClick={() => setAssetToDelete(null)} className="flex-1 p-3 text-taupe/60 hover:bg-taupe/5 rounded-xl font-bold transition-colors text-sm">Cancelar</button>
              <button onClick={confirmDeleteAsset} className="flex-1 p-3 bg-red-500 text-white rounded-xl font-bold shadow-md hover:bg-red-600 transition-all text-sm">Borrar</button>
            </div>
          </motion.div>
        </div>
      )}

      {uploadProgress && (
        <div className="fixed inset-0 bg-taupe/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-4">
                <Upload size={24} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-outfit font-bold text-taupe mb-2">Subiendo...</h3>
              
              <div className="w-full space-y-3 mt-4">
                <div className="flex justify-between text-[10px] font-bold text-taupe/50">
                  <span className="truncate max-w-[150px]">{uploadProgress.fileName}</span>
                  <span>{uploadProgress.current}/{uploadProgress.total}</span>
                </div>
                <div className="w-full h-2 bg-taupe/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gold rounded-full" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {deleteProgress && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={24} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-outfit font-bold text-taupe mb-2">Borrando...</h3>
              <p className="text-taupe/70 text-xs mb-6">{deleteProgress.text}</p>

              <div className="w-full h-2 bg-taupe/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-red-500 rounded-full" 
                  initial={{ width: 0 }} 
                  animate={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }} 
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-20 left-4 right-4 p-4 rounded-xl shadow-lg font-bold text-white flex items-center justify-center gap-2 z-[60] text-sm ${toast.type === 'success' ? 'bg-sage' : 'bg-red-500'}`}
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  );
}

function UserAssetsTab() {
  const [groupedAssets, setGroupedAssets] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchUserAssets();
  }, []);

  async function fetchUserAssets() {
    setLoading(true);
    try {
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = (assets || []).reduce((acc: any, asset) => {
        const userId = asset.user_id || 'unknown';
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(asset);
        return acc;
      }, {});

      setGroupedAssets(grouped);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Error al cargar assets de usuarios" });
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) {
      setToast({ type: "error", message: "No se pudo eliminar el asset" });
    } else {
      setToast({ type: "success", message: "Asset eliminado" });
      fetchUserAssets();
    }
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="p-10 text-center text-taupe/40">Cargando archivos de usuarios...</div>;

  const userIds = Object.keys(groupedAssets);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
      {userIds.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-taupe/20">
          <ImageIcon className="mx-auto text-taupe/20 mb-4" size={40} />
          <p className="text-taupe/50">No hay archivos subidos por usuarios</p>
        </div>
      ) : (
        userIds.map(userId => (
          <div key={userId} className="bg-white rounded-3xl p-5 shadow-sm border border-taupe/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-taupe flex items-center gap-2">
                <Users size={16} className="text-sage" />
                Usuario: <span className="text-taupe/60 font-mono text-[10px]">{userId.slice(0, 8)}...</span>
              </h3>
              <span className="text-[10px] font-bold bg-sage/10 text-sage px-2 py-1 rounded-full">
                {groupedAssets[userId].length} archivos
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {groupedAssets[userId].map(asset => (
                <div key={asset.id} className="relative aspect-square bg-taupe/5 rounded-xl overflow-hidden border border-taupe/10 group">
                  <img src={asset.url} alt="" className="w-full h-full object-contain p-1" />
                  <button 
                    onClick={() => handleDelete(asset.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg shadow-lg opacity-80 active:scale-90"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
          className={`fixed bottom-20 left-4 right-4 p-4 rounded-xl shadow-lg font-bold text-white text-center z-[60] ${toast.type === 'success' ? 'bg-sage' : 'bg-red-500'}`}
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  );
}
