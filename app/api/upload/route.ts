import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/libs/prisma";

// 2MBのサイズ制限（バイト単位）
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Cloudflare R2のURLからオブジェクトキーを抽出する関数
function extractObjectKey(url: string): string | null {
  const domain = process.env.R2_PUBLIC_BUCKET_DOMAIN;
  if (!domain || !url.startsWith(domain)) {
    return null;
  }
  
  // ドメイン部分を削除してキーを取得
  return url.substring(domain.length + 1); // +1 で先頭の/も削除
}

// 画像を削除する関数
async function deleteImage(imageUrl: string) {
  try {
    const objectKey = extractObjectKey(imageUrl);
    if (!objectKey) {
      console.error("画像URLからオブジェクトキーを抽出できませんでした:", imageUrl);
      return false;
    }
    
    const s3 = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_KEY!,
      },
    });
    
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: objectKey,
      })
    );
    
    console.log("画像を削除しました:", objectKey);
    return true;
  } catch (error) {
    console.error("画像削除中にエラーが発生しました:", error);
    return false;
  }
}

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
    let folder = formData.get("folder") as string || "images";
    // レストランIDを取得（レストラン画像の場合）
    const restaurantId = formData.get("restaurantId") as string || null;
    // 古い画像のURLを取得（編集時）
    const oldImageUrl = formData.get("oldImageUrl") as string || null;

    // レストランからのアップロードでフォルダが指定されていない場合はrestaurant-imagesを使用
    if (restaurantId && !formData.get("folder")) {
      folder = "restaurant-images";
    }

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
      
      // キーの生成
      let key: string;
      
      // フォルダがimagesで、イベントアイコンの場合は直下に保存
      if (folder === 'images') {
        key = `${folder}/${Date.now()}.${extension}`;
      }
      // 思い出アルバムやレストラン画像の場合はイベントID/レストランIDを含める
      else {
        key = `${folder}/${eventId}/${Date.now()}.${extension}`;
      }

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
      
      if (folder === 'restaurant-images' && restaurantId) {
        // 古い画像がある場合は削除
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: { imageUrl: true }
        });
        
        if (restaurant?.imageUrl) {
          await deleteImage(restaurant.imageUrl);
        }
        
        // Restaurantテーブルに画像URLを保存
        await prisma.restaurant.update({
          where: { id: restaurantId },
          data: { imageUrl: imageUrl }
        });
      } else if (folder === 'images') {
        // イベントアイコンの場合
        if (oldImageUrl) {
          // 古い画像を削除
          await deleteImage(oldImageUrl);
        }
      } else if (folder !== 'restaurant-images') {
        // それ以外（イベント画像など）はEventImagesテーブルに登録
        await prisma.eventImage.create({
          data: {
            eventId: eventId,
            imagePath: imageUrl,
          },
        });
      }
    }

    // レストラン画像またはイベントアイコンの場合は単一のURLを返す
    if ((folder === 'restaurant-images' || folder === 'images') && uploadedUrls.length > 0) {
      return NextResponse.json({ url: uploadedUrls[0] }, { status: 201 });
    }

    // それ以外は配列で返す
    return NextResponse.json({ uploadedUrls }, { status: 201 });
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: "画像のアップロードに失敗しました" },
      { status: 500 }
    );
  }
}

// 画像削除エンドポイント
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: "削除する画像のURLが必要です" },
        { status: 400 }
      );
    }
    
    const success = await deleteImage(imageUrl);
    
    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "画像の削除に失敗しました" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "画像の削除に失敗しました" },
      { status: 500 }
    );
  }
}
