import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy",
  { auth: { persistSession: false } }
);

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const supabaseAdmin = getSupabaseAdmin();
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const assetType = formData.get('type') as string; // 'sticker', 'background'
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No se encontraron archivos" }, { status: 400 });
    }

    const uploadedAssets = [];
    const supabaseAdmin = getSupabaseAdmin();

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      
      // ORGANIZACION POR CARPETAS DE USUARIO
      const fileName = `assets/users/${user.id}/${assetType}s/${timestamp}_${sanitizedName}`;

      // 1. Subir a Cloudflare R2
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      }));

      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;

      // 2. Guardar referencia en Supabase (con user_id)
      const { data, error } = await supabaseAdmin
        .from('assets')
        .insert({
          type: assetType,
          url: publicUrl,
          is_global: false,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error("Error al guardar asset en BD:", error);
      } else {
        uploadedAssets.push(data);
      }
    }

    return NextResponse.json({ success: true, assets: uploadedAssets });
  } catch (error: any) {
    console.error("Error al subir assets de usuario:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Verificar que el asset pertenece al usuario
    const { data: asset, error: fetchError } = await supabaseAdmin
      .from('assets')
      .select('url, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !asset) return NextResponse.json({ error: "Asset no encontrado" }, { status: 404 });
    if (asset.user_id !== user.id) return NextResponse.json({ error: "No tienes permiso" }, { status: 403 });

    const urlObj = new URL(asset.url);
    const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;

    // 1. Borrar de Cloudflare R2
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }));

    // 2. Borrar de Supabase
    await supabaseAdmin.from('assets').delete().eq('id', id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al borrar asset de usuario:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
