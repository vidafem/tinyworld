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

async function requireParentForChild(req: NextRequest, childId: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const user = userData.user;

  if (userError || !user) return null;

  const { data: child } = await supabaseAdmin
    .from("children")
    .select("id,parent_id")
    .eq("id", childId)
    .single();

  if (!child || child.parent_id !== user.id) return null;

  return user;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files").filter((file): file is File => file instanceof File);
  const childId = String(formData.get("childId") || "");
  const moduleName = slugPart(String(formData.get("module") || "general"));
  const section = slugPart(String(formData.get("section") || "uploads"));
  const mediaType = slugPart(String(formData.get("mediaType") || "file"));
  const monthNumber = Number(formData.get("monthNumber") || 0);

  if (!childId || files.length === 0) {
    return NextResponse.json({ error: "Faltan archivos o childId." }, { status: 400 });
  }

  const user = await requireParentForChild(req, childId);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    return NextResponse.json({ error: "Cloudflare R2 no está configurado." }, { status: 500 });
  }

  const monthFolder = monthNumber > 0 ? `month-${String(monthNumber).padStart(2, "0")}` : "unassigned";
  const uploaded = [];

  for (const file of files) {
    const ext = extensionFromFile(file);
    const baseName = slugPart(file.name.replace(/\.[^.]+$/, "")) || "media";
    const key = [
      "children",
      childId,
      moduleName,
      section,
      monthFolder,
      mediaType,
      `${Date.now()}-${crypto.randomUUID()}-${baseName}.${ext}`,
    ].join("/");

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type || "application/octet-stream",
        Metadata: {
          childId,
          ownerId: user.id,
          module: moduleName,
          section,
          mediaType,
        },
      })
    );

    uploaded.push({
      key,
      url: `${publicUrl}/${key}`,
      type: file.type,
      size: file.size,
      name: file.name,
    });
  }

  return NextResponse.json({ uploaded });
}
