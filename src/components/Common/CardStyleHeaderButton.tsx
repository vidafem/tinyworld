"use client";

import { useState, useEffect } from "react";
import { Settings2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { playSoftPop, playSuccessChime } from "@/lib/pageSound";
import CardStyleConfigurator from "@/components/Common/CardStyleConfigurator";
import FloatingToast, { ToastData } from "@/components/Common/FloatingToast";
import { CardStyle, normalizeCardStyle, sanitizeHexColor } from "@/lib/cardStyles";
import { notifyChildUpdated } from "@/context/ChildContext";

interface CardStyleHeaderButtonProps {
  childId: string;
  cardKey: string;
  title: string;
  theme: any;
  isMobile?: boolean;
  className?: string;
  onSaved?: (style: CardStyle) => void;
  availableItems?: { id: string; label: string }[];
}

export default function CardStyleHeaderButton({
  childId,
  cardKey,
  title,
  theme,
  isMobile = false,
  className = "",
  onSaved,
  availableItems,
}: CardStyleHeaderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<CardStyle>({ color: null, icon: null });
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    async function loadCurrentStyle() {
      if (!childId) return;
      try {
        const { data: childData } = await supabase
          .from("children")
          .select("preview_config")
          .eq("id", childId)
          .single();

        const previewConfig = childData?.preview_config || {};
        const cardStyles = previewConfig.card_styles || {};
        const saved = cardStyles[cardKey] || (cardKey === "photo-book" ? cardStyles.photobook : null);
        if (saved) {
          setCurrentStyle(normalizeCardStyle(saved));
        }
      } catch (err) {
        console.error("Error loading card style for", cardKey, err);
      }
    }
    loadCurrentStyle();
  }, [childId, cardKey, isOpen]);

  const handleSave = async (newStyle: CardStyle) => {
    try {
      const { data: childData, error: fetchErr } = await supabase
        .from("children")
        .select("preview_config")
        .eq("id", childId)
        .single();

      if (fetchErr) throw fetchErr;

      const previewConfig = childData?.preview_config || {};
      const currentCardStyles = previewConfig.card_styles || {};

      const nextCardStyles = {
        ...currentCardStyles,
        [cardKey]: {
          color: newStyle.color ? sanitizeHexColor(newStyle.color) : null,
          icon: newStyle.icon || null,
          visible_items: newStyle.visible_items || null,
        },
      };

      if (cardKey === "photo-book") {
        nextCardStyles["photobook"] = nextCardStyles["photo-book"];
      }

      const nextConfig = {
        ...previewConfig,
        card_styles: nextCardStyles,
      };

      const { error: updateErr } = await supabase
        .from("children")
        .update({ preview_config: nextConfig })
        .eq("id", childId);

      if (updateErr) throw updateErr;

      setCurrentStyle(newStyle);
      notifyChildUpdated(childId, { preview_config: nextConfig });
      playSuccessChime();
      setToast({ type: "success", message: `¡Tarjeta de "${title}" actualizada!` });
      onSaved?.(newStyle);
    } catch (err) {
      console.error("Error updating card style:", err);
      setToast({ type: "error", message: "No se pudo guardar la personalización." });
      throw err;
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => {
          playSoftPop();
          setIsOpen(true);
        }}
        className={`p-2.5 bg-white dark:bg-stone-900 rounded-2xl shadow-sm ${theme?.text || "text-stone-700"} hover:scale-110 active:scale-95 transition-all border ${theme?.borderAccent || "border-stone-200"} cursor-pointer flex items-center justify-center`}
        title={`Personalizar tarjeta "${title}"`}
        aria-label={`Personalizar tarjeta "${title}"`}
      >
        <Settings2 size={isMobile ? 20 : 22} />
      </button>

      <CardStyleConfigurator
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialStyle={currentStyle}
        theme={theme}
        onSave={handleSave}
        cardTitle={title}
        availableItems={availableItems}
      />

      <FloatingToast toast={toast} onClose={() => setToast(null)} theme={theme} />
    </div>
  );
}
