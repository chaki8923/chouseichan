import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function GET(request: Request) {
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

    console.log(`削除対象画像数: ${images.length}`);
    
    if (images.length === 0) {
      console.log(`削除する画像がありません: eventId=${eventId}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `イベント(${eventId})に削除すべき画像はありませんでした`, 
          count: 0 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Cloudflare R2からの削除
    const bucketName = process.env.BUCKET_NAME || null;
    const r2Endpoint = process.env.R2_ENDPOINT;
    const r2AccessKey = process.env.R2_ACCESS_KEY;
    const r2SecretKey = process.env.R2_SECRET_KEY;
    
    if (!r2Endpoint || !r2AccessKey || !r2SecretKey || !bucketName) {
      console.error('R2環境変数が設定されていません:', {
        hasEndpoint: !!r2Endpoint,
        hasAccessKey: !!r2AccessKey,
        hasSecretKey: !!r2SecretKey,
        hasBucket: !!bucketName
      });
    } else {
      // S3クライアントを初期化（R2のS3互換APIを使用）
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: r2Endpoint,
        credentials: {
          accessKeyId: r2AccessKey,
          secretAccessKey: r2SecretKey,
        },
      });
      
      console.log('S3クライアント初期化完了');
      
      // すべての画像に対してCloudflareの削除処理を実行
      for (const image of images) {
        try {
          const objectKey = extractObjectKey(image.imagePath);
          if (objectKey) {
            console.log(`R2オブジェクト削除処理: ${objectKey}`);
            
            // DeleteObjectコマンドを作成
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: objectKey,
            });
            
            // オブジェクトを削除
            const deleteResult = await s3Client.send(deleteCommand);
            console.log(`R2オブジェクト削除成功: ID=${image.id}, Path=${objectKey}`);
          } else {
            console.warn(`オブジェクトキーの抽出に失敗: ${image.imagePath}`);
          }
        } catch (cloudflareError) {
          console.error(`R2オブジェクト削除エラー (ID=${image.id}):`, cloudflareError);
        }
      }
    }
    
    // イベントアイコンの削除処理
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { image: true }
    });
    
    if (event?.image) {
      console.log(`イベントアイコン削除処理: ${event.image}`);
      try {
        if (bucketName && r2Endpoint && r2AccessKey && r2SecretKey) {
          const s3Client = new S3Client({
            region: 'auto',
            endpoint: r2Endpoint,
            credentials: {
              accessKeyId: r2AccessKey,
              secretAccessKey: r2SecretKey,
            },
          });
          
          const objectKey = extractObjectKey(event.image);
          if (objectKey) {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: objectKey,
            });
            
            await s3Client.send(deleteCommand);
            console.log(`イベントアイコン削除成功: ${objectKey}`);
          }
        }
      } catch (iconError) {
        console.error('イベントアイコン削除エラー:', iconError);
      }
    }
    
    // データベースから画像レコードを削除
    await prisma.eventImage.deleteMany({
      where: { eventId },
    });

    console.log(`画像削除完了: eventId=${eventId}, 削除数=${images.length}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `イベント(${eventId})の画像がすべて削除されました`, 
        count: images.length 
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