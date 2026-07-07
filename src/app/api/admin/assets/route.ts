import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSupabaseAdmin, requireAdmin } from "@/lib/serverAuth";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const formData = await req.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);
    const assetType = String(formData.get("type") || "");

    if (!files.length) {
      return NextResponse.json({ error: "No hay archivos en la peticion" }, { status: 400 });
    }

    if (!["sticker", "background", "tape"].includes(assetType)) {
      return NextResponse.json({ error: "Tipo de asset no permitido" }, { status: 400 });
    }

    if (!process.env.R2_BUCKET_NAME || !process.env.R2_ACCOUNT_ID || !process.env.NEXT_PUBLIC_R2_PUBLIC_URL) {
      return NextResponse.json({ error: "Configuracion de Cloudflare R2 incompleta" }, { status: 500 });
    }

    const uploadedAssets = [];
    const { supabaseAdmin, user } = admin;

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `assets/global/${assetType}s/${timestamp}_${sanitizedName}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: file.type || "application/octet-stream",
          })
        );

        const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;

        const { data, error: dbError } = await supabaseAdmin
          .from("assets")
          .insert({
            type: assetType,
            url: publicUrl,
            is_global: true,
            created_by: user.id,
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`Error en base de datos: ${dbError.message}`);
        }

        uploadedAssets.push(data);
      } catch (innerError: any) {
        return NextResponse.json({ error: `Fallo en archivo ${file.name}: ${innerError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, assets: uploadedAssets });
  } catch (error: any) {
    console.error("Error POST assets:", error);
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  try {
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from("assets").select("*").eq("is_global", true);

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("asset_type") || error.code === "22P02") {
        return NextResponse.json({ assets: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ assets: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  try {
    const { supabaseAdmin } = admin;
    const { data: asset } = await supabaseAdmin.from("assets").select("url").eq("id", id).single();

    if (!asset) return NextResponse.json({ error: "Asset no encontrado" }, { status: 404 });

    try {
      const urlObj = new URL(asset.url);
      const key = urlObj.pathname.startsWith("/") ? urlObj.pathname.slice(1) : urlObj.pathname;
      await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
    } catch (s3Error) {
      console.warn("Error borrando en S3, procediendo con DB:", s3Error);
    }

    await supabaseAdmin.from("assets").delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
