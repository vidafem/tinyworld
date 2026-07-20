import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy",
    { auth: { persistSession: false } }
  );

export async function POST(req: NextRequest) {
  try {
    const { eventId, url, mediaType } = await req.json();

    if (!eventId || !url || !mediaType) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos (eventId, url, mediaType)." },
        { status: 400 }
      );
    }

    // 1. Validar que el evento existe y está activo
    const supabaseAdmin = getSupabaseAdmin();
    const { data: event, error: eventError } = await supabaseAdmin
      .from("pregnancy_events")
      .select("id, is_active")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
    }

    if (!event.is_active) {
      return NextResponse.json({ error: "Este evento ya no está activo." }, { status: 403 });
    }

    // 2. Registrar en la base de datos
    const { data, error: dbError } = await supabaseAdmin
      .from("pregnancy_event_media")
      .insert({
        event_id: eventId,
        url: url,
        type: mediaType,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error al registrar en BD:", dbError);
      return NextResponse.json(
        { error: "Error al registrar el archivo en la base de datos." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      media: data,
    });
  } catch (err: any) {
    console.error("Error en registro de medio de evento:", err);
    return NextResponse.json(
      { error: "Error interno del servidor al registrar el medio." },
      { status: 500 }
    );
  }
}
