import { NextRequest } from 'next/server';
import { prisma } from '@/libs/prisma';

// POST: 新しい投票を登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, restaurantId, voterToken } = body;

    if (!eventId || !restaurantId || !voterToken) {
      return new Response(
        JSON.stringify({ error: 'eventId、restaurantId、voterTokenは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 同じイベントに対して同じユーザーが既に投票していないか確認
    const existingVote = await prisma.vote.findFirst({
      where: {
        eventId,
        voterToken
      }
    });

    // 既に投票がある場合は、その投票を削除
    if (existingVote) {
      await prisma.vote.delete({
        where: {
          id: existingVote.id
        }
      });
    }

    // 新しい投票を作成
    const vote = await prisma.vote.create({
      data: {
        eventId,
        restaurantId,
        voterToken
      }
    });

    // 最新の投票情報を含むレストラン情報を取得
    const restaurants = await prisma.restaurant.findMany({
      where: { eventId },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    return new Response(
      JSON.stringify({ 
        vote, 
        restaurants,
        message: '投票が完了しました'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('投票登録エラー:', error);
    return new Response(
      JSON.stringify({ error: '投票の登録に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET: 投票情報を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const voterToken = searchParams.get('voterToken');

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'eventIdパラメータが必要です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let query: any = { eventId };
    
    // 特定の投票者のみの結果を取得する場合
    if (voterToken) {
      query.voterToken = voterToken;
    }

    const votes = await prisma.vote.findMany({
      where: query,
      include: {
        restaurant: true
      }
    });

    // 最新の投票情報を含むレストラン情報を取得
    const restaurants = await prisma.restaurant.findMany({
      where: { eventId },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    return new Response(
      JSON.stringify({ votes, restaurants }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('投票取得エラー:', error);
    return new Response(
      JSON.stringify({ error: '投票情報の取得に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE: 投票を取り消し
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const voterToken = searchParams.get('voterToken');

    if (!eventId || !voterToken) {
      return new Response(
        JSON.stringify({ error: 'eventIdとvoterTokenは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 削除対象の投票を検索
    const vote = await prisma.vote.findFirst({
      where: {
        eventId,
        voterToken
      }
    });

    if (!vote) {
      return new Response(
        JSON.stringify({ error: '指定された投票が見つかりません' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 投票を削除
    await prisma.vote.delete({
      where: {
        id: vote.id
      }
    });

    // 最新の投票情報を含むレストラン情報を取得
    const restaurants = await prisma.restaurant.findMany({
      where: { eventId },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        restaurants,
        message: '投票を取り消しました' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('投票削除エラー:', error);
    return new Response(
      JSON.stringify({ error: '投票の取り消しに失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 