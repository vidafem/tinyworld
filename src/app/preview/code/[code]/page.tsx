import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Frown } from "lucide-react";

export default async function PreviewCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  
  const { data, error } = await supabase
    .from("children")
    .select("id")
    .eq("access_code", code.toUpperCase())
    .single();

  if (data && !error) {
    redirect(`/preview/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-texture bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-inner animate-bounce">
        <Frown size={32} />
      </div>
      <h1 className="text-3xl font-outfit font-black text-taupe mb-2">Código de Álbum no Válido</h1>
      <p className="text-taupe/60 text-sm max-w-sm mb-8 leading-relaxed">
        El código de acceso <span className="font-bold text-taupe">"{code}"</span> no corresponde a ningún bebé activo en nuestro sistema. Verifica que esté bien escrito o solicita el enlace directo.
      </p>
      <Link 
        href="/"
        className="px-8 py-4 bg-taupe text-white rounded-2xl font-bold hover:bg-taupe/90 shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest"
      >
        Ir al Inicio
      </Link>
    </div>
  );
}
