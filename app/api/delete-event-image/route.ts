import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
// AWS S3 SDK実装を追加
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function DELETE(request: Request) {
  try {
    // リクエストボディからデータを取得
    const body = await request.json();
    const { eventId, imageId } = body;
    
    if (!eventId || !imageId) {
      return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
    }
    
    // 画像が存在するか確認
    const image = await prisma.eventImage.findUnique({
      where: {
        id: imageId,
      },
    });
    
    // 画像が見つからない場合
    if (!image) {
      return NextResponse.json({ error: '画像が見つかりません' }, { status: 404 });
    }
    
    console.log('削除対象の画像情報:', { imagePath: image.imagePath, imageId });
    
    try {
      // R2からオブジェクトを削除する処理
      // URLからオブジェクトキーのみを抽出
      const objectKey = extractObjectKey(image.imagePath);
      // バケット名は環境変数から取得
      const bucketName = process.env.BUCKET_NAME || null;
      
      console.log('R2削除情報:', { bucketName, objectKey });
      
      if (bucketName && objectKey) {
        // 環境変数から認証情報を取得
        const r2Endpoint = process.env.R2_ENDPOINT;
        const r2AccessKey = process.env.R2_ACCESS_KEY;
        const r2SecretKey = process.env.R2_SECRET_KEY;
        
        if (!r2Endpoint || !r2AccessKey || !r2SecretKey) {
          console.error('R2環境変数が設定されていません:', {
            hasEndpoint: !!r2Endpoint,
            hasAccessKey: !!r2AccessKey,
            hasSecretKey: !!r2SecretKey
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
          
          console.log('S3クライアント初期化:', {
            endpoint: r2Endpoint,
            bucket: bucketName,
            objectKey
          });
          
          // DeleteObjectコマンドを作成
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
          });
          
          // オブジェクトを削除
          try {
            const deleteResult = await s3Client.send(deleteCommand);
            console.log('R2オブジェクト削除成功:', deleteResult);
          } catch (s3Error) {
            console.error('R2オブジェクト削除エラー:', s3Error);
          }
        }
      } else {
        console.warn('R2オブジェクト情報が不足しています:', {
          bucketName,
          objectKey,
          imagePath: image.imagePath
        });
      }
    } catch (cloudflareError) {
      // エラーをログに記録するが、データベースからの削除は継続
      console.error('R2削除エラー:', cloudflareError);
    }
    
    // データベースから画像を削除
    const deletedImage = await prisma.eventImage.delete({
      where: {
        id: imageId,
      },
    });
    
    // 削除に成功した場合
    return NextResponse.json({
      message: '画像がデータベースから削除されました',
      deletedImage,
    }, { status: 200 });
    
  } catch (error) {
    console.error('画像削除エラー:', error);
    return NextResponse.json({ error: '画像の削除中にエラーが発生しました' }, { status: 500 });
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