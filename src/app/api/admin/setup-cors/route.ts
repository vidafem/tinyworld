import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const bucket = process.env.R2_BUCKET_NAME;
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!bucket || !accountId || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { 
          error: "Faltan variables de entorno de R2 en el servidor.",
          details: { 
            bucket: !!bucket, 
            accountId: !!accountId, 
            accessKeyId: !!accessKeyId, 
            secretAccessKey: !!secretAccessKey 
          }
        },
        { status: 500 }
      );
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedOrigins: ["https://tinyworld-rho.vercel.app", "http://localhost:3000"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: `CORS configurado exitosamente para el bucket "${bucket}".`,
      allowedOrigins: ["https://tinyworld-rho.vercel.app", "http://localhost:3000"],
    });
  } catch (err: any) {
    console.error("Error al configurar CORS en R2:", err);
    return NextResponse.json(
      { error: "Error al configurar CORS en R2.", details: err.message || err },
      { status: 500 }
    );
  }
}
