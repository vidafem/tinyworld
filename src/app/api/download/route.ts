import { NextRequest, NextResponse } from "next/server";
import { parseAllowedMediaUrl, safeDownloadFilename } from "@/lib/mediaProxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  const rawFilename = searchParams.get("filename");
  const isInline = searchParams.get("inline") === "true";

  if (!rawUrl) {
    return new NextResponse("URL is required", { status: 400 });
  }

  const parsed = parseAllowedMediaUrl(rawUrl);
  if ("error" in parsed) {
    return new NextResponse(parsed.error, { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get("range");
    const fetchHeaders: HeadersInit = {};
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const response = await fetch(parsed.sourceUrl.toString(), { 
      cache: "no-store",
      headers: fetchHeaders
    });

    if (!response.ok && response.status !== 206) {
      throw new Error(`Failed to fetch resource: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentLength = response.headers.get("content-length");
    const contentRange = response.headers.get("content-range");

    // Deducir el nombre y extensión si no se proveyó
    let filename = rawFilename;
    if (!filename) {
      const urlPath = parsed.sourceUrl.pathname;
      const lastSegment = urlPath.split("/").pop();
      if (lastSegment && lastSegment.includes(".")) {
        filename = lastSegment;
      } else {
        const ext = contentType.includes("video") 
          ? "mp4" 
          : contentType.includes("audio") 
          ? "mp3" 
          : contentType.includes("png") 
          ? "png" 
          : "jpg";
        filename = `TinyWorld_Media_${Date.now()}.${ext}`;
      }
    }
    const safeFilename = safeDownloadFilename(filename);

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    if (contentRange) {
      headers.set("Content-Range", contentRange);
    }
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Accept-Ranges", "bytes");

    if (isInline) {
      headers.set("Content-Disposition", "inline");
      headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    } else {
      headers.set("Content-Disposition", `attachment; filename="${safeFilename}"`);
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return new NextResponse("Error downloading file", { status: 500 });
  }
}
