import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextRequest } from 'next/server';
import { validateRequest } from '@/libs/security';

export async function GET(request: Request) {
  // リクエスト元の検証（NextRequestの型に変換）
  const nextRequest = request as unknown as NextRequest;
  // GET操作はデータ取得のみなので、リファラーチェックはコメントアウト（任意で有効化可能）
  // const validationError = validateRequest(nextRequest);
  // if (validationError) {
  //   return validationError;
  // }
  
  // URLからeventIdを取得
  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'Invalid eventId' }, { status: 400 });
  }

  try {
    const images = await prisma.eventImage.findMany({
      where: { eventId },
      select: { id: true, imagePath: true },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching event images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // リクエスト元の検証（NextRequestの型に変換）
  const nextRequest = request as unknown as NextRequest;
  const validationError = validateRequest(nextRequest);
  if (validationError) {
    return validationError;
  }
  
  // URLからeventIdを取得
  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId');

  if (!eventId) {
    return new Response(
      JSON.stringify({ error: 'イベントIDが必要です' }), 
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    console.log(`イベント画像削除開始: eventId=${eventId}`);
    
    // イベントに関連するすべての画像を取得
    const images = await prisma.eventImage.findMany({
      where: { eventId },
      select: { id: true, imagePath: true },
    });

    console.log(`削除対象イベント画像数: ${images.length}`);
    
    // 削除カウンター
    let deletedEventImageCount = 0;
    let deletedRestaurantImageCount = 0;

    // R2の設定情報を取得
    const bucketName = process.env.BUCKET_NAME || "";
    const r2Endpoint = process.env.R2_ENDPOINT || "";
    const r2AccessKey = process.env.R2_ACCESS_KEY || "";
    const r2SecretKey = process.env.R2_SECRET_KEY || "";
    
    let s3Client = null;
    
    if (!r2Endpoint || !r2AccessKey || !r2SecretKey || !bucketName) {
      console.error('R2環境変数が設定されていません:', {
        hasEndpoint: !!r2Endpoint,
        hasAccessKey: !!r2AccessKey,
        hasSecretKey: !!r2SecretKey,
        hasBucket: !!bucketName
      });
    } else {
      // S3クライアントを初期化（R2のS3互換APIを使用）
      s3Client = new S3Client({
        region: 'auto',
        endpoint: r2Endpoint,
        credentials: {
          accessKeyId: r2AccessKey,
          secretAccessKey: r2SecretKey,
        },
      });
      
      console.log('S3クライアント初期化完了');
      
      // 1. イベント画像の削除処理
      for (const image of images) {
        try {
          const objectKey = extractObjectKey(image.imagePath);
          if (objectKey) {
            console.log(`イベント画像削除処理: ${objectKey}`);
            
            // DeleteObjectコマンドを作成
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: objectKey,
            });
            
            // オブジェクトを削除
            await s3Client.send(deleteCommand);
            console.log(`イベント画像削除成功: ID=${image.id}, Path=${objectKey}`);
            deletedEventImageCount++;
          } else {
            console.warn(`オブジェクトキーの抽出に失敗: ${image.imagePath}`);
          }
        } catch (cloudflareError) {
          console.error(`イベント画像削除エラー (ID=${image.id}):`, cloudflareError);
        }
      }

      // 2. レストラン画像の削除処理
      try {
        // イベントに関連するレストランを取得
        const restaurants = await prisma.restaurant.findMany({
          where: { eventId },
          select: { id: true, imageUrl: true }
        });

        console.log(`削除対象レストラン数: ${restaurants.length}`);

        // レストラン画像を削除
        for (const restaurant of restaurants) {
          if (restaurant.imageUrl) {
            try {
              const objectKey = extractObjectKey(restaurant.imageUrl);
              if (objectKey) {
                console.log(`レストラン画像削除処理: ${objectKey}`);
                
                const deleteCommand = new DeleteObjectCommand({
                  Bucket: bucketName,
                  Key: objectKey,
                });
                
                await s3Client.send(deleteCommand);
                console.log(`レストラン画像削除成功: RestaurantID=${restaurant.id}, Path=${objectKey}`);
                deletedRestaurantImageCount++;
              }
            } catch (restaurantImageError) {
              console.error(`レストラン画像削除エラー (RestaurantID=${restaurant.id}):`, restaurantImageError);
            }
          }
        }

        // 3. restaurant-images/[eventId] フォルダにある他の画像も削除
        try {
          // restaurant-images/[eventId] プレフィックスでオブジェクトを検索
          const prefix = `restaurant-images/${eventId}/`;
          const listCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix
          });
          
          console.log(`フォルダ内の画像を検索: ${prefix}`);
          const listResult = await s3Client.send(listCommand);
          
          if (listResult.Contents && listResult.Contents.length > 0) {
            console.log(`フォルダ内に${listResult.Contents.length}件の画像が見つかりました`);
            
            for (const object of listResult.Contents) {
              if (object.Key) {
                try {
                  const deleteCommand = new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: object.Key
                  });
                  
                  await s3Client.send(deleteCommand);
                  console.log(`フォルダ内画像削除成功: ${object.Key}`);
                  deletedRestaurantImageCount++;
                } catch (folderImageError) {
                  console.error(`フォルダ内画像削除エラー (${object.Key}):`, folderImageError);
                }
              }
            }
          } else {
            console.log(`フォルダ内に削除すべき画像はありませんでした: ${prefix}`);
          }
        } catch (folderError) {
          console.error(`フォルダ内画像検索/削除エラー:`, folderError);
        }
      } catch (restaurantError) {
        console.error('レストラン画像削除処理エラー:', restaurantError);
      }
      
      // 4. イベントアイコンの削除処理
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { image: true }
      });
      
      if (event?.image) {
        console.log(`イベントアイコン削除処理: ${event.image}`);
        try {
          const objectKey = extractObjectKey(event.image);
          if (objectKey) {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: objectKey,
            });
            
            await s3Client.send(deleteCommand);
            console.log(`イベントアイコン削除成功: ${objectKey}`);
          }
        } catch (iconError) {
          console.error('イベントアイコン削除エラー:', iconError);
        }
      }
    }
    
    // データベースから画像レコードを削除
    await prisma.eventImage.deleteMany({
      where: { eventId },
    });

    console.log(`画像削除完了: eventId=${eventId}, イベント画像削除数=${deletedEventImageCount}, レストラン画像削除数=${deletedRestaurantImageCount}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `イベント(${eventId})の画像がすべて削除されました`, 
        eventImageCount: deletedEventImageCount,
        restaurantImageCount: deletedRestaurantImageCount
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    const errorMessage = error?.message || "不明なエラー";
    console.error(`イベント画像削除エラー: ${errorMessage}`);
    console.error(error);
    
    return new Response(
      JSON.stringify({ 
        error: '内部サーバーエラー', 
        details: errorMessage 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * URLからオブジェクトキーのみを抽出する関数
 */
function extractObjectKey(url: string): string | null {
  if (!url) return null;
  
  try {
    console.log('URL解析開始:', url);
    
    // URLオブジェクトを使用してパスだけを抽出
    const urlObj = new URL(url);
    // パスから先頭のスラッシュを削除
    const objectKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
    
    console.log('抽出されたオブジェクトキー:', objectKey);
    return objectKey;
  } catch (e) {
    // URLパースに失敗した場合は、シンプルな方法でパスを抽出
    console.warn('URL解析エラー、代替手段を使用:', e);
    try {
      const parts = url.split('//');
      if (parts.length > 1) {
        const pathParts = parts[1].split('/');
        // 最初のセグメント（ドメイン）を除外した残りの部分をパスとして使用
        if (pathParts.length > 1) {
          const objectKey = pathParts.slice(1).join('/');
          console.log('代替手段で抽出されたオブジェクトキー:', objectKey);
          return objectKey;
        }
      }
      return null;
    } catch (fallbackError) {
      console.error('オブジェクトキー抽出エラー:', fallbackError);
      return null;
    }
  }
}