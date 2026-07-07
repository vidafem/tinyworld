"use client";

import { motion } from "framer-motion";
import { LogIn, KeyRound, ArrowLeft, Heart, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function MobileLogin() {
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
      setError("Verifica tus datos e intenta de nuevo.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background bg-texture relative flex flex-col items-center justify-between p-6 pb-12 overflow-hidden">
      {/* Ajuste para que el fondo cubra la barra de estado en iPhone */}
      <div className="fixed top-0 left-0 w-full h-10 bg-background z-[-1]" />
      
      {/* Elementos decorativos móviles */}
      <div className="absolute top-[-10%] right-[-20%] w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-20%] w-80 h-80 bg-sage/5 rounded-full blur-3xl" />

      <header className="w-full flex items-center justify-between pt-4">
        <Link href="/" className="p-2 -ml-2 text-taupe/40 hover:text-taupe transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="w-10 h-10 relative">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="absolute inset-0 bg-sage/10 rounded-full flex items-center justify-center -z-10" />
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex-1 flex flex-col justify-center"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-outfit font-black text-taupe mb-3">Hola de nuevo</h1>
          <p className="text-sm text-taupe/70 font-medium leading-relaxed px-4">
            Ingresa tus datos para continuar con los recuerdos de tu bebé.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-taupe/70 ml-1">Email</label>
            <div className="relative">
              <input 
                type="email" 
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-white border border-taupe/10 p-5 rounded-2xl outline-none focus:border-gold transition-all text-taupe placeholder:text-taupe/60 shadow-sm disabled:opacity-50"
              />
              <LogIn className="absolute right-5 top-1/2 -translate-y-1/2 text-taupe/30" size={20} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-taupe/70">Contraseña</label>
              <Link href="/forgot-password" className="text-[10px] font-bold text-gold">¿Olvido?</Link>
            </div>
            <div className="relative">
              <input 
                type="password" 
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full bg-white border border-taupe/10 p-5 rounded-2xl outline-none focus:border-gold transition-all text-taupe placeholder:text-taupe/60 shadow-sm disabled:opacity-50"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-taupe/30">
                <Lock size={20} />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-sage text-white rounded-2xl font-bold shadow-xl shadow-sage/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Abrir Diario"}
          </button>
        </form>
      </motion.div>

      <footer className="w-full text-center py-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-taupe/60 font-bold flex items-center justify-center gap-2">
          HECHO CON <Heart size={10} className="text-red-400 fill-red-400" /> PARA LA FAMILIA
        </p>
      </footer>

    </div>
  );
}
