"use client";

import { useState, useEffect, Suspense } from "react";
import DesktopProfileSelector from "@/components/Dashboard/DesktopProfileSelector";
import MobileProfileSelector from "@/components/Dashboard/MobileProfileSelector";
import UserProfile from "@/components/Dashboard/UserProfile";
import AdminDashboard from "@/components/Admin/AdminDashboard";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

let cachedRole: "admin" | "parent" | null = null;
let cachedSessionChecked = false;

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      cachedRole = null;
      cachedSessionChecked = false;
    }
  });
}

function DashboardContent() {
  const [role, setRole] = useState<"admin" | "parent" | null>(cachedRole);
  const [loading, setLoading] = useState(!cachedSessionChecked);
  const [view, setView] = useState<'selection' | 'profile'>('selection');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'profile') setView('profile');
    else setView('selection');
  }, [searchParams]);

  useEffect(() => {
    async function checkUser() {
      if (cachedSessionChecked) {
        setRole(cachedRole);
        setLoading(false);
        return;
      }

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

        const userRole = profile?.role || "parent";
        cachedRole = userRole;
        cachedSessionChecked = true;
        setRole(userRole);
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, [router]);

  if (loading) {
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

  return (
    <>
      <div className="block md:hidden min-h-screen bg-background">
        <MobileProfileSelector onOpenProfile={() => setView('profile')} />
      </div>
      <div className="hidden md:block min-h-screen bg-background">
        <DesktopProfileSelector onOpenProfile={() => setView('profile')} />
      </div>
    </>
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
