/**
 * TinyWorld - Arquitectura de Medios por Capas (Estilo iCloud)
 * 
 * Capa 1 (Thumbnail): Miniatura WebP para cuadrículas y tarjetas (~35 KB)
 * Capa 2 (Preview HD): Previsualización HD para Álbum 3D y visor modal (~180 KB)
 * Capa 3 (Master Original): Archivo 100% original sin compresión para descargas e impresión
 */

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".mp4") ||
    lower.includes(".mov") ||
    lower.includes(".webm") ||
    lower.includes(".avi") ||
    lower.includes(".mkv") ||
    lower.includes("/video/")
  );
}

function isStickerOrSvg(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".svg") ||
    lower.includes("sticker") ||
    lower.includes("tape") ||
    lower.includes(".ico")
  );
}

export function getThumbnailUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) return rawUrl;
  
  // Los videos, stickers y SVG no se procesan en el optimizador de imágenes
  if (isVideoUrl(rawUrl) || isStickerOrSvg(rawUrl)) {
    return rawUrl;
  }

  // Next.js Image Optimizer: w=384, q=75 (parámetros oficialmente soportados)
  return `/_next/image?url=${encodeURIComponent(rawUrl)}&w=384&q=75`;
}

export function getPreviewUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) return rawUrl;

  // Los videos, stickers y SVG no se procesan en el optimizador de imágenes
  if (isVideoUrl(rawUrl) || isStickerOrSvg(rawUrl)) {
    return rawUrl;
  }

  // Next.js Image Optimizer: w=1200, q=75 (q=75 es el valor estándar para evitar error 400)
  return `/_next/image?url=${encodeURIComponent(rawUrl)}&w=1200&q=75`;
}

export function getOriginalDownloadUrl(rawUrl: string, filename?: string): string {
  if (!rawUrl) return "";
  const nameParam = filename ? `&filename=${encodeURIComponent(filename)}` : "";
  return `/api/download?url=${encodeURIComponent(rawUrl)}${nameParam}`;
}

/**
 * Fallback a prueba de fallos: si por alguna razón Next.js Optimizer no responde,
 * conmuta instantáneamente al archivo original sin que el usuario note ningún error visual.
 */
export function handleImageFallback(
  e: { currentTarget: HTMLImageElement },
  originalUrl: string
): void {
  if (originalUrl && e.currentTarget && e.currentTarget.src !== originalUrl) {
    e.currentTarget.src = originalUrl;
  }
}
