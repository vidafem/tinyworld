"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface ChildContextType {
  childId: string;
  child: any | null;
  loading: boolean;
  refreshChild: () => Promise<void>;
  updateChildLocally: (data: Partial<any>) => void;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

// Memoria caché en cliente entre navegaciones (evita pantallas de carga repetidas)
const childMemoryCache = new Map<string, any>();

/**
 * Notificador global para cambios inmediatos en el perfil/tarjetas del niño.
 * Actualiza la caché en memoria y notifica a todos los componentes montados instantáneamente.
 */
export function notifyChildUpdated(childId: string, data?: Partial<any>) {
  if (typeof window !== "undefined") {
    if (data && childMemoryCache.has(childId)) {
      const current = childMemoryCache.get(childId) || {};
      childMemoryCache.set(childId, { ...current, ...data });
    }
    window.dispatchEvent(
      new CustomEvent("tw:child-updated", { detail: { childId, data } })
    );
  }
}

export function ChildProvider({
  childId,
  children,
}: {
  childId: string;
  children: React.ReactNode;
}) {
  const cached = childMemoryCache.get(childId) || null;
  const [child, setChild] = useState<any | null>(cached);
  const [loading, setLoading] = useState<boolean>(!cached);

  const loadChild = useCallback(async (silent = false) => {
    if (!silent && !childMemoryCache.has(childId)) {
      setLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("id", childId)
        .single();

      if (!error && data) {
        childMemoryCache.set(childId, data);
        setChild(data);
      }
    } catch (err) {
      console.error("Error loading child context:", err);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    if (childMemoryCache.has(childId)) {
      const current = childMemoryCache.get(childId);
      setChild(current);
      setLoading(false);
      loadChild(true); // Revalidación silenciosa en background sin bloquear la interfaz
    } else {
      loadChild(false);
    }
  }, [childId, loadChild]);

  // 1. Escuchar eventos de actualización local en la misma pestaña
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ childId: string; data?: Partial<any> }>;
      if (customEvent.detail?.childId === childId) {
        if (customEvent.detail.data) {
          setChild((prev: any) => {
            const updated = { ...prev, ...customEvent.detail.data };
            childMemoryCache.set(childId, updated);
            return updated;
          });
        } else {
          loadChild(true);
        }
      }
    };
    window.addEventListener("tw:child-updated", handleUpdate);
    return () => window.removeEventListener("tw:child-updated", handleUpdate);
  }, [childId, loadChild]);

  // 2. Suscripción Realtime de Supabase para cambios en la base de datos
  useEffect(() => {
    if (!childId) return;

    const channel = supabase
      .channel(`realtime-child-${childId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "children",
          filter: `id=eq.${childId}`,
        },
        (payload) => {
          if (payload.new) {
            childMemoryCache.set(childId, payload.new);
            setChild(payload.new);
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("tw:child-updated", {
                  detail: { childId, data: payload.new },
                })
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [childId]);

  // 3. Revalidar silenciosamente al reenfocar la ventana o pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadChild(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [loadChild]);

  const updateChildLocally = useCallback((data: Partial<any>) => {
    setChild((prev: any) => {
      const updated = { ...prev, ...data };
      childMemoryCache.set(childId, updated);
      return updated;
    });
    notifyChildUpdated(childId, data);
  }, [childId]);

  const refreshChild = useCallback(async () => {
    await loadChild(true);
  }, [loadChild]);

  return (
    <ChildContext.Provider
      value={{
        childId,
        child,
        loading,
        refreshChild,
        updateChildLocally,
      }}
    >
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  const context = useContext(ChildContext);
  return context;
}
