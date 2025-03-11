import { NextRequest } from 'next/server';
import { prisma } from '@/libs/prisma';

// 画像URLからオブジェクトキーを抽出する関数
function extractObjectKey(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    
    // パスからファイル名を抽出（/event-images/xxxxxx.jpg の形式を想定）
    const match = pathname.match(/\/([^\/]+\/[^\/]+)$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('URL解析エラー:', error);
    return null;
  }
}

// CloudflareR2から画像を削除する関数
async function deleteImageFromCloudflare(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;
  
  const objectKey = extractObjectKey(imageUrl);
  if (!objectKey) {
    console.error('オブジェクトキーを抽出できませんでした:', imageUrl);
    return false;
  }
  
  try {
    const response = await fetch(`/api/upload?key=${encodeURIComponent(objectKey)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('画像削除エラー:', errorData);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('画像削除リクエストエラー:', error);
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
      orderBy: { createdAt: 'desc' }
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
      await deleteImageFromCloudflare(oldImageUrl);
    }

    // レストラン更新
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name,
        imageUrl,
        websiteUrl,
        description
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

    // レストランを削除
    await prisma.restaurant.delete({
      where: { id }
    });

    // 画像があれば削除
    if (restaurant.imageUrl) {
      const deleteResult = await deleteImageFromCloudflare(restaurant.imageUrl);
      console.log('画像削除結果:', deleteResult);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'レストランが削除されました' }),
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