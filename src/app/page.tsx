"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DesktopHome from "@/components/Home/DesktopHome";
import MobileHome from "@/components/Home/MobileHome";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace("/dashboard");
          return;
        }
      } catch (err) {
        console.error("Error checking session on home page:", err);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mientras se detecta el dispositivo o la sesión, no renderizamos el home
  if (checkingSession || isMobile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-sage" size={40} />
      </div>
    );
  }

  return isMobile ? <MobileHome /> : <DesktopHome />;
}





