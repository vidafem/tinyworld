import { NextRequest, NextResponse } from "next/server";
import { maxProxyBytes, parseAllowedMediaUrl, responseExceedsLimit } from "@/lib/mediaProxy";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  const parsed = parseAllowedMediaUrl(rawUrl);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const upstream = await fetch(parsed.sourceUrl, { cache: "no-store" });

  if (!upstream.ok) {
    return NextResponse.json({ error: "No se pudo cargar la imagen" }, { status: upstream.status });
  }

  if (responseExceedsLimit(upstream)) {
    return NextResponse.json({ error: "Imagen demasiado grande" }, { status: 413 });
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";

  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "El recurso no es una imagen" }, { status: 415 });
  }

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength > maxProxyBytes()) {
    return NextResponse.json({ error: "Imagen demasiado grande" }, { status: 413 });
  }

  return new NextResponse(buffer, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
      "Content-Length": String(buffer.byteLength),
      "Content-Type": contentType,
    },
  });
}
