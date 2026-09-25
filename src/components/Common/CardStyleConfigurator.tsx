"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Settings2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ModernModal from "@/components/Common/ModernModal";
import {
  CARD_COLOR_OPTIONS,
  CARD_ICON_LABELS,
  CARD_ICON_OPTIONS,
  CardStyle,
  getProxiedCardIconUrl,
  normalizeCardStyle,
  renderCardIcon,
  sanitizeHexColor,
} from "@/lib/cardStyles";

interface AssetOption {
  id: string;
  type: string;
  url: string;
}

interface AvailableItem {
  id: string;
  label: string;
}

interface CardStyleConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  initialStyle?: CardStyle | null;
  theme: any;
  onSave: (style: CardStyle) => Promise<void>;
  availableItems?: AvailableItem[];
  cardTitle?: string;
}

export default function CardStyleConfigurator({
  isOpen,
  onClose,
  initialStyle,
  theme,
  onSave,
  availableItems,
  cardTitle,
}: CardStyleConfiguratorProps) {
  const [style, setStyle] = useState<CardStyle>(normalizeCardStyle(initialStyle));
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStyle(normalizeCardStyle(initialStyle));

    async function loadAssets() {
      setLoadingAssets(true);
      const { data: { session } } = await supabase.auth.getSession();
      let query = supabase
        .from("assets")
        .select("id,type,url,is_global,user_id")
        .in("type", ["sticker", "tape"]);

      if (session?.user?.id) {
        query = query.or(`is_global.eq.true,user_id.eq.${session.user.id}`);
      } else {
        query = query.eq("is_global", true);
      }

      const { data } = await query.limit(80);
      setAssets((data || []) as AssetOption[]);
      setLoadingAssets(false);
    }

    loadAssets();
  }, [isOpen, initialStyle]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        color: style.color ? sanitizeHexColor(style.color) : null,
        icon: style.icon || null,
        visible_items: style.visible_items || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const currentColorHex = style.color ? sanitizeHexColor(style.color) : null;
  const safePickerHex = currentColorHex || sanitizeHexColor(theme?.hex, "#8C7A6B");

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={cardTitle ? `Personalizar ${cardTitle}` : "Configurar tarjeta"}
      subtitle="Personaliza el color e icono que se muestran en el dashboard"
      icon={<Settings2 size={18} />}
      theme={theme}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Vista previa en vivo de la tarjeta */}
        <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-stone-100/70 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700/60">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2.5">
            Vista Previa de la Tarjeta en Dashboard
          </span>
          <div 
            className="w-44 p-4 rounded-[2rem] shadow-sm border border-white/80 dark:border-stone-800 flex flex-col items-center gap-2.5 text-center transition-all duration-300"
            style={{
              backgroundColor: currentColorHex || (theme?.bg ? undefined : "#FFFFFF"),
              boxShadow: `0 10px 25px -8px ${theme?.hex || '#8C7A6B'}22, inset 0 1px 0 rgba(255,255,255,0.7)`,
            }}
          >
            <div className={`w-14 h-14 rounded-full ${currentColorHex ? "bg-white/80" : theme.bg || "bg-stone-100"} shadow-inner flex items-center justify-center border-2 border-white dark:border-stone-800 transition-colors`}>
              <div className={`${theme.text || "text-stone-800"} h-8 w-8 flex items-center justify-center`}>
                {renderCardIcon(style.icon || "Sparkles", 26)}
              </div>
            </div>
            <span className={`text-xs font-black uppercase tracking-wider ${theme.text || "text-stone-800"} font-outfit`}>
              {cardTitle || "Módulo"}
            </span>
          </div>
        </div>

        <section>
          <h3 className={`text-[10px] font-black uppercase tracking-[0.18em] ${theme.text} opacity-50 mb-3`}>
            Color de Fondo
          </h3>
          <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
            {CARD_COLOR_OPTIONS.map((color) => {
              const isSelected = currentColorHex?.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setStyle((current) => ({ ...current, color }))}
                  className={`aspect-square rounded-2xl border-2 transition-all hover:scale-105 cursor-pointer ${
                    isSelected ? "border-stone-900 shadow-lg scale-105" : "border-white shadow-sm"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="color"
              value={safePickerHex}
              onChange={(event) => setStyle((current) => ({ ...current, color: event.target.value }))}
              className="h-10 w-14 cursor-pointer rounded-xl border border-stone-200 bg-white p-1"
              aria-label="Color personalizado"
            />
            <span className="text-xs font-mono font-bold text-stone-500">
              {safePickerHex}
            </span>
            <button
              type="button"
              onClick={() => setStyle((current) => ({ ...current, color: null }))}
              className="rounded-xl bg-stone-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-stone-500 transition-colors hover:bg-stone-200 cursor-pointer"
            >
              Restablecer
            </button>
          </div>
        </section>

        <section>
          <h3 className={`text-[10px] font-black uppercase tracking-[0.18em] ${theme.text} opacity-50 mb-3`}>
            Icono
          </h3>
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
            {CARD_ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                title={CARD_ICON_LABELS[icon] || icon}
                onClick={() => setStyle((current) => ({ ...current, icon }))}
                className={`aspect-square rounded-2xl border flex items-center justify-center transition-all hover:scale-105 ${
                  style.icon === icon ? `${theme.primaryBg} text-white border-white shadow-lg` : `bg-white ${theme.text} ${theme.borderAccent}`
                }`}
              >
                {renderCardIcon(icon, 20)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className={`text-[10px] font-black uppercase tracking-[0.18em] ${theme.text} opacity-50 mb-3`}>
            Stickers
          </h3>
          {loadingAssets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin opacity-30" size={24} />
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setStyle((current) => ({ ...current, icon: asset.url }))}
                  className={`h-20 w-20 shrink-0 rounded-2xl border bg-white p-2 transition-all hover:scale-105 ${
                    style.icon === asset.url ? "border-stone-900 shadow-lg" : `${theme.borderAccent} shadow-sm`
                  }`}
                >
                  <img
                    src={getProxiedCardIconUrl(asset.url)}
                    alt=""
                    className="h-full w-full object-contain"
                    crossOrigin="anonymous"
                  />
                </button>
              ))}
              {assets.length === 0 && (
                <p className="py-6 text-xs font-bold uppercase tracking-widest text-stone-400">
                  No hay stickers disponibles.
                </p>
              )}
            </div>
          )}
        </section>

        {availableItems && availableItems.length > 0 && (
          <section>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.18em] ${theme.text} opacity-50 mb-3`}>
              Secciones Visibles
            </h3>
            <div className="space-y-3 bg-stone-50 dark:bg-stone-850 p-4 rounded-3xl border border-stone-100 dark:border-stone-800">
              {availableItems.map((item) => {
                const isVisible = (style.visible_items || []).includes(item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setStyle((current) => {
                          const currentVisible = current.visible_items || [];
                          const nextVisible = currentVisible.includes(item.id)
                            ? currentVisible.filter((id) => id !== item.id)
                            : [...currentVisible, item.id];
                          return { ...current, visible_items: nextVisible };
                        });
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                        isVisible ? theme.primaryBg || "bg-sage" : "bg-stone-300 dark:bg-stone-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                          isVisible ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-stone-100 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-stone-500 transition-colors hover:bg-stone-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`${theme.primaryBg} ${theme.textActive} rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2`}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar
          </button>
        </div>
      </div>
    </ModernModal>
  );
}
