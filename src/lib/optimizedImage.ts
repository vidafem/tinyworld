/**
 * TinyWorld - Arquitectura de Medios por Capas (Estilo iCloud)
 * 
 * Capa 1 (Thumbnail): Miniatura ligera para cuadrículas y tarjetas (~35 KB WebP)
 * Capa 2 (Preview HD): Previsualización optimizada para Álbum 3D y modales (~180 KB WebP)
 * Capa 3 (Master Original): Archivo 100% original sin compresión para descargas e impresión
 */

export function getThumbnailUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) return rawUrl;

  // Supabase Storage Image Transformation
  if (rawUrl.includes(".supabase.co/storage/v1/object/public/")) {
    return (
      rawUrl.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
      "?width=400&height=400&resize=contain&quality=75"
    );
  }

  // Next.js Image Optimizer
  return `/_next/image?url=${encodeURIComponent(rawUrl)}&w=384&q=75`;
}

export function getPreviewUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) return rawUrl;

  // Supabase Storage Image Transformation
  if (rawUrl.includes(".supabase.co/storage/v1/object/public/")) {
    return (
      rawUrl.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
      "?width=1400&quality=82"
    );
  }

  // Next.js Image Optimizer
  return `/_next/image?url=${encodeURIComponent(rawUrl)}&w=1200&q=82`;
}

export function getOriginalDownloadUrl(rawUrl: string, filename?: string): string {
  if (!rawUrl) return "";
  const nameParam = filename ? `&filename=${encodeURIComponent(filename)}` : "";
  return `/api/download?url=${encodeURIComponent(rawUrl)}${nameParam}`;
}
