"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DesktopLogin from "@/components/Login/DesktopLogin";
import MobileLogin from "@/components/Login/MobileLogin";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
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
        console.error("Error checking session on login page:", err);
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

  if (checkingSession || isMobile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-sage" size={40} />
      </div>
    );
  }

  return isMobile ? <MobileLogin /> : <DesktopLogin />;
}
