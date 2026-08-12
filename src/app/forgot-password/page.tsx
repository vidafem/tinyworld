"use client";

import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        setErrorMsg("Error al enviar el correo. Por favor verifica la dirección ingresada.");
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setErrorMsg("Ocurrió un error al procesar tu solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 notebook-lines">
      <Link href="/login" className="absolute top-10 left-10 flex items-center gap-2 text-taupe/50 hover:text-taupe transition-colors group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-outfit font-medium">Volver</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-xl border border-taupe/5 text-center"
      >
        {!sent ? (
          <>
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Mail className="text-gold" size={32} />
            </div>
            <h2 className="text-3xl font-outfit font-bold text-taupe mb-4">¿Olvidaste tu acceso?</h2>
            <p className="text-taupe/60 text-sm mb-8 leading-relaxed">
              No te preocupes, dinos tu correo y te enviaremos una llave mágica para entrar de nuevo.
            </p>
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl border border-red-100">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-taupe/30 ml-2">Email</label>
                <input 
                  type="email" 
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-beige/5 border border-taupe/10 p-4 rounded-2xl outline-none focus:border-gold transition-all disabled:opacity-50"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-sage text-white rounded-2xl font-bold shadow-lg shadow-sage/20 hover:bg-sage/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Enviar llave de acceso"}
              </button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-20 h-20 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Mail className="text-sage" size={32} />
            </div>
            <h2 className="text-3xl font-outfit font-bold text-taupe mb-4">¡Correo enviado!</h2>
            <p className="text-taupe/60 text-sm mb-8 leading-relaxed">
              Revisa tu bandeja de entrada (y la carpeta de spam por si acaso). Te hemos enviado las instrucciones.
            </p>
            <Link 
              href="/login"
              className="inline-block w-full py-4 border-2 border-taupe/10 text-taupe rounded-2xl font-bold hover:bg-beige/5 transition-all"
            >
              Volver al Login
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

