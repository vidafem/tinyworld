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

  const updateChildLocally = useCallback((data: Partial<any>) => {
    setChild((prev: any) => {
      const updated = { ...prev, ...data };
      childMemoryCache.set(childId, updated);
      return updated;
    });
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
