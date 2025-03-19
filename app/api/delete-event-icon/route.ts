import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/libs/prisma';
// AWS S3 SDK実装を追加
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { validateRequest } from "@/libs/security";

export async function DELETE(request: Request) {
  try {
    // リクエスト元の検証（NextRequestの型に変換）
    const nextRequest = request as unknown as NextRequest;
    const validationError = validateRequest(nextRequest);
    if (validationError) {
      return validationError;
    }
    
    // リクエストボディからデータを取得
    const body = await request.json();
    const { eventId, imageUrl } = body;
    
    if (!eventId || !imageUrl) {
      return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
    }
    
    console.log('削除対象のアイコン情報:', { imageUrl, eventId });
    
    // イベントが存在するか確認
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });
    
    // イベントが見つからない場合
    if (!event) {
      return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 });
    }
    
    try {
      // R2からオブジェクトを削除する処理
      // URLからオブジェクトキーのみを抽出
      const objectKey = extractObjectKey(imageUrl);
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
          return NextResponse.json({ error: 'R2環境変数が設定されていません' }, { status: 500 });
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
            
            // 削除に成功した場合
            return NextResponse.json({
              message: 'イベントアイコン画像が削除されました',
              imageUrl,
            }, { status: 200 });
          } catch (s3Error) {
            console.error('R2オブジェクト削除エラー:', s3Error);
            return NextResponse.json({ error: 'R2オブジェクト削除エラー' }, { status: 500 });
          }
        }
      } else {
        console.warn('R2オブジェクト情報が不足しています:', {
          bucketName,
          objectKey,
          imageUrl
        });
        return NextResponse.json({ error: 'R2オブジェクト情報が不足しています' }, { status: 400 });
      }
    } catch (cloudflareError) {
      // エラーをログに記録
      console.error('R2削除エラー:', cloudflareError);
      return NextResponse.json({ error: 'R2削除エラー' }, { status: 500 });
    }
  } catch (error) {
    console.error('イベントアイコン削除エラー:', error);
    return NextResponse.json({ error: 'イベントアイコンの削除中にエラーが発生しました' }, { status: 500 });
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