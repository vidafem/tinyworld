"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import LoveTreeCanvas from "@/components/LoveTree/LoveTreeCanvas";
import { Loader2 } from "lucide-react";

interface LoveTreeGuestProps {
  params: Promise<{ id: string }>;
}

export default function LoveTreeGuestPage({ params }: LoveTreeGuestProps) {
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const resolvedParams = use(params);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: childData } = await supabase
          .from("children")
          .select("id, name, theme_color")
          .eq("id", resolvedParams.id)
          .single();
        
        if (childData) {
          setChild(childData);
        }
      } catch (err) {
        console.error("Error loading child:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center flex-col gap-4">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
        <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">Cargando Bosque Mágico...</p>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-500 font-bold">Árbol no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-sky-50">
      <LoveTreeCanvas child={child} />
    </div>
  );
}
