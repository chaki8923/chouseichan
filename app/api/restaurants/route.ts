import { NextRequest } from 'next/server';
import { prisma } from '@/libs/prisma';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// 画像URLからオブジェクトキーを抽出する関数
function extractObjectKey(url: string): string | null {
  if (!url) return null;
  
  try {
    console.log('元のURL:', url);
    
    // 正規表現を使ってパスを抽出
    // 例: https://example.com/restaurant-images/eventId/timestamp.jpg から restaurant-images/eventId/timestamp.jpg を抽出
    const regex = /\/([^\/]+\/[^\/]+\/[^\/]+\.[^\/]+)$/;
    const match = url.match(regex);
    
    if (match && match[1]) {
      console.log('抽出されたオブジェクトキー (正規表現):', match[1]);
      return match[1];
    }
    
    // 通常のURL解析を試みる
    const urlObj = new URL(url);
    // パスから先頭のスラッシュを削除
    let objectKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
    
    console.log('抽出されたオブジェクトキー (URL解析):', objectKey);
    return objectKey;
  } catch (e) {
    // URLパースに失敗した場合は、シンプルな方法でパスを抽出
    console.warn('URL解析エラー、代替手段を使用:', e);
    try {
      const parts = url.split('//');
      if (parts.length > 1) {
        // ドメイン以降のパスを結合
        const path = parts[1].split('/').slice(1).join('/');
        console.log('代替手段で抽出されたオブジェクトキー:', path);
        return path;
      }
      return null;
    } catch (fallbackError) {
      console.error('オブジェクトキー抽出エラー:', fallbackError);
      return null;
    }
  }
}

// CloudflareR2から画像を削除する関数
async function deleteImageFromCloudflare(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;
  console.log('削除対象の画像URL:', imageUrl);
  
  const objectKey = extractObjectKey(imageUrl);
  if (!objectKey) {
    console.error('オブジェクトキーを抽出できませんでした:', imageUrl);
    return false;
  }
  
  try {
    console.log('画像削除リクエスト送信:', objectKey);
    
    // 2つの方法で削除を試みる
    
    // 1. upload APIを使用した削除
    // try {
    //   const response = await fetch(`/api/upload?key=${encodeURIComponent(objectKey)}`, {
    //     method: 'DELETE',
    //   });
      
    //   if (response.ok) {
    //     console.log('画像削除成功 (upload API):', objectKey);
    //     return true;
    //   } else {
    //     const errorData = await response.json().catch(() => ({}));
    //     console.error('画像削除エラー (upload API):', errorData);
    //     // 失敗した場合は次の方法を試みる
    //   }
    // } catch (error) {
    //   console.error('画像削除リクエストエラー (upload API):', error);
    //   // エラーが発生しても次の方法を試みる
    // }
    
    // 2. S3クライアントを直接使用した削除
    try {
      // 必要な環境変数を取得
      const bucketName = process.env.BUCKET_NAME;
      const r2Endpoint = process.env.R2_ENDPOINT;
      const r2AccessKey = process.env.R2_ACCESS_KEY;
      const r2SecretKey = process.env.R2_SECRET_KEY;
      
      if (bucketName && r2Endpoint && r2AccessKey && r2SecretKey) {
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: r2Endpoint,
          credentials: {
            accessKeyId: r2AccessKey,
            secretAccessKey: r2SecretKey,
          },
        });
        
        // 削除コマンドを送信
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        });
        
        await s3Client.send(deleteCommand);
        console.log('画像削除成功 (S3 Client):', objectKey);
        return true;
      } else {
        console.error('R2環境変数が設定されていません');
        return false;
      }
    } catch (s3Error) {
      console.error('画像削除エラー (S3 Client):', s3Error);
      return false;
    }
  } catch (error) {
    console.error('画像削除リクエストエラー (全体):', error);
    return false;
  }
}

// GET: 特定イベントのレストラン情報を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'eventIdパラメータが必要です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const restaurants = await prisma.restaurant.findMany({
      where: { eventId },
      include: {
        _count: {
          select: { votes: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return new Response(
      JSON.stringify(restaurants),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('レストラン取得エラー:', error);
    return new Response(
      JSON.stringify({ error: 'レストラン情報の取得に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST: 新しいレストランを登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, imageUrl, websiteUrl, description, eventId } = body;

    // バリデーション
    if (!name || !eventId) {
      return new Response(
        JSON.stringify({ error: '店舗名とイベントIDは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // レストラン登録
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        imageUrl,
        websiteUrl,
        description,
        eventId
      }
    });

    return new Response(
      JSON.stringify(restaurant),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('レストラン登録エラー:', error);
    return new Response(
      JSON.stringify({ error: 'レストランの登録に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PATCH: レストラン情報を更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, imageUrl, websiteUrl, description, oldImageUrl } = body;

    // バリデーション
    if (!id || !name) {
      return new Response(
        JSON.stringify({ error: 'IDと店舗名は必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // レストランが存在するか確認
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id }
    });

    if (!existingRestaurant) {
      return new Response(
        JSON.stringify({ error: '指定されたレストランが見つかりません' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 古い画像を削除する必要がある場合
    if (oldImageUrl && imageUrl !== oldImageUrl) {
      console.log('レストラン更新: 古い画像の削除を開始します', oldImageUrl);
      const imageDeleteResult = await deleteImageFromCloudflare(oldImageUrl);
      console.log('古い画像削除結果:', imageDeleteResult);
      
      // 画像削除に失敗した場合でもエラーにはせず、ログだけ残す
      if (!imageDeleteResult) {
        console.warn('古い画像の削除に失敗しましたが、レストラン情報の更新は続行します');
      }
    }

    // レストラン更新
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(websiteUrl !== undefined ? { websiteUrl } : {}),
        ...(description !== undefined ? { description } : {})
      },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    return new Response(
      JSON.stringify(restaurant),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('レストラン更新エラー:', error);
    return new Response(
      JSON.stringify({ error: 'レストランの更新に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE: レストランを削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'idパラメータが必要です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 削除する前にレストラン情報と投票数を取得
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    if (!restaurant) {
      return new Response(
        JSON.stringify({ error: '指定されたレストランが見つかりません' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 投票がある場合は削除を禁止
    if (restaurant._count && restaurant._count.votes > 0) {
      return new Response(
        JSON.stringify({ 
          error: '投票のある店舗は削除できません', 
          votesCount: restaurant._count.votes 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 画像があれば先に削除を試みる
    let imageDeleteResult = false;
    if (restaurant.imageUrl) {
      console.log('レストラン削除: 関連画像の削除を開始します', restaurant.imageUrl);
      imageDeleteResult = await deleteImageFromCloudflare(restaurant.imageUrl);
      console.log('画像削除結果:', imageDeleteResult);
    }

    // レストランを削除
    await prisma.restaurant.delete({
      where: { id }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'レストランが削除されました', 
        imageDeleted: restaurant.imageUrl ? imageDeleteResult : null 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('レストラン削除エラー:', error);
    return new Response(
      JSON.stringify({ error: 'レストランの削除に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 