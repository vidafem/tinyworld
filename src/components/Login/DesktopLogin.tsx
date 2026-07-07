"use client";

import { motion } from "framer-motion";
import { LogIn, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DesktopLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError("Credenciales incorrectas. Por favor verifica tu email y contraseña.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background bg-texture relative overflow-hidden">
      
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-sage/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <Link href="/" className="absolute top-10 left-10 flex items-center gap-2 text-taupe/50 hover:text-taupe transition-colors group z-20">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-outfit font-medium">Volver al inicio</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white p-12 rounded-[2rem] shadow-2xl border border-taupe/5"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-outfit font-black text-taupe mb-2">Bienvenido</h2>
          <p className="text-taupe/80 font-medium italic text-sm">"Donde cada recuerdo se guarda con amor."</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-taupe ml-1">Email</label>
            <div className="relative group">
              <input 
                type="email" 
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full bg-white border border-taupe/20 p-4 rounded-2xl outline-none focus:border-gold transition-all text-taupe placeholder:text-taupe/60 shadow-sm disabled:opacity-50"
              />
              <LogIn className="absolute right-4 top-1/2 -translate-y-1/2 text-taupe/50 group-focus-within:text-gold transition-colors" size={20} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-taupe">Contraseña</label>
              <Link href="/forgot-password" className="text-[10px] uppercase font-bold text-gold hover:underline">¿La olvidaste?</Link>
            </div>
            <div className="relative group">
              <input 
                type="password" 
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-taupe/20 p-4 rounded-2xl outline-none focus:border-gold transition-all text-taupe placeholder:text-taupe/60 shadow-sm disabled:opacity-50"
              />
              <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 text-taupe/50 group-focus-within:text-gold transition-colors" size={20} />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sage text-white rounded-2xl font-bold shadow-lg shadow-sage/30 hover:bg-sage/90 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Abrir mi Diario"}
          </button>
        </form>

        <p className="mt-10 text-center text-[10px] text-taupe/80 uppercase tracking-[0.2em] font-bold">
          Exclusivo para la familia TinyWorld
        </p>
      </motion.div>

      {/* Marca de agua elegante */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-[0.03] select-none pointer-events-none">
        <span className="text-[10rem] font-outfit font-bold tracking-tighter">TinyWorld</span>
      </div>

    </div>
  );
}
