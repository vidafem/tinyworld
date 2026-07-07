"use client";

import { useState, useEffect, Suspense } from "react";
import DesktopProfileSelector from "@/components/Dashboard/DesktopProfileSelector";
import MobileProfileSelector from "@/components/Dashboard/MobileProfileSelector";
import UserProfile from "@/components/Dashboard/UserProfile";
import AdminDashboard from "@/components/Admin/AdminDashboard";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function DashboardContent() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [role, setRole] = useState<"admin" | "parent" | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'selection' | 'profile'>('selection');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'profile') setView('profile');
    else setView('selection');
  }, [searchParams]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setRole(profile.role);
        } else {
          setRole("parent");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, [router]);

  if (isMobile === null || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-sage" size={40} />
      </div>
    );
  }

  if (role === "admin") {
    return <AdminDashboard />;
  }

  if (view === 'profile') {
    return <UserProfile onBack={() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      window.history.pushState({}, '', url);
      setView('selection');
    }} />;
  }

  return isMobile ? (
    <MobileProfileSelector onOpenProfile={() => setView('profile')} />
  ) : (
    <DesktopProfileSelector onOpenProfile={() => setView('profile')} />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-sage" size={40} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
