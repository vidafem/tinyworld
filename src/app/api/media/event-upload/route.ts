import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

function extensionFromFile(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName !== file.name) return slugPart(fromName);

  const fromType = file.type.split("/").pop();
  return fromType ? slugPart(fromType) : "bin";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);
    const eventId = String(formData.get("eventId") || "");

    if (!eventId || files.length === 0) {
      return NextResponse.json({ error: "Faltan archivos o eventId." }, { status: 400 });
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
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (!bucket || !publicUrl) {
      return NextResponse.json({ error: "Cloudflare R2 no está configurado en el servidor." }, { status: 500 });
    }

    const uploaded = [];

    for (const file of files) {
      const ext = extensionFromFile(file);
      const baseName = slugPart(file.name.replace(/\.[^.]+$/, "")) || "media";
      
      // Carpeta organizada por bebé y luego por el ID de este evento
      const key = [
        "children",
        event.child_id,
        "events",
        eventId,
        `${Date.now()}-${crypto.randomUUID()}-${baseName}.${ext}`,
      ].join("/");

      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // Subida física a Cloudflare R2
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: file.type || "application/octet-stream",
          Metadata: {
            childId: event.child_id,
            eventId,
            module: "pregnancy",
            section: "events",
          },
        })
      );

      const url = `${publicUrl}/${key}`;
      const mediaType = file.type.startsWith("video") ? "video" : "image";

      // 2. Registrar en la base de datos
      const { error: dbError } = await supabaseAdmin
        .from("pregnancy_event_media")
        .insert({
          event_id: eventId,
          url: url,
          type: mediaType,
        });

      if (dbError) {
        console.error("Error al registrar en BD:", dbError);
        // Continuamos de todas formas con los demás archivos si alguno falla,
        // pero registramos el error interno.
      }

      uploaded.push({
        url,
        type: mediaType,
        name: file.name,
      });
    }

    return NextResponse.json({ success: true, uploaded });
  } catch (err: any) {
    console.error("Error en carga de evento:", err);
    return NextResponse.json({ error: "Error interno del servidor al procesar la subida." }, { status: 500 });
  }
}
