import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/libs/prisma";

// 2MBのサイズ制限（バイト単位）
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const eventId = formData.get("eventId") as string;
    const imageFiles = formData.getAll("file") as File[];
    // フォルダ名を取得（指定がなければデフォルト値を使用）
    const folder = formData.get("folder") as string || "images";

    if (!eventId) {
      return NextResponse.json(
        { error: "eventIdは必須です" },
        { status: 400 }
      );
    }
    
    // ファイルサイズチェック
    for (const imageFile of imageFiles) {
      if (imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "画像サイズは2MB以下にしてください。画像を圧縮するには画像圧縮ツールをご利用ください。" },
          { status: 400 }
        );
      }
    }

    const uploadedUrls: string[] = [];

    const s3 = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_KEY!,
      },
    });

    for (const imageFile of imageFiles) {
      const extension = imageFile.name.split(".").pop() || "jpg";
      const arrayBuffer = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      // 動的にフォルダ名を指定
      const key = `${folder}/${eventId}/${Date.now()}.${extension}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: key,
          ContentType: imageFile.type,
          Body: imageBuffer,
        })
      );

      const imageUrl = `${process.env.R2_PUBLIC_BUCKET_DOMAIN}/${key}`;
      uploadedUrls.push(imageUrl);
      
      // EventImages テーブルに登録
      await prisma.eventImage.create({
        data: {
          eventId: eventId,
          imagePath: imageUrl,
        },
      });
    }

    return NextResponse.json({ uploadedUrls }, { status: 201 });
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: "画像のアップロードに失敗しました" },
      { status: 500 }
    );
  }
}
