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
  ShieldCheck, 
  ExternalLink, 
  LogOut, 
  Upload,
  Check,
  Settings,
  LayoutTemplate
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import TemplateEditor from "./TemplateEditor";

type Tab = "usuarios" | "assets" | "user_assets" | "templates";

export default function DesktopAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>("usuarios");
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (activeTab === "templates") {
    return <TemplateEditor onBack={() => setActiveTab("usuarios")} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-taupe/10 flex flex-col">
        <div className="p-8">
          <h2 className="text-2xl font-outfit font-bold text-taupe">Admin<span className="text-sage">Panel</span></h2>
          <p className="text-xs text-taupe/50 mt-1">Gestión de TinyWorld</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab("usuarios")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "usuarios" ? "bg-sage/10 text-sage font-bold" : "text-taupe/60 hover:bg-taupe/5"}`}>
            <Users size={20} /> Gestión de Usuarios
          </button>
          <button onClick={() => setActiveTab("assets")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "assets" ? "bg-gold/10 text-gold font-bold" : "text-taupe/60 hover:bg-taupe/5"}`}>
            <ImageIcon size={20} /> Assets Globales
          </button>
          <button onClick={() => setActiveTab("user_assets")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "user_assets" ? "bg-blue-500/10 text-blue-500 font-bold" : "text-taupe/60 hover:bg-taupe/5"}`}>
            <Upload size={20} /> Assets Usuarios
          </button>
          <button onClick={() => setActiveTab("templates")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${(activeTab as Tab) === "templates" ? "bg-purple-500/10 text-purple-600 font-bold" : "text-taupe/60 hover:bg-taupe/5"}`}>
            <LayoutTemplate size={20} /> Creador de Plantillas
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-taupe/60 hover:bg-taupe/5">
            <Settings size={20} /> Configuración
          </button>
        </nav>

        <div className="p-4 border-t border-taupe/10">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium">
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-taupe/10 p-6 flex items-center justify-between">
          <h1 className="text-2xl font-outfit font-bold text-taupe capitalize">
            {activeTab === "usuarios" ? "Gestión de Usuarios" : activeTab === "assets" ? "Assets Globales" : "Assets de Usuarios"}
          </h1>
        </header>
        <div className="p-8 flex-1">
          {activeTab === "usuarios" ? <UsersTab /> : activeTab === "assets" ? <AssetsTab /> : <UserAssetsTab />}
        </div>
      </main>
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
        showToast("success", "Contraseña actualizada con éxito.");
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
    
    setDeleteProgress({ step: 10, text: "Preparando eliminación de datos..." });
    await new Promise(r => setTimeout(r, 800));
    setDeleteProgress({ step: 40, text: "Borrando fotos, videos y assets en Cloudflare R2..." });
    await new Promise(r => setTimeout(r, 1200));
    setDeleteProgress({ step: 70, text: "Eliminando diarios y perfiles en base de datos..." });
    await new Promise(r => setTimeout(r, 1000));
    setDeleteProgress({ step: 90, text: "Revocando accesos y eliminando cuenta..." });
    
    try {
      const res = await fetch(`/api/admin/users?id=${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await getSessionToken()}` }
      });
      if (res.ok) {
        setDeleteProgress({ step: 100, text: "¡Usuario eliminado con éxito!" });
        await new Promise(r => setTimeout(r, 600));
        setUsers(users.filter(u => u.id !== deletingUser.id));
        showToast("success", "Usuario eliminado permanentemente.");
      } else {
        showToast("error", "Error al eliminar el usuario en el servidor.");
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Error de conexión al intentar eliminar.");
    } finally {
      setDeletingUser(null);
      setDeleteProgress(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-taupe/5 flex items-center gap-3 w-full max-w-md">
          <Search size={20} className="text-taupe/30" />
          <input type="text" placeholder="Buscar usuario por nombre..." className="bg-transparent border-none outline-none w-full text-taupe placeholder:text-taupe/40" />
        </div>
        <button onClick={() => setShowNewUserModal(true)} className="bg-sage text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-sage/90 shadow-sm transition-all">
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-taupe/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-taupe/5 text-taupe/60 text-xs uppercase tracking-wider">
              <th className="p-5 font-bold">Usuario</th>
              <th className="p-5 font-bold">ID</th>
              <th className="p-5 font-bold">Rol</th>
              <th className="p-5 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-taupe/5">
            {users.length === 0 ? (
              <tr><td colSpan={4} className="p-5 text-center text-taupe/50">No hay usuarios</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-taupe/5 transition-colors group">
                  <td className="p-5 font-medium text-taupe">{user.full_name || 'Sin nombre'}</td>
                  <td className="p-5 text-taupe/50 text-xs">{user.id}</td>
                  <td className="p-5 text-taupe/70">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-gold/10 text-gold' : 'bg-sage/10 text-sage'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <button onClick={() => setPasswordModal(user.id)} className="p-2 text-taupe/50 hover:text-gold transition-colors" title="Cambiar Contraseña"><KeyRound size={18} /></button>
                    <button onClick={() => setDeletingUser(user)} className="p-2 text-taupe/50 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
        <Trash2 className="text-red-500 shrink-0" />
        <div>
          <h4 className="text-red-800 font-bold text-sm">Zona de Peligro</h4>
          <p className="text-red-600 text-xs mt-1 leading-relaxed">Eliminar usuario borrará absolutamente todo (incluyendo fotos y configuración). Acción 100% irreversible.</p>
        </div>
      </div>

      {showNewUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-outfit font-bold text-taupe mb-6">Crear Usuario</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-taupe/50 ml-1">Nombre Completo</label>
                <input required type="text" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} className="w-full mt-1 p-3 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-sage/30 text-taupe" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-taupe/50 ml-1">Email</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full mt-1 p-3 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-sage/30 text-taupe" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-taupe/50 ml-1">Contraseña</label>
                <input required minLength={6} type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full mt-1 p-3 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-sage/30 text-taupe" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-taupe/50 ml-1">Rol</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full mt-1 p-3 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-sage/30 text-taupe">
                  <option value="parent">Parent (Familia)</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewUserModal(false)} className="flex-1 p-3 text-taupe/60 hover:bg-taupe/5 rounded-xl font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 p-3 bg-sage text-white rounded-xl font-bold shadow-md hover:bg-sage/90 transition-all disabled:opacity-50">{loading ? "Creando..." : "Crear"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-outfit font-bold text-taupe mb-2">Eliminar Cuenta</h3>
              <p className="text-taupe/70 text-sm mb-6">
                Estás a punto de borrar definitivamente la cuenta de <strong className="text-taupe">{deletingUser.full_name || 'este usuario'}</strong>. Todas las fotos, álbumes, hijos y configuración se destruirán irrevocablemente.
              </p>

              {deleteProgress ? (
                <div className="w-full space-y-3 mt-4">
                  <div className="flex justify-between text-xs font-bold text-taupe/50">
                    <span>{deleteProgress.text}</span>
                    <span>{deleteProgress.step}%</span>
                  </div>
                  <div className="w-full h-3 bg-taupe/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-red-500 rounded-full" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${deleteProgress.step}%` }} 
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 w-full mt-2">
                  <button onClick={() => setDeletingUser(null)} className="flex-1 p-3 text-taupe/60 hover:bg-taupe/5 rounded-xl font-bold transition-colors">
                    Cancelar
                  </button>
                  <button onClick={confirmDelete} className="flex-1 p-3 bg-red-500 text-white rounded-xl font-bold shadow-md hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                    <Trash2 size={18} /> Destruir Todo
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}


      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-outfit font-bold text-taupe mb-2">Cambiar Contraseña</h3>
            <p className="text-xs text-taupe/50 mb-6">La nueva contraseña debe tener al menos 6 caracteres.</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <input required minLength={6} type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 bg-taupe/5 rounded-xl outline-none focus:ring-2 ring-gold/30 text-taupe" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPasswordModal(null)} className="flex-1 p-3 text-taupe/60 hover:bg-taupe/5 rounded-xl font-bold transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-gold text-white rounded-xl font-bold shadow-md hover:bg-gold/90 transition-all">Guardar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-lg font-bold text-white flex items-center gap-2 z-[60] ${toast.type === 'success' ? 'bg-sage' : 'bg-red-500'}`}
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
      formData.append('files', file); // Nuestra API acepta array, pero aquí mandamos uno a uno para el progreso
      formData.append('type', assetType);
      
      try {
        const res = await fetch('/api/admin/assets', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (res.ok) successCount++;
      } catch (err) {
        console.error(`Error subiendo ${file.name}:`, err);
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
        showToast("success", "Asset eliminado de R2.");
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
    
    setDeleteProgress({ current: 0, total: selectedIds.length, text: "Iniciando eliminación masiva..." });
    const token = await getSessionToken();
    let successCount = 0;

    for (let i = 0; i < selectedIds.length; i++) {
      const id = selectedIds[i];
      setDeleteProgress({ current: i + 1, total: selectedIds.length, text: `Borrando ${i + 1} de ${selectedIds.length}...` });
      
      try {
        const res = await fetch(`/api/admin/assets?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) successCount++;
      } catch (err) {
        console.error(`Error borrando ${id}:`, err);
      }
    }

    setDeleteProgress(null);
    setSelectedIds([]);
    fetchAssets();
    showToast("success", `Se eliminaron ${successCount} archivos correctamente.`);
  };

  const assetTypes = [
    { id: "sticker", label: "Stickers" },
    { id: "background", label: "Fondos" },
    { id: "tape", label: "Cintas" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-taupe/5">
            {assetTypes.map((type) => (
              <button 
                key={type.id} 
                onClick={() => {
                  setAssetType(type.id);
                  setSelectedIds([]);
                }} 
                className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${assetType === type.id ? "bg-gold text-white" : "text-taupe/50 hover:bg-taupe/5"}`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {selectedIds.length > 0 && (
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-red-600 transition-all"
            >
              <Trash2 size={18} /> Borrar {selectedIds.length} seleccionados
            </motion.button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {assets.length > 0 && (
            <button 
              onClick={() => setSelectedIds(selectedIds.length === assets.length ? [] : assets.map(a => a.id))}
              className="text-xs font-bold text-taupe/60 hover:text-gold transition-colors"
            >
              {selectedIds.length === assets.length ? "Deseleccionar Todo" : "Seleccionar Todo"}
            </button>
          )}
          <label className="bg-white border border-taupe/10 text-taupe px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:text-gold shadow-sm cursor-pointer transition-colors">
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
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 min-h-[400px] border border-taupe/5 shadow-sm">
        {assets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <ImageIcon size={40} className="text-taupe/20 mb-4" />
            <h3 className="text-taupe font-bold text-lg">No hay {assetTypes.find(t => t.id === assetType)?.label.toLowerCase()} globales</h3>
            <p className="text-taupe/50 text-sm mt-2 max-w-sm">Sube varias imágenes a la vez para que todos los usuarios puedan usarlas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {assets.map((asset) => (
              <motion.div 
                key={asset.id} 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                onClick={() => toggleSelection(asset.id)}
                className={`group relative aspect-square rounded-2xl overflow-hidden border transition-all cursor-pointer flex items-center justify-center ${selectedIds.includes(asset.id) ? 'border-gold ring-4 ring-gold/20 bg-gold/5 shadow-inner' : 'bg-taupe/5 border-taupe/10 hover:border-gold/30'}`}
              >
                <img 
                  src={asset.url} 
                  alt={asset.type} 
                  className={`max-w-full max-h-full object-contain p-2 ${asset.type === 'background' ? 'object-cover w-full h-full p-0' : ''}`}
                />
                
                {/* Checkbox Overlay */}
                <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.includes(asset.id) ? 'bg-gold border-gold text-white' : 'bg-white/50 border-taupe/20 group-hover:border-gold/50'}`}>
                  {selectedIds.includes(asset.id) && <Check size={14} strokeWidth={4} />}
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssetToDelete(asset.id);
                  }} 
                  className="absolute top-2 right-2 p-2 bg-red-500/90 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {assetToDelete && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-outfit font-bold text-taupe mb-2">Borrar Global</h3>
            <p className="text-sm text-taupe/60 mb-6">Esta imagen se eliminará para todos los usuarios. ¿Continuar?</p>
            <div className="flex gap-3">
              <button onClick={() => setAssetToDelete(null)} className="flex-1 p-3 text-taupe/60 hover:bg-taupe/5 rounded-xl font-bold transition-colors">Cancelar</button>
              <button onClick={confirmDeleteAsset} className="flex-1 p-3 bg-red-500 text-white rounded-xl font-bold shadow-md hover:bg-red-600 transition-all">Sí, Borrar</button>
            </div>
          </motion.div>
        </div>
      )}

      {uploadProgress && (
        <div className="fixed inset-0 bg-taupe/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-4">
                <Upload size={32} className="animate-bounce" />
              </div>
              <h3 className="text-2xl font-outfit font-bold text-taupe mb-2">Subiendo Contenido</h3>
              <p className="text-taupe/70 text-sm mb-6">
                Estamos procesando tus archivos. Por favor, no cierres la pestaña.
              </p>

              <div className="w-full space-y-3">
                <div className="flex justify-between text-xs font-bold text-taupe/50">
                  <span className="truncate max-w-[200px]">Subiendo: {uploadProgress.fileName}</span>
                  <span>{uploadProgress.current} de {uploadProgress.total}</span>
                </div>
                <div className="w-full h-3 bg-taupe/10 rounded-full overflow-hidden">
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
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} className="animate-pulse" />
              </div>
              <h3 className="text-2xl font-outfit font-bold text-taupe mb-2">Borrando Masivo</h3>
              <p className="text-taupe/70 text-sm mb-6">{deleteProgress.text}</p>

              <div className="w-full space-y-3">
                <div className="w-full h-3 bg-taupe/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-red-500 rounded-full" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-lg font-bold text-white flex items-center gap-2 z-[60] ${toast.type === 'success' ? 'bg-sage' : 'bg-red-500'}`}
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  );
}

function UserAssetsTab() {
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchUserAssets();
  }, []);

  async function fetchUserAssets() {
    setLoading(true);
    try {
      // 1. Fetch all assets that belong to users
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      // 2. Fetch profiles to link users
      const { data: profiles, error: profsError } = await supabase
        .from('profiles')
        .select('id, full_name');
      
      if (profsError) throw profsError;

      const profileMap = new Map(profiles.map(p => [p.id, p.full_name]));

      // 3. Group by user
      const groups: { [key: string]: any[] } = {};
      assets.forEach(asset => {
        const uid = asset.user_id;
        const name = profileMap.get(uid) || "Usuario Desconocido";
        if (!groups[uid]) groups[uid] = [];
        groups[uid].push({ ...asset, userName: name });
      });

      const userIds = Object.keys(groups);
      const formattedGroups = userIds.map(uid => ({
        userId: uid,
        assets: groups[uid]
      }));

      setUserGroups(formattedGroups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUserAsset = async (id: string) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    try {
      const res = await fetch(`/api/admin/assets?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUserAssets();
        setToast({ type: 'success', message: 'Asset de usuario eliminado.' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {loading ? (
        <div className="py-20 text-center text-taupe/50 font-bold">Cargando assets de usuarios...</div>
      ) : userGroups.length === 0 ? (
        <div className="py-20 text-center text-taupe/50 font-bold bg-white rounded-3xl border border-taupe/5">
          No hay assets subidos por usuarios todavía.
        </div>
      ) : (
        userGroups.map((group) => (
          <div key={group.userId} className="bg-white rounded-3xl p-8 border border-taupe/5 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-taupe/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center font-bold">U</div>
                <div>
                  <h3 className="font-bold text-taupe">Usuario: {group.userId.slice(0,8)}...</h3>
                  <p className="text-xs text-taupe/40">ID completo: {group.userId}</p>
                </div>
              </div>
              <span className="bg-taupe/5 text-taupe/60 px-3 py-1 rounded-full text-xs font-bold">
                {group.assets.length} Archivos
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {group.assets.map((asset: any) => (
                <div key={asset.id} className="group relative aspect-square bg-taupe/5 rounded-xl overflow-hidden border border-taupe/10 flex items-center justify-center">
                  <img src={asset.url} className="max-w-full max-h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => handleDeleteUserAsset(asset.id)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <a href={asset.url} target="_blank" className="p-2 bg-white text-taupe rounded-lg hover:bg-white/90 transition-colors">
                      <ExternalLink size={16} />
                    </a>
                  </div>
                  <div className="absolute bottom-1 left-1 right-1 flex justify-center">
                    <span className="bg-white/90 text-[8px] font-black uppercase text-taupe/70 px-1.5 py-0.5 rounded-md shadow-sm">
                      {asset.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 p-4 bg-sage rounded-xl shadow-lg font-bold text-white z-[60]"
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  );
}
