"use client";

import { useState, useEffect } from "react";
import DesktopAdmin from "./Desktop/DesktopAdmin";
import MobileAdmin from "./Mobile/MobileAdmin";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile === null) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center">
        <Loader2 className="animate-spin text-sage" size={40} />
      </div>
    );
  }

  return isMobile ? <MobileAdmin /> : <DesktopAdmin />;
}
