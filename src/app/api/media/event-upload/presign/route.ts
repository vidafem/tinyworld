import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy",
    { auth: { persistSession: false } }
  );

 function slugPart(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    const { eventId, contentType, filename } = await req.json();

    if (!eventId || !contentType || !filename) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos (eventId, contentType, filename)." },
        { status: 400 }
      );
    }

    // 1. Validar que el evento existe y está activo
    const supabaseAdmin = getSupabaseAdmin();
    const { data: event, error: eventError } = await supabaseAdmin
      .from("pregnancy_events")
      .select("id, child_id, is_active")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
    }

    if (!event.is_active) {
      return NextResponse.json({ error: "Este evento ya no está activo." }, { status: 403 });
    }

    const bucket = process.env.R2_BUCKET_NAME;
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (!bucket || !r2PublicUrl) {
      return NextResponse.json(
        { error: "Cloudflare R2 no está configurado en el servidor." },
        { status: 500 }
      );
    }

    const ext = filename.split(".").pop() || "bin";
    const baseName = slugPart(filename.replace(/\.[^.]+$/, "")) || "media";
    const key = [
      "children",
      event.child_id,
      "events",
      eventId,
      `${Date.now()}-${crypto.randomUUID()}-${baseName}.${slugPart(ext)}`,
    ].join("/");

    // Generar la URL firmada para subir directamente mediante PUT
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Metadata: {
        childId: event.child_id,
        eventId,
        module: "pregnancy",
        section: "events",
      },
    });

    // La URL firmada expira en 1 hora (3600 segundos)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `${r2PublicUrl}/${key}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (err: any) {
    console.error("Error al generar URL firmada:", err);
    return NextResponse.json(
      { error: "Error interno al generar URL firmada." },
      { status: 500 }
    );
  }
}
