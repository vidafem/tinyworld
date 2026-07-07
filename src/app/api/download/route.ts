import { NextRequest, NextResponse } from "next/server";
import { maxProxyBytes, parseAllowedMediaUrl, responseExceedsLimit, safeDownloadFilename } from "@/lib/mediaProxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  const filename = safeDownloadFilename(searchParams.get("filename"));
  const isInline = searchParams.get("inline") === "true" || !searchParams.get("filename");

  if (!rawUrl) {
    return new NextResponse("URL is required", { status: 400 });
  }

  const parsed = parseAllowedMediaUrl(rawUrl);
  if ("error" in parsed) {
    return new NextResponse(parsed.error, { status: 400 });
  }

  try {
    const response = await fetch(parsed.sourceUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch resource");

    if (responseExceedsLimit(response)) {
      return new NextResponse("File too large", { status: 413 });
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxProxyBytes()) {
      return new NextResponse("File too large", { status: 413 });
    }

    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("content-type") || "application/octet-stream");
    headers.set("Content-Length", String(buffer.byteLength));
    headers.set("Access-Control-Allow-Origin", "*");

    if (isInline) {
      headers.set("Content-Disposition", "inline");
      headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    } else {
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    }

    return new NextResponse(buffer, {
      status: 200,
      statusText: "OK",
      headers,
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return new NextResponse("Error downloading file", { status: 500 });
  }
}
