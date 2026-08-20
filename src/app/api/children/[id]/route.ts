import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getRequestUser, getSupabaseAdmin } from "@/lib/serverAuth";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

function publicChildPayload(child: any) {
  return {
    id: child.id,
    name: child.name,
    nickname: child.nickname,
    birth_date: child.birth_date,
    birth_time: child.birth_time,
    weight: child.weight,
    height: child.height,
    gender: child.gender,
    cover_image: child.cover_image,
    theme_color: child.theme_color,
    birth_hospital: child.birth_hospital,
    father_name: child.father_name,
    mother_name: child.mother_name,
    preview_config: child.preview_config,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: childId } = await params;

  if (!childId) {
    return NextResponse.json({ error: "Falta el ID del bebe." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: child, error: childError } = await supabaseAdmin
    .from("children")
    .select("*")
    .eq("id", childId)
    .single();

  if (childError || !child) {
    return NextResponse.json({ error: "Bebe no encontrado." }, { status: 404 });
  }

  const user = await getRequestUser(req);
  const isOwner = Boolean(user && child.parent_id === user.id);
  const previewConfig = child.preview_config || {};

  const { data: stages } = await supabaseAdmin
    .from("life_sections")
    .select(isOwner ? "*" : "id,title,created_at,baby_weight,baby_height,baby_photo,show_in_books")
    .eq("child_id", childId)
    .order("created_at", { ascending: true });

  const { data: folders } = await supabaseAdmin
    .from("pregnancy_folders")
    .select(isOwner ? "*" : "id, name")
    .eq("child_id", childId);

  const visibleFolders = isOwner
    ? folders || []
    : (folders || []).filter((folder: any) => previewConfig.folders?.[folder.id] !== false);

  let folderItems: any[] = [];
  if (visibleFolders.length > 0) {
    const folderIds = visibleFolders.map((folder: any) => folder.id);
    const { data: items } = await supabaseAdmin
      .from("pregnancy_folder_items")
      .select("folder_id, memory_id, media_url")
      .in("folder_id", folderIds);
    folderItems = items || [];
  }

  // Cargar recuerdos de embarazo (ecografías, fotos, hitos)
  const { data: pregnancyMemories } = await supabaseAdmin
    .from("pregnancy_memories")
    .select("*")
    .eq("child_id", childId)
    .order("memory_date", { ascending: false });

  // Cargar recuerdos generales del bebé
  const { data: generalMemories } = await supabaseAdmin
    .from("general_memories")
    .select("*")
    .eq("child_id", childId)
    .order("memory_date", { ascending: false });

  // Cargar calendarios
  const { data: calendars } = await supabaseAdmin
    .from("pregnancy_calendars")
    .select("*")
    .eq("child_id", childId);

  // Cargar páginas del álbum digital
  const { data: albumPages } = await supabaseAdmin
    .from("pregnancy_album_pages")
    .select("*")
    .eq("child_id", childId)
    .order("page_number", { ascending: true });

  return NextResponse.json({
    child: isOwner ? child : publicChildPayload(child),
    isOwner,
    stages: stages || [],
    folders: visibleFolders,
    folderItems,
    pregnancyMemories: pregnancyMemories || [],
    generalMemories: generalMemories || [],
    calendars: calendars || [],
    albumPages: albumPages || [],
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: childId } = await params;

  if (!childId) {
    return NextResponse.json({ error: "Falta el ID del bebe." }, { status: 400 });
  }

  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: child, error: childError } = await supabaseAdmin
    .from("children")
    .select("id, parent_id")
    .eq("id", childId)
    .single();

  if (childError || !child) {
    return NextResponse.json({ error: "Bebe no encontrado o error en base de datos." }, { status: 404 });
  }

  if (child.parent_id !== user.id) {
    return NextResponse.json({ error: "No tienes permisos para eliminar este perfil." }, { status: 403 });
  }

  const bucket = process.env.R2_BUCKET_NAME;
  if (bucket) {
    try {
      let continuationToken: string | undefined;

      do {
        const listedObjects = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: `children/${childId}/`,
            ContinuationToken: continuationToken,
          })
        );

        if (listedObjects.Contents?.length) {
          await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: {
                Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key })),
              },
            })
          );
        }

        continuationToken = listedObjects.NextContinuationToken;
      } while (continuationToken);
    } catch (r2Error) {
      console.error("Error al borrar archivos en Cloudflare R2:", r2Error);
    }
  }

  const { error: dbDeleteError } = await supabaseAdmin
    .from("children")
    .delete()
    .eq("id", childId);

  if (dbDeleteError) {
    console.error("Error al eliminar de base de datos:", dbDeleteError);
    return NextResponse.json({ error: "Error al borrar el perfil de la base de datos." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Bebe y contenido eliminado correctamente." });
}
