import { NextRequest } from 'next/server';
import { prisma } from '@/libs/prisma';
import { validateRequest } from '@/libs/security';

// GET: 投票期限を取得
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

    const voteLimit = await prisma.restaurantVoteLimit.findUnique({
      where: { eventId }
    });

    if (!voteLimit) {
      return new Response(
        JSON.stringify({ message: '投票期限が設定されていません' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(voteLimit),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('投票期限取得エラー:', error);
    return new Response(
      JSON.stringify({ error: '投票期限の取得に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST: 投票期限を設定または更新
export async function POST(request: NextRequest) {
  try {
    // リクエスト元の検証
    const validationError = validateRequest(request);
    if (validationError) {
      return validationError;
    }
    
    const body = await request.json();
    const { eventId, deadline } = body;

    if (!eventId || !deadline) {
      return new Response(
        JSON.stringify({ error: 'eventIdとdeadlineは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 日付文字列をDateオブジェクトに変換
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return new Response(
        JSON.stringify({ error: '無効な日付形式です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 既存の投票期限を確認
    const existingVoteLimit = await prisma.restaurantVoteLimit.findUnique({
      where: { eventId }
    });

    let voteLimit;
    if (existingVoteLimit) {
      // 更新
      voteLimit = await prisma.restaurantVoteLimit.update({
        where: { eventId },
        data: { deadline: deadlineDate }
      });
    } else {
      // 新規作成
      voteLimit = await prisma.restaurantVoteLimit.create({
        data: {
          eventId,
          deadline: deadlineDate
        }
      });
    }

    return new Response(
      JSON.stringify(voteLimit),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('投票期限設定エラー:', error);
    return new Response(
      JSON.stringify({ error: '投票期限の設定に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE: 投票期限を削除
export async function DELETE(request: NextRequest) {
  try {
    // リクエスト元の検証
    const validationError = validateRequest(request);
    if (validationError) {
      return validationError;
    }
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'eventIdパラメータが必要です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 既存の投票期限を確認
    const existingVoteLimit = await prisma.restaurantVoteLimit.findUnique({
      where: { eventId }
    });

    if (!existingVoteLimit) {
      return new Response(
        JSON.stringify({ message: '投票期限が設定されていません' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 投票期限を削除
    await prisma.restaurantVoteLimit.delete({
      where: { eventId }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '投票期限が削除されました' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('投票期限削除エラー:', error);
    return new Response(
      JSON.stringify({ error: '投票期限の削除に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 