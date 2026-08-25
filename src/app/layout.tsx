import type { Metadata } from "next";
import "./globals.css";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "TinyWorld™ | El Diario de tus Primeros Recuerdos",
  description: "Un espacio mágico y minimalista para guardar el crecimiento y los momentos sagrados de tu bebé.",
  manifest: "/manifest.json",
  icons: {
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TinyWorld",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FDFCFB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showWarning = process.env.NODE_ENV === "development" && !isSupabaseConfigured;

  return (
    <html lang="es" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Quicksand:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col selection:bg-gold/30">
        {showWarning && (
          <div className="w-full bg-amber-500 text-stone-900 px-4 py-2.5 text-center text-xs font-bold font-outfit border-b border-amber-600/20 z-[9999] flex items-center justify-center gap-2 relative shadow-md">
            <span>⚠️</span>
            <span>
              <strong>Falta de configuración local:</strong> Estás usando un placeholder para Supabase. Ejecuta <code className="bg-stone-950/20 px-1.5 py-0.5 rounded font-mono font-bold">npx vercel env pull .env.local</code> para sincronizar tus credenciales de Vercel.
            </span>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}

