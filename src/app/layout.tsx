import type { Metadata } from "next";
import "./globals.css";

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
  return (
    <html lang="es" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Quicksand:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col selection:bg-gold/30">
        {children}
      </body>
    </html>
  );
}

